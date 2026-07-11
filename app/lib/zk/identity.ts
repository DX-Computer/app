import { Identity } from "@semaphore-protocol/core";
import { sha256, toHex } from "viem";
import { poseidon1 } from "poseidon-lite";
import { hash2 } from "./poseidon";

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_CHIP_BRIDGE || "http://localhost:7151";

let chipIdentity: Identity | null = null;
let chipPostSecret: bigint | null = null;

const listeners = new Set<() => void>();

export const subscribeIdentity = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const notifyIdentity = (): void => {
  listeners.forEach((cb) => cb());
};

export const connectChip = async (): Promise<Identity> => {
  const res = await fetch(`${BRIDGE_URL}/secret`).catch(() => null);
  if (!res) {
    throw new Error(
      `chip bridge not reachable at ${BRIDGE_URL} — open the rezygcki app and turn on the browser bridge`,
    );
  }
  const data = (await res.json().catch(() => ({}))) as {
    identitySeed?: string;
    postSeed?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(
      data.error
        ? `chip bridge error: ${data.error}`
        : `chip bridge returned ${res.status}`,
    );
  }
  if (!data.identitySeed || !data.postSeed) {
    throw new Error(data.error || "chip bridge returned no secret");
  }
  chipIdentity = new Identity(data.identitySeed);
  chipPostSecret = BigInt(data.postSeed);
  notifyIdentity();
  return chipIdentity;
};

export const disconnectChip = (): void => {
  chipIdentity = null;
  chipPostSecret = null;
  notifyIdentity();
};

export const getIdentity = (): Identity | null => chipIdentity;

export const ensureIdentity = (): Identity => {
  if (!chipIdentity) {
    throw new Error("chip not connected — tap connect first");
  }
  return chipIdentity;
};

export const fetchAttestation = async (
  freshHex: string,
): Promise<Record<string, unknown>> => {
  const res = await fetch(`${BRIDGE_URL}/attest?fresh=${freshHex}`).catch(
    () => null,
  );
  if (!res) {
    throw new Error(
      `chip bridge not reachable at ${BRIDGE_URL} — open the rezygcki app and turn on the browser bridge`,
    );
  }
  const data = (await res.json().catch(() => ({}))) as {
    inputs?: Record<string, unknown>;
    error?: string;
  };
  if (!res.ok || !data.inputs) {
    throw new Error(
      data.error
        ? `attestation failed: ${data.error}`
        : `attestation failed (bridge returned ${res.status})`,
    );
  }
  return data.inputs;
};

export const SNARK_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export const toField = (v: string | bigint): string =>
  (BigInt(v) % SNARK_FIELD).toString();

export const ownerTagFor = (anchor: bigint): bigint => {
  if (chipPostSecret === null) {
    throw new Error("chip not connected — tap connect first");
  }
  return hash2(chipPostSecret % SNARK_FIELD, anchor % SNARK_FIELD);
};

export const editProofInputs = (
  anchor: string,
  ownerTag: string,
  newContentHash: string,
  nonce: string | number,
): Record<string, string> => {
  if (chipPostSecret === null) {
    throw new Error("chip not connected — tap connect first");
  }
  return {
    device_secret: (chipPostSecret % SNARK_FIELD).toString(),
    content_salt: toField(anchor),
    owner_tag: toField(ownerTag),
    new_content_hash: toField(newContentHash),
    nonce: BigInt(nonce).toString(),
  };
};

export const freshnessFor = (commitment: bigint): string => {
  const be32 = toHex(commitment, { size: 32 });
  return sha256(be32).slice(2, 34);
};

export const enrollNullifierFrom = (chipIdHex: string): bigint =>
  poseidon1([BigInt(chipIdHex)]);

export const enrollProofInputs = (
  chipAttest: Record<string, unknown>,
  freshHex: string,
): Record<string, unknown> => {
  const chipId = String(chipAttest.chipId);
  const { chipId: _drop, ...rest } = chipAttest;
  void _drop;
  return {
    ...rest,
    fresh_bind: BigInt("0x" + freshHex).toString(),
    enroll_nullifier: enrollNullifierFrom(chipId).toString(),
  };
};

export const matchesOwnerTag = (anchor: string, ownerTag: string): boolean => {
  if (chipPostSecret === null) return false;
  try {
    return ownerTagFor(BigInt(anchor)) === BigInt(ownerTag);
  } catch {
    return false;
  }
};

