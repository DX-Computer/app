"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import VideoPlayer from "./VideoPlayer";
import resolveUri from "../hooks/resolveUri";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { txUrl } from "@/app/lib/chains";

const label = "relative flex text-[10px] text-gray-400";
const linkBtn =
  "relative flex w-fit bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";
const arLink =
  "relative flex w-fit text-xs underline cursor-blacksmithHS text-gray-200";
const tagChip =
  "relative flex bg-[url(/images/bg.png)] bg-cover bg-center border border-white/25 rounded-sm px-2 py-0.5 text-[10px] text-white cursor-blacksmithHS hover:border-white/50";

type TagKey = "tags" | "hardware" | "software" | "fabrication";

const KitsCenter: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const selected = s.selected;

  const img = resolveUri(selected?.image);
  const vid = resolveUri(selected?.video);
  const pdf = resolveUri(selected?.pdf);

  const tx = selected?.transactionHash ?? "";
  const txHref = txUrl(tx);
  const hasParent = Boolean(selected?.parentId && selected.parentId !== "0");

  const addFilterTag = (key: TagKey, v: string): void => {
    s.setFilters((prev) =>
      prev[key].includes(v) ? prev : { ...prev, [key]: [...prev[key], v] },
    );
  };

  const tagRow = (key: TagKey, values?: string[]): JSX.Element => (
    <div className="relative flex flex-row flex-wrap gap-1">
      {values && values.length ? (
        values.map((v, i) => (
          <button key={i} onClick={() => addFilterTag(key, v)} className={tagChip}>
            {v}
          </button>
        ))
      ) : (
        <span className="relative flex text-xs">—</span>
      )}
    </div>
  );

  return (
    <Caja className="flex-col flex-1 gap-2 p-4">
      <div className="relative flex flex-row items-center gap-2 px-2 py-1 text-xs text-gray-300">
        {s.ui?.canonical} · #{selected?.id ?? "—"}
      </div>

      <div className="relative flex flex-row items-center gap-2">
        <div className="relative flex w-10 h-10 shrink-0 overflow-hidden bg-black/20">
          <img
            src={img.embeddable ? img.url : "/images/fabrica.png"}
            onError={(e) => {
              e.currentTarget.src = "/images/fabrica.png";
            }}
            draggable={false}
            alt={selected?.title || s.dict.home.image}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <span className="relative flex text-sm">{selected?.title || "—"}</span>
        {hasParent && (
          <Link
            href={`/${s.lang}/kit/${selected?.parentId}`}
            className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300 underline cursor-blacksmithHS"
          >
            {fmt(s.dict.kit.forkOfLabel, { parent: `#${selected?.parentId}` })}
          </Link>
        )}
      </div>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.home.videoTutorial}</span>
        {vid.embeddable ? (
          <VideoPlayer key={selected?.id} src={vid.url} />
        ) : vid.kind === "arweave" ? (
          <a href={vid.url} target="_blank" rel="noreferrer" className={arLink}>
            {s.dict.home.openVideoOnArweave}
          </a>
        ) : (
          <span className="relative flex text-xs">—</span>
        )}
      </Caja>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.home.tags}</span>
        {tagRow("tags", selected?.tags)}
      </Caja>

      <div className="relative flex flex-row gap-2">
        <Caja bg="bg" className="flex-col flex-1 gap-1 p-2">
          <span className={label}>{s.dict.home.hardware}</span>
          {tagRow("hardware", selected?.hardware)}
        </Caja>
        <Caja bg="bg" className="flex-col flex-1 gap-1 p-2">
          <span className={label}>{s.dict.home.software}</span>
          {tagRow("software", selected?.software)}
        </Caja>
      </div>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.home.fabrication}</span>
        {tagRow("fabrication", selected?.fabrication)}
      </Caja>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.home.stage}</span>
        <div className="relative flex flex-row flex-wrap gap-x-3 gap-y-1">
          {s.rungs.map((r, i) => (
            <span
              key={i}
              className={`relative flex text-xs ${
                selected && i < selected.stage ? "text-white" : "text-white/30"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </Caja>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.ui?.description}</span>
        <span className="relative flex text-xs leading-relaxed">
          {selected?.desc || "—"}
        </span>
      </Caja>

      <Caja bg="bg" className="flex-col gap-2 p-2">
        <span className={label}>{s.dict.home.makerKitPdf}</span>
        {pdf.kind === "invalid" ? (
          <span className="relative flex text-xs">—</span>
        ) : (
          <a
            href={pdf.url}
            target="_blank"
            rel="noreferrer"
            download={pdf.kind !== "arweave"}
            className={linkBtn}
          >
            {pdf.kind === "arweave" ? s.dict.home.openPdfOnArweave : s.dict.home.downloadPdf}
          </a>
        )}
      </Caja>

      <Caja bg="bg" className="flex-col gap-1 p-2 text-xs">
        <span className={label}>{s.ui?.meta}</span>
        <span className="relative flex">{s.dict.home.licenseCc0}</span>
        <span className="relative flex">{selected?.status ?? "—"}</span>
        {tx && txHref && (
          <div className="relative flex flex-row items-center gap-2">
            <a href={txHref} target="_blank" rel="noreferrer" className={arLink}>
              {s.dict.common.viewTx}
            </a>
          </div>
        )}
      </Caja>
    </Caja>
  );
};

export default KitsCenter;
