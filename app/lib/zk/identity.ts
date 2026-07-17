import { Identity } from "@semaphore-protocol/core";
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

export const notifyIdentity = (): void => {
  listeners.forEach((cb) => cb());
};

export const connectChip = async (): Promise<Identity> => {
  let retried = false;
  while (true) {
    const res = await fetch(`${BRIDGE_URL}/secret`).catch(() => null);
    if (!res) {
      console.log("secret: bridge not reachable at", BRIDGE_URL);
      throw new Error("bridgeUnreachable");
    }
    const data = (await res.json().catch(() => ({}))) as {
      identitySeed?: string;
      postSeed?: string;
      error?: string;
    };
    if (res.ok && data.identitySeed && data.postSeed) {
      chipIdentity = new Identity(data.identitySeed);
      chipPostSecret = BigInt(data.postSeed);
      notifyIdentity();
      return chipIdentity;
    }
    console.log("secret failed", res.status, data.error);
    if (!retried && (data.error || "").startsWith("device:")) {
      retried = true;
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }
    throw new Error(data.error || "seedFailed");
  }
};

export const disconnectChip = (): void => {
  chipIdentity = null;
  chipPostSecret = null;
  notifyIdentity();
};

export const getIdentity = (): Identity | null => chipIdentity;

export const ensureIdentity = (): Identity => {
  if (!chipIdentity) {
    throw new Error("chipNotConnected");
  }
  return chipIdentity;
};

export const SNARK_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export const toField = (v: string | bigint): string =>
  (BigInt(v) % SNARK_FIELD).toString();

export const ownerTagFor = (anchor: bigint): bigint => {
  if (chipPostSecret === null) {
    throw new Error("chipNotConnected");
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
    throw new Error("chipNotConnected");
  }
  return {
    device_secret: (chipPostSecret % SNARK_FIELD).toString(),
    content_salt: toField(anchor),
    owner_tag: toField(ownerTag),
    new_content_hash: toField(newContentHash),
    nonce: BigInt(nonce).toString(),
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

