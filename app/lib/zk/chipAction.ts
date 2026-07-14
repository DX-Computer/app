import {
  concat,
  encodeAbiParameters,
  keccak256,
  numberToHex,
  sha256,
  sliceHex,
  type Hex,
} from "viem";
import { hash2 } from "./poseidon";
import { prove } from "./prover";
import { pathForCommitment } from "./chipEnrollments";
import type { IdentityLeaf, IdentityTree } from "./chipTree";

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_CHIP_BRIDGE || "http://localhost:7151";

const DOMAIN: Hex = "0x64782d6163742d76";
const DOMAIN_VERSION = 1;

let cachedDeviceSecret: Hex | null = null;
let inflightSeed: Promise<Hex> | null = null;

const requestDeviceSecret = async (): Promise<Hex> => {
  const res = await fetch(`${BRIDGE_URL}/seed`).catch(() => null);
  if (!res) {
    console.log("seed: bridge not reachable at", BRIDGE_URL);
    throw new Error("bridgeUnreachable");
  }
  const data = (await res.json().catch(() => ({}))) as {
    deviceSecret?: string;
    error?: string;
  };
  if (!res.ok || !data.deviceSecret) {
    console.log("seed failed", res.status, data.error);
    throw new Error("seedFailed");
  }
  cachedDeviceSecret = data.deviceSecret as Hex;
  return cachedDeviceSecret;
};

export const fetchDeviceSecret = async (): Promise<Hex> => {
  if (cachedDeviceSecret) return cachedDeviceSecret;
  if (!inflightSeed) {
    inflightSeed = requestDeviceSecret().finally(() => {
      inflightSeed = null;
    });
  }
  return inflightSeed;
};

export const forgetDeviceSecret = (): void => {
  cachedDeviceSecret = null;
};

export const peekDeviceSecret = (): Hex | null => cachedDeviceSecret;

export type ActBundle = {
  pubX: Hex;
  pubY: Hex;
  sigR: Hex;
  sigS: Hex;
  digest: Hex;
  inputs: {
    pub_x: string[];
    pub_y: string[];
    signature: string[];
    action_digest: string[];
  };
};

const ACT_STATUS_KEYS: Record<number, string> = {
  400: "badDigest",
  409: "actRejected",
  500: "verifyFailed",
  502: "chipError",
  504: "actTimeout",
};

export const fetchActBundle = async (
  digest: Hex,
  label: string,
): Promise<ActBundle> => {
  const q = `digest=${digest.slice(2)}&label=${encodeURIComponent(label)}`;
  const res = await fetch(`${BRIDGE_URL}/act?${q}`).catch(() => null);
  if (!res) {
    console.log("act: bridge not reachable at", BRIDGE_URL);
    throw new Error("bridgeUnreachable");
  }
  const data = (await res.json().catch(() => ({}))) as ActBundle & {
    error?: string;
  };
  if (!res.ok || !data.inputs) {
    console.log("act failed", res.status, data.error);
    throw new Error(ACT_STATUS_KEYS[res.status] ?? "actFailed");
  }
  return data;
};

export const scopeOf = (
  contract: Hex,
  actionTag: Hex,
  scopeSeed: bigint,
): bigint => {
  const encoded = encodeAbiParameters(
    [{ type: "address" }, { type: "bytes4" }, { type: "uint256" }],
    [contract, actionTag, scopeSeed],
  );
  return BigInt(keccak256(encoded)) >> 8n;
};

export const digestOf = (
  contract: Hex,
  chainId: number | bigint,
  actionTag: Hex,
  scope: bigint,
  payloadHash: Hex,
): Hex => {
  const preimage = concat([
    DOMAIN,
    numberToHex(DOMAIN_VERSION, { size: 1 }),
    numberToHex(BigInt(chainId), { size: 8 }),
    contract,
    actionTag,
    numberToHex(scope, { size: 32 }),
    payloadHash,
  ]);
  return sha256(preimage);
};

const bytes32ToField = (bytes: Hex): bigint => {
  const hi = BigInt(sliceHex(bytes, 0, 16));
  const lo = BigInt(sliceHex(bytes, 16, 32));
  return hash2(hi, lo);
};

export const seedField = async (): Promise<bigint> =>
  bytes32ToField(await fetchDeviceSecret());

export const peekSeedField = (): bigint | null =>
  cachedDeviceSecret ? bytes32ToField(cachedDeviceSecret) : null;

const pubkeyField = (pubX: Hex, pubY: Hex): bigint =>
  hash2(bytes32ToField(pubX), bytes32ToField(pubY));

export const identityCommitment = (
  deviceSecret: Hex,
  pubX: Hex,
  pubY: Hex,
): bigint => hash2(bytes32ToField(deviceSecret), pubkeyField(pubX, pubY));

export const nullifierHex = (deviceSecret: Hex, scope: bigint): Hex =>
  numberToHex(hash2(bytes32ToField(deviceSecret), scope), { size: 32 });

export const nullifierOf = (seed: bigint, scope: bigint): Hex =>
  numberToHex(hash2(seed, scope), { size: 32 });

export const bytesArray = (hex: Hex): number[] => {
  const clean = hex.slice(2);
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    out.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return out;
};

export type ChipActionProof = {
  proof: `0x${string}`;
  publicInputs: string[];
  merkleRoot: Hex;
  nullifier: Hex;
  scope: bigint;
};

export const chipActionProof = async (params: {
  contract: Hex;
  chainId: number | bigint;
  actionTag: Hex;
  scopeSeed: bigint;
  payloadHash: Hex;
  label: string;
  tree: IdentityTree;
  leaves: IdentityLeaf[];
}): Promise<ChipActionProof> => {
  const { contract, chainId, actionTag, scopeSeed, payloadHash, label, tree, leaves } =
    params;

  const deviceSecret = await fetchDeviceSecret();
  const scope = scopeOf(contract, actionTag, scopeSeed);
  const digest = digestOf(contract, chainId, actionTag, scope, payloadHash);
  const bundle = await fetchActBundle(digest, label);

  const commitment = identityCommitment(deviceSecret, bundle.pubX, bundle.pubY);
  const path = pathForCommitment(tree, leaves, commitment);
  if (!path) {
    console.log("commitment not found in the identity tree");
    throw new Error("notEnrolledOnChain");
  }

  const digestHi = BigInt(sliceHex(digest, 0, 16));
  const digestLo = BigInt(sliceHex(digest, 16, 32));
  const nullifier = hash2(bytes32ToField(deviceSecret), scope);

  const inputs: Record<string, unknown> = {
    action_digest: bundle.inputs.action_digest,
    pub_x: bundle.inputs.pub_x,
    pub_y: bundle.inputs.pub_y,
    signature: bundle.inputs.signature,
    device_secret: bytesArray(deviceSecret),
    siblings: path.siblings.map((s) => s.toString()),
    indices: path.indices,
    digest_hi: digestHi.toString(),
    digest_lo: digestLo.toString(),
    merkle_root: path.merkleRoot.toString(),
    scope: scope.toString(),
  };

  const { proof, publicInputs } = await prove("identity_action", inputs);
  return {
    proof,
    publicInputs,
    merkleRoot: numberToHex(path.merkleRoot, { size: 32 }),
    nullifier: numberToHex(nullifier, { size: 32 }),
    scope,
  };
};
