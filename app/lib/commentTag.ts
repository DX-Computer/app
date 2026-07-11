import { keccak256, stringToHex } from "viem";

export const commentTag = (kind: string, id: string): `0x${string}` =>
  keccak256(stringToHex(`${kind}:${id}`));
