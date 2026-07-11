import { useState } from "react";
import {
  CreateGrantState,
  GrantDraft,
  GrantMilestone,
} from "../types/common.types";

const emptyMilestone = (): GrantMilestone => ({
  title: "",
  description: "",
  deliverable: "",
});

const useCreateGrant = (
  onCreate: (draft: GrantDraft) => void,
  initial?: Partial<GrantDraft>,
): CreateGrantState => {
  const [mode, setMode] = useState<string>(initial?.mode ?? "public");
  const [kit, setKit] = useState<string>(initial?.kit ?? "");
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [purpose, setPurpose] = useState<string>(initial?.purpose ?? "");
  const [image, setImage] = useState<string>(initial?.image ?? "");
  const [budget, setBudget] = useState<string>(initial?.budget ?? "");
  const [deliverables, setDeliverables] = useState<string>(
    initial?.deliverables ?? "",
  );
  const [milestones, setMilestones] = useState<GrantMilestone[]>(
    initial?.milestones && initial.milestones.length >= 3
      ? initial.milestones
      : [emptyMilestone(), emptyMilestone(), emptyMilestone()],
  );
  const [links, setLinks] = useState<string[]>(initial?.links ?? []);
  const [linkInput, setLinkInput] = useState<string>("");

  const setMilestone = (
    i: number,
    field: keyof GrantMilestone,
    v: string,
  ): void =>
    setMilestones((s) =>
      s.map((m, j) => (j === i ? { ...m, [field]: v } : m)),
    );
  const addMilestone = (): void => setMilestones((s) => [...s, emptyMilestone()]);
  const removeMilestone = (i: number): void =>
    setMilestones((s) => (s.length > 3 ? s.filter((_, j) => j !== i) : s));

  const addLink = (): void => {
    const v = linkInput.trim();
    if (!v) return;
    setLinks((s) => [...s, v]);
    setLinkInput("");
  };
  const removeLink = (i: number): void =>
    setLinks((s) => s.filter((_, j) => j !== i));

  const reset = (): void => {
    setMode("public");
    setKit("");
    setTitle("");
    setPurpose("");
    setImage("");
    setBudget("");
    setDeliverables("");
    setMilestones([emptyMilestone(), emptyMilestone(), emptyMilestone()]);
    setLinks([]);
    setLinkInput("");
  };

  const cleanMilestones = (): GrantMilestone[] =>
    milestones
      .map((m) => ({
        title: m.title.trim(),
        description: m.description.trim(),
        deliverable: m.deliverable.trim(),
      }))
      .filter((m) => m.title || m.description || m.deliverable);

  const build = (): void => {
    const draft: GrantDraft = {
      id: `grant-${Date.now()}`,
      mode,
      kit: kit.trim(),
      title: title.trim(),
      purpose: purpose.trim(),
      image: image.trim(),
      budget: budget.trim(),
      deliverables: deliverables.trim(),
      milestones: cleanMilestones(),
      links: linkInput.trim() ? [...links, linkInput.trim()] : links,
    };
    onCreate(draft);
  };

  const milestonesOk =
    milestones.length >= 3 &&
    milestones
      .slice(0, 3)
      .every(
        (m) =>
          m.title.trim() && m.description.trim() && m.deliverable.trim(),
      );

  const canSubmit =
    kit.trim().length > 0 &&
    title.trim().length > 0 &&
    purpose.trim().length > 0 &&
    image.trim().length > 0 &&
    budget.trim().length > 0 &&
    deliverables.trim().length > 0 &&
    milestonesOk;

  return {
    mode,
    setMode,
    kit,
    setKit,
    title,
    setTitle,
    purpose,
    setPurpose,
    image,
    setImage,
    budget,
    setBudget,
    deliverables,
    setDeliverables,
    milestones,
    setMilestone,
    addMilestone,
    removeMilestone,
    links,
    linkInput,
    setLinkInput,
    addLink,
    removeLink,
    build,
    reset,
    canSubmit,
  };
};

export default useCreateGrant;
