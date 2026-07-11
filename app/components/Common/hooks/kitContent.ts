import resolveUri from "./resolveUri";
import { RoadmapPhase } from "../types/common.types";

export type KitContent = {
  mode?: string;
  title?: string;
  summary?: string;
  tags?: string[];
  hardware?: string[];
  software?: string[];
  fabrication?: string[];
  stage?: number;
  image?: string;
  video?: string;
  pdf?: string;
  parent?: string;
};

const cleanLink = (u?: string): boolean =>
  !u || resolveUri(u).kind !== "invalid";

export const validContent = (c: KitContent | null): boolean =>
  Boolean(
    c &&
      typeof c.title === "string" &&
      c.title.trim() !== "" &&
      typeof c.summary === "string" &&
      cleanLink(c.image) &&
      cleanLink(c.video) &&
      cleanLink(c.pdf),
  );

export const fetchContent = async (
  contentUri: string,
): Promise<KitContent | null> => {
  const r = resolveUri(contentUri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const res = await fetch(r.url, { signal: AbortSignal.timeout(8000) });
    const json = (await res.json()) as KitContent;
    return validContent(json) ? json : null;
  } catch {
    return null;
  }
};

export const applyContent = (
  base: RoadmapPhase,
  c: KitContent,
): RoadmapPhase => ({
  ...base,
  title: c.title || base.title,
  stage: typeof c.stage === "number" ? c.stage : base.stage,
  image: c.image || "",
  video: c.video || "",
  pdf: c.pdf || "",
  hardware: c.hardware || [],
  software: c.software || [],
  fabrication: c.fabrication || [],
  desc: c.summary || "",
  tags: c.tags || [],
  summary: c.summary || "",
});
