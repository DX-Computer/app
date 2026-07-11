import { useState } from "react";
import {
  AgentDraft,
  AgentListKey,
  CreateAgentState,
} from "../types/common.types";

const emptyLists = (): { [k in AgentListKey]: string[] } => ({
  tags: [],
  links: [],
  datasets: [],
  software: [],
  bom: [],
});
const emptyInputs = (): { [k in AgentListKey]: string } => ({
  tags: "",
  links: "",
  datasets: "",
  software: "",
  bom: "",
});

const useCreateAgent = (
  onCreate: (draft: AgentDraft) => void,
  initial?: Partial<AgentDraft>,
): CreateAgentState => {
  const [name, setName] = useState<string>(initial?.name ?? "");
  const [description, setDescription] = useState<string>(
    initial?.description ?? "",
  );
  const [image, setImage] = useState<string>(initial?.image ?? "");
  const [video, setVideo] = useState<string>(initial?.video ?? "");
  const [audio, setAudio] = useState<string>(initial?.audio ?? "");
  const [architecture, setArchitecture] = useState<string>(
    initial?.architecture ?? "",
  );
  const [weights, setWeights] = useState<string>(initial?.weights ?? "");
  const [code, setCode] = useState<string>(initial?.code ?? "");
  const [training, setTraining] = useState<string>(initial?.training ?? "");
  const [reproduce, setReproduce] = useState<string>(initial?.reproduce ?? "");
  const [io, setIo] = useState<string>(initial?.io ?? "");
  const [hwSpec, setHwSpec] = useState<string>(initial?.hwSpec ?? "");
  const [assembly, setAssembly] = useState<string>(initial?.assembly ?? "");
  const [lists, setLists] = useState({
    ...emptyLists(),
    tags: initial?.tags ?? [],
    links: initial?.links ?? [],
    datasets: initial?.datasets ?? [],
    software: initial?.software ?? [],
    bom: initial?.bom ?? [],
  });
  const [inputs, setInputs] = useState(emptyInputs());
  const [kits, setKits] = useState<string[]>(initial?.kits ?? []);

  const addKit = (id: string): void =>
    setKits((s) => (s.includes(id) ? s : [...s, id]));
  const removeKit = (id: string): void =>
    setKits((s) => s.filter((k) => k !== id));

  const setInput = (key: AgentListKey, v: string): void =>
    setInputs((s) => ({ ...s, [key]: v }));
  const addChip = (key: AgentListKey): void => {
    const v = inputs[key].trim();
    if (!v) return;
    setLists((s) => ({ ...s, [key]: [...s[key], v] }));
    setInputs((s) => ({ ...s, [key]: "" }));
  };
  const removeChip = (key: AgentListKey, i: number): void =>
    setLists((s) => ({ ...s, [key]: s[key].filter((_, j) => j !== i) }));

  const reset = (): void => {
    setName("");
    setDescription("");
    setImage("");
    setVideo("");
    setAudio("");
    setArchitecture("");
    setWeights("");
    setCode("");
    setTraining("");
    setReproduce("");
    setIo("");
    setHwSpec("");
    setAssembly("");
    setLists(emptyLists());
    setInputs(emptyInputs());
    setKits([]);
  };

  const flush = (key: AgentListKey): string[] => {
    const extra = inputs[key].trim();
    return extra ? [...lists[key], extra] : lists[key];
  };

  const build = (): void => {
    const draft: AgentDraft = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      image: image.trim(),
      video: video.trim(),
      audio: audio.trim(),
      tags: flush("tags"),
      links: flush("links"),
      architecture: architecture.trim(),
      weights: weights.trim(),
      code: code.trim(),
      datasets: flush("datasets"),
      training: training.trim(),
      software: flush("software"),
      reproduce: reproduce.trim(),
      io: io.trim(),
      license: "CC0",
      hwSpec: hwSpec.trim(),
      bom: flush("bom"),
      assembly: assembly.trim(),
      kits,
    };
    onCreate(draft);
  };

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    image.trim().length > 0 &&
    architecture.trim().length > 0 &&
    hwSpec.trim().length > 0 &&
    kits.length > 0;

  return {
    name,
    setName,
    description,
    setDescription,
    image,
    setImage,
    video,
    setVideo,
    audio,
    setAudio,
    architecture,
    setArchitecture,
    weights,
    setWeights,
    code,
    setCode,
    training,
    setTraining,
    reproduce,
    setReproduce,
    io,
    setIo,
    hwSpec,
    setHwSpec,
    assembly,
    setAssembly,
    lists,
    inputs,
    setInput,
    addChip,
    removeChip,
    kits,
    addKit,
    removeKit,
    build,
    reset,
    canSubmit,
  };
};

export default useCreateAgent;
