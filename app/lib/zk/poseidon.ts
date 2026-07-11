import { poseidon2 } from "poseidon-lite";

export const hash2 = (a: bigint, b: bigint): bigint => poseidon2([a, b]);

export const toHex32 = (x: bigint): `0x${string}` =>
  `0x${x.toString(16).padStart(64, "0")}`;
