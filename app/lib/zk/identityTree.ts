import { encodeAbiParameters, keccak256, stringToHex, toHex } from "viem";
import { Group, Identity, generateProof, type SemaphoreProof } from "@semaphore-protocol/core";
import { subgraphQuery } from "@/app/lib/graphql/fetcher";
import { ENROLLMENTS_QUERY } from "@/app/lib/graphql/queries";
import { hash2 } from "./poseidon";

export const scopeHash = (scope: bigint): bigint =>
  BigInt(keccak256(toHex(scope, { size: 32 }))) >> 8n;

export const councilScope = (council: `0x${string}`, proposalId: bigint): bigint =>
  BigInt(
    keccak256(
      encodeAbiParameters(
        [{ type: "address" }, { type: "uint256" }],
        [council, proposalId],
      ),
    ),
  );

export const semaphoreNullifier = (
  scope: bigint,
  secretScalar: bigint,
): bigint => hash2(scopeHash(scope), secretScalar);

type RawEnroll = { commitment: string; leafIndex: number };

export const POST_SCOPE = BigInt(keccak256(stringToHex("matroid.content-post")));
export const PUBLISH_SCOPE = BigInt(keccak256(stringToHex("matroid.kit-publish")));

export const buildGroup = async (): Promise<Group | null> => {
  const data = await subgraphQuery<{ enrollments: RawEnroll[] }>(ENROLLMENTS_QUERY);
  const rows = (data?.enrollments ?? [])
    .slice()
    .sort((a, b) => a.leafIndex - b.leafIndex);
  if (rows.length === 0) return null;
  return new Group(rows.map((r) => BigInt(r.commitment)));
};

export const generateScopedProof = async (
  identity: Identity,
  group: Group,
  message: bigint,
  scope: bigint,
): Promise<SemaphoreProof | null> => {
  if (!group.members.includes(identity.commitment)) return null;
  return generateProof(identity, group, message, scope);
};

export type ContractSemaphoreProof = {
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
};

export const toContractProof = (proof: SemaphoreProof): ContractSemaphoreProof => {
  const [p0, p1, p2, p3, p4, p5, p6, p7] = proof.points.map((p) => BigInt(p));
  return {
    merkleTreeDepth: BigInt(proof.merkleTreeDepth),
    merkleTreeRoot: BigInt(proof.merkleTreeRoot),
    nullifier: BigInt(proof.nullifier),
    message: BigInt(proof.message),
    scope: BigInt(proof.scope),
    points: [p0, p1, p2, p3, p4, p5, p6, p7],
  };
};
