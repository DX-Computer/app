import { x25519 } from "@noble/curves/ed25519";

type Hash = `0x${string}`;

export const SHIPPING_KEY_MESSAGE = "dx.computer shipping key v1";

export const ZERO_PUBKEY =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash;

const toHex = (b: Uint8Array): Hash =>
  `0x${Array.from(b)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;

const fromHex = (h: string): Uint8Array => {
  const clean = h.startsWith("0x") ? h.slice(2) : h;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

const privFromSignature = async (signature: string): Promise<Uint8Array> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    fromHex(signature) as BufferSource,
  );
  return new Uint8Array(digest);
};

export const pubkeyFromSignature = async (signature: string): Promise<Hash> => {
  const priv = await privFromSignature(signature);
  return toHex(x25519.getPublicKey(priv));
};

const aesKey = async (shared: Uint8Array): Promise<CryptoKey> => {
  const digest = await crypto.subtle.digest("SHA-256", shared as BufferSource);
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
};

export const encryptShipping = async (
  pubkey: string,
  text: string,
): Promise<Hash> => {
  const ephPriv = crypto.getRandomValues(new Uint8Array(32));
  const ephPub = x25519.getPublicKey(ephPriv);
  const shared = x25519.getSharedSecret(ephPriv, fromHex(pubkey));
  const key = await aesKey(shared);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(text),
    ),
  );
  const blob = new Uint8Array(32 + 12 + ct.length);
  blob.set(ephPub, 0);
  blob.set(iv, 32);
  blob.set(ct, 44);
  return toHex(blob);
};

export const decryptShipping = async (
  signature: string,
  blob: string,
): Promise<string | null> => {
  try {
    const priv = await privFromSignature(signature);
    const raw = fromHex(blob);
    const ephPub = raw.slice(0, 32);
    const iv = raw.slice(32, 44);
    const ct = raw.slice(44);
    const shared = x25519.getSharedSecret(priv, ephPub);
    const key = await aesKey(shared);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ct as BufferSource,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
};
