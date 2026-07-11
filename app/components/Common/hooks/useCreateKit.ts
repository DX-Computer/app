import { useState } from "react";
import { CreateKitState, KitDraft, ListKey } from "../types/common.types";

const useCreateKit = (
  onCreate: (draft: KitDraft) => void,
  initial?: Partial<KitDraft>,
): CreateKitState => {
  const [mode, setMode] = useState<string>(initial?.mode ?? "public");
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [summary, setSummary] = useState<string>(initial?.summary ?? "");
  const [lists, setLists] = useState<{
    tags: string[];
    hardware: string[];
    software: string[];
    fabrication: string[];
  }>({
    tags: initial?.tags ?? [],
    hardware: initial?.hardware ?? [],
    software: initial?.software ?? [],
    fabrication: initial?.fabrication ?? [],
  });
  const [inputs, setInputs] = useState<{
    tags: string;
    hardware: string;
    software: string;
    fabrication: string;
  }>({ tags: "", hardware: "", software: "", fabrication: "" });
  const [stage, setStage] = useState<number>(initial?.stage ?? 1);
  const [image, setImage] = useState<string>(initial?.image ?? "");
  const [video, setVideo] = useState<string>(initial?.video ?? "");
  const [pdf, setPdf] = useState<string>(initial?.pdf ?? "");
  const [parent, setParent] = useState<string>(initial?.parent ?? "");

  const setInput = (key: ListKey, v: string) =>
    setInputs((s) => ({ ...s, [key]: v }));
  const addChip = (key: ListKey) => {
    const v = inputs[key].trim();
    if (!v) return;
    setLists((s) => ({ ...s, [key]: [...s[key], v] }));
    setInputs((s) => ({ ...s, [key]: "" }));
  };
  const removeChip = (key: ListKey, i: number) =>
    setLists((s) => ({ ...s, [key]: s[key].filter((_, j) => j !== i) }));

  const reset = () => {
    setMode("public");
    setTitle("");
    setSummary("");
    setLists({ tags: [], hardware: [], software: [], fabrication: [] });
    setInputs({ tags: "", hardware: "", software: "", fabrication: "" });
    setStage(1);
    setImage("");
    setVideo("");
    setPdf("");
    setParent("");
  };

  const build = () => {
    const flush = (key: ListKey) => {
      const extra = inputs[key].trim();
      return extra ? [...lists[key], extra] : lists[key];
    };
    const draft: KitDraft = {
      id: `draft-${Date.now()}`,
      mode,
      title: title.trim(),
      summary: summary.trim(),
      tags: flush("tags"),
      hardware: flush("hardware"),
      software: flush("software"),
      fabrication: flush("fabrication"),
      stage,
      image: image.trim(),
      video: video.trim(),
      pdf: pdf.trim(),
      parent,
    };
    onCreate(draft);
  };

  const filled = (key: ListKey): boolean =>
    lists[key].length > 0 || inputs[key].trim().length > 0;
  const canSubmit =
    title.trim().length > 0 &&
    summary.trim().length > 0 &&
    image.trim().length > 0 &&
    video.trim().length > 0 &&
    pdf.trim().length > 0 &&
    filled("tags") &&
    filled("hardware") &&
    filled("software");

  return {
    mode,
    setMode,
    title,
    setTitle,
    summary,
    setSummary,
    lists,
    inputs,
    setInput,
    addChip,
    removeChip,
    stage,
    setStage,
    image,
    setImage,
    video,
    setVideo,
    pdf,
    setPdf,
    parent,
    setParent,
    build,
    reset,
    canSubmit,
  };
};

export default useCreateKit;
