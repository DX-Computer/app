"use client";

import { useContext, useEffect, useState } from "react";
import {
  connectChip,
  disconnectChip,
  ensureIdentity,
  enrollNullifierFrom,
  enrollProofInputs,
  fetchAttestation,
  freshnessFor,
  getIdentity,
  ownerTagFor,
  subscribeIdentity,
} from "@/app/lib/zk/identity";
import { circuitAvailable, prove } from "@/app/lib/zk/prover";
import {
  buildGroup,
  generateScopedProof,
  toContractProof,
  PUBLISH_SCOPE,
} from "@/app/lib/zk/identityTree";
import { toHex32 } from "@/app/lib/zk/poseidon";
import { ChipEnrollData, ChipPublishData } from "../types/common.types";
import { ModalContext } from "@/app/providers";
import useIdentity from "./useIdentity";

type Hash = `0x${string}`;


const useChip = () => {
  const ctx = useContext(ModalContext);
  useIdentity(
    typeof getIdentity()?.commitment === "bigint"
      ? toHex32(getIdentity()!.commitment)
      : undefined,
  );
  const [connected, setConnected] = useState<boolean>(
    Boolean(getIdentity()),
  );
  const [commitment, setCommitment] = useState<Hash | undefined>(() => {
    const id = getIdentity();
    return id ? toHex32(id.commitment) : undefined;
  });
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(
    () =>
      subscribeIdentity(() => {
        const id = getIdentity();
        setConnected(Boolean(id));
        setCommitment(id ? toHex32(id.commitment) : undefined);
      }),
    [],
  );

  const connect = async (): Promise<void> => {
    setBusy(true);
    try {
      const id = await connectChip();
      setCommitment(toHex32(id.commitment));
      setConnected(true);
    } catch (e) {
      console.log("chip.connect failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "chip bridge not reachable",
      });
      setConnected(false);
      setCommitment(undefined);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = (): void => {
    disconnectChip();
    setConnected(false);
    setCommitment(undefined);
  };

  const enrollData = async (): Promise<ChipEnrollData | null> => {
    setBusy(true);
    try {
      const id = ensureIdentity();
      if (!(await circuitAvailable("enrollment"))) {
        throw new Error(
          "enrollment circuit missing at /circuits/enrollment.json",
        );
      }
      const freshHex = freshnessFor(id.commitment);
      ctx?.setTxStatus({
        phase: "pending",
        message: "awaitingChip",
      });
      const chipAttest = await fetchAttestation(freshHex);
      ctx?.setTxStatus({
        phase: "pending",
        message: "provingAttestation",
      });
      const inputs = enrollProofInputs(chipAttest, freshHex);
      const res = await prove("enrollment", inputs);
      return {
        commitment: toHex32(id.commitment),
        proof: res.proof,
        enrollNullifier: toHex32(
          enrollNullifierFrom(String(chipAttest.chipId)),
        ),
      };
    } catch (e) {
      console.log("chip.enrollData failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "chip not connected",
      });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const publishData = async (
    designHash: Hash,
  ): Promise<ChipPublishData | null> => {
    try {
      const sem = ensureIdentity();
      const group = await buildGroup();
      if (!group || !group.members.includes(sem.commitment)) {
        ctx?.setTxStatus({
          phase: "error",
          message: "chipNotEnrolled",
        });
        return null;
      }
      ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
      const proof = await generateScopedProof(
        sem,
        group,
        BigInt(designHash),
        PUBLISH_SCOPE,
      );
      if (!proof) {
        ctx?.setTxStatus({
          phase: "error",
          message: "chipNotEnrolled",
        });
        return null;
      }
      return {
        semaphoreProof: toContractProof(proof),
        ownerTag: toHex32(ownerTagFor(BigInt(designHash))),
      };
    } catch (e) {
      console.log("chip.publishData failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "chip not connected",
      });
      return null;
    }
  };

  return {
    connected,
    commitment,
    busy,
    connect,
    disconnect,
    enrollData,
    publishData,
  };
};

export default useChip;
