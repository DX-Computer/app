import { toHex } from "viem";
import type { Barretenberg } from "@aztec/bb.js";

type CircuitName =
  | "voting"
  | "signal"
  | "comment"
  | "edit"
  | "enrollment"
  | "identity_action";

const cache: { [k: string]: { bytecode: string } } = {};

let bbPromise: Promise<Barretenberg> | null = null;
const getApi = (): Promise<Barretenberg> => {
  if (!bbPromise) {
    bbPromise = import("@aztec/bb.js").then((m) => m.Barretenberg.new());
  }
  return bbPromise;
};

const loadCircuit = async (name: CircuitName) => {
  if (cache[name]) return cache[name];
  const res = await fetch(`/circuits/${name}.json`, { cache: "no-store" });
  if (!res.ok) {
    console.log(`circuit ${name} not found at /circuits/${name}.json`);
    throw new Error("circuitMissing");
  }
  const json = await res.json();
  cache[name] = json;
  return json;
};

export const circuitAvailable = async (name: CircuitName): Promise<boolean> => {
  try {
    await loadCircuit(name);
    return true;
  } catch (e) {
    console.log(`circuitAvailable(${name}) load error:`, e);
    return false;
  }
};

export const prove = async (
  name: CircuitName,
  inputs: Record<string, unknown>,
): Promise<{ proof: `0x${string}`; publicInputs: string[] }> => {
  const circuit = await loadCircuit(name);
  const { Noir } = await import("@noir-lang/noir_js");
  const { UltraHonkBackend } = await import("@aztec/bb.js");
  const noir = new Noir(circuit as never);
  const { witness } = await noir.execute(inputs as never);
  const api = await getApi();
  const backend = new UltraHonkBackend(circuit.bytecode, api);
  const { proof, publicInputs } = await backend.generateProof(witness, {
    verifierTarget: "evm",
  });
  return { proof: toHex(proof), publicInputs };
};
