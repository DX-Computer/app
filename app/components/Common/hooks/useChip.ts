"use client";

import { useContext, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { numberToHex, type Hex } from "viem";
import {
  connectChip,
  disconnectChip,
  getIdentity,
  notifyIdentity,
  subscribeIdentity,
} from "@/app/lib/zk/identity";
import { circuitAvailable } from "@/app/lib/zk/prover";
import { fetchDeviceSecret, forgetDeviceSecret } from "@/app/lib/zk/chipAction";
import { chipEnrollProof } from "@/app/lib/zk/chipEnroll";
import { buildIdentityTree } from "@/app/lib/zk/chipEnrollments";
import { merklePath } from "@/app/lib/zk/chipTree";
import { contractConfig } from "@/app/lib/contracts";
import { ChipEnrollData } from "../types/common.types";
import { ModalContext } from "@/app/providers";
import useIdentity from "./useIdentity";

type Hash = `0x${string}`;

const COMMITMENT_KEY = "dx-chip-commitment";

const storedCommitment = (): Hash | undefined => {
  if (typeof window === "undefined") return undefined;
  const v = window.localStorage.getItem(COMMITMENT_KEY);
  return v && /^0x[0-9a-fA-F]{64}$/.test(v) ? (v as Hash) : undefined;
};

const randomFreshHex = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const useChip = () => {
  const ctx = useContext(ModalContext);
  const registry = contractConfig("identityRegistry");
  const client = usePublicClient();
  const [commitment, setCommitment] = useState<Hash | undefined>(
    storedCommitment,
  );
  useIdentity(commitment);
  const [connected, setConnected] = useState<boolean>(
    Boolean(getIdentity()),
  );
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(
    () =>
      subscribeIdentity(() => {
        setConnected(Boolean(getIdentity()));
        setCommitment(storedCommitment());
      }),
    [],
  );

  const connect = async (): Promise<void> => {
    setBusy(true);
    try {
      await fetchDeviceSecret();
      await connectChip();
      setCommitment(storedCommitment());
      setConnected(true);
    } catch (e) {
      console.log("chip.connect failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "bridgeUnreachable",
      });
      setConnected(false);
      setCommitment(undefined);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = (): void => {
    disconnectChip();
    forgetDeviceSecret();
    setConnected(false);
    setCommitment(undefined);
  };

  const enrollData = async (): Promise<ChipEnrollData | null> => {
    setBusy(true);
    try {
      if (!(await circuitAvailable("enrollment"))) {
        throw new Error("circuitMissing");
      }
      if (!registry.ready || !client) {
        throw new Error("registryMissing");
      }
      ctx?.setTxStatus({
        phase: "pending",
        message: "awaitingChip",
      });
      const res = await chipEnrollProof(
        randomFreshHex(),
        () =>
          ctx?.setTxStatus({
            phase: "pending",
            message: "provingAttestation",
          }),
        async (c) => {
          try {
            return (await client.readContract({
              address: registry.address as Hex,
              abi: registry.abi,
              functionName: "enrolledCommitment",
              args: [c],
            })) as boolean;
          } catch {
            return false;
          }
        },
      );
      const commitmentHex = numberToHex(res.commitment, { size: 32 }) as Hash;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(COMMITMENT_KEY, commitmentHex);
      }
      setCommitment(commitmentHex);
      notifyIdentity();
      if (res.alreadyEnrolled) {
        ctx?.setTxStatus({ phase: "success" });
        return null;
      }
      const { tree, leaves } = await buildIdentityTree(
        client,
        registry.address as Hex,
      );
      const { siblings } = merklePath(tree, leaves.length);
      return {
        commitment: commitmentHex,
        proof: res.proof,
        enrollNullifier: res.enrollNullifier,
        freshBind: res.freshBind,
        siblings: siblings.map((s) => numberToHex(s, { size: 32 }) as Hash),
      };
    } catch (e) {
      console.log("chip.enrollData failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "chipNotConnected",
      });
      return null;
    } finally {
      setBusy(false);
    }
  };

  return {
    connected,
    commitment,
    busy,
    connect,
    disconnect,
    enrollData,
  };
};

export default useChip;
