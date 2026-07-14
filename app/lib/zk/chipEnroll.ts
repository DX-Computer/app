import { numberToHex, type Hex } from "viem";
import { poseidon1 } from "poseidon-lite";
import { prove } from "./prover";
import {
  bytesArray,
  fetchDeviceSecret,
  identityCommitment,
} from "./chipAction";

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_CHIP_BRIDGE || "http://localhost:7151";

export type EnrollInputs = {
  capdu: string[];
  resp: string[];
  attstSig: string[];
  tbs: string[];
  certSig: string[];
  serial: string;
};

export const fetchEnrollInputs = async (
  freshHex: string,
): Promise<EnrollInputs> => {
  const res = await fetch(`${BRIDGE_URL}/enroll?fresh=${freshHex}`).catch(
    () => null,
  );
  if (!res) {
    console.log("enroll: bridge not reachable at", BRIDGE_URL);
    throw new Error("bridgeUnreachable");
  }
  const data = (await res.json().catch(() => ({}))) as {
    inputs?: EnrollInputs;
    error?: string;
  };
  if (!res.ok || !data.inputs) {
    console.log("enroll failed", res.status, data.error);
    const mapped: Record<number, string> = {
      409: "actRejected",
      502: "chipError",
      504: "actTimeout",
    };
    throw new Error(mapped[res.status] ?? "enrollFailed");
  }
  return data.inputs;
};

const decBytesToHex = (arr: string[], start: number, len: number): Hex => {
  let hex = "0x";
  for (let i = 0; i < len; i++) {
    hex += (Number(arr[start + i]) & 0xff).toString(16).padStart(2, "0");
  }
  return hex as Hex;
};

const foldBytesBE = (arr: string[], start: number, len: number): bigint => {
  let acc = 0n;
  for (let i = 0; i < len; i++) acc = acc * 256n + BigInt(arr[start + i]);
  return acc;
};

export type ChipEnrollProof = {
  proof: `0x${string}`;
  freshBind: Hex;
  enrollNullifier: Hex;
  commitment: bigint;
  alreadyEnrolled: boolean;
};

export const chipEnrollProof = async (
  freshHex: string,
  onProving?: () => void,
  precheck?: (commitment: bigint) => Promise<boolean>,
): Promise<ChipEnrollProof> => {
  const deviceSecret = await fetchDeviceSecret();
  const inputs = await fetchEnrollInputs(freshHex);

  const freshBindVal = foldBytesBE(inputs.capdu, 24, 16);
  const enrollNullifierVal = poseidon1([BigInt(inputs.serial)]);
  const pubX = decBytesToHex(inputs.resp, 5, 32);
  const pubY = decBytesToHex(inputs.resp, 37, 32);
  const commitment = identityCommitment(deviceSecret, pubX, pubY);

  if (precheck && (await precheck(commitment))) {
    return {
      proof: "0x",
      freshBind: numberToHex(freshBindVal, { size: 32 }),
      enrollNullifier: numberToHex(enrollNullifierVal, { size: 32 }),
      commitment,
      alreadyEnrolled: true,
    };
  }
  onProving?.();

  const noirInputs: Record<string, unknown> = {
    capdu: inputs.capdu,
    resp: inputs.resp,
    attst_sig: inputs.attstSig,
    tbs: inputs.tbs,
    cert_sig: inputs.certSig,
    device_secret: bytesArray(deviceSecret),
    fresh_bind: freshBindVal.toString(),
    enroll_nullifier: enrollNullifierVal.toString(),
  };
  const { proof } = await prove("enrollment", noirInputs);

  return {
    proof,
    freshBind: numberToHex(freshBindVal, { size: 32 }),
    enrollNullifier: numberToHex(enrollNullifierVal, { size: 32 }),
    commitment,
    alreadyEnrolled: false,
  };
};
