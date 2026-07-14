"use client";

import { FunctionComponent, JSX, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreateKitProps, ListKey } from "../types/common.types";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useCreateKit from "../hooks/useCreateKit";
import useWalkthrough from "../hooks/useWalkthrough";
import useChip from "../hooks/useChip";
import useIdentity from "../hooks/useIdentity";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-sm text-white focus:outline-none`;
const tag = "relative flex text-xs text-gray-400";
const mini = `relative flex ${fieldBg} px-2 py-1 text-xs text-white`;
const chip = (active: boolean): string =>
  `relative flex ${fieldBg} px-2 py-1 text-xs text-white ${
    active ? "" : "opacity-60"
  }`;

const CreateKit: FunctionComponent<CreateKitProps> = ({
  onCreate,
  parents,
  rungs,
  initial,
  editing,
}): JSX.Element => {
  const s = useShell();
  const f = useCreateKit(onCreate, initial);
  const { openWalkthrough } = useWalkthrough();
  const chipSigner = useChip();
  const idn = useIdentity(chipSigner.commitment);
  const params = useSearchParams();
  const [forkQuery, setForkQuery] = useState<string>("");

  useEffect(() => {
    if (editing) return;
    const fork = params.get("fork");
    if (fork && fork !== f.parent) {
      f.setParent(fork);
    }
  }, [params]);

  const groups: { key: ListKey; label: string; req: boolean }[] = [
    { key: "tags", label: s.dict.home.tags, req: true },
    { key: "hardware", label: s.dict.home.hardware, req: true },
    { key: "software", label: s.dict.home.software, req: true },
    { key: "fabrication", label: s.dict.home.fabrication, req: false },
  ];

  const selectedParent = parents.find((p) => p.id === f.parent);
  const matches = parents
    .filter((p) =>
      `${p.id} ${p.title}`
        .toLowerCase()
        .includes(forkQuery.trim().toLowerCase()),
    )
    .slice(0, 6);

  return (
    <div className="relative w-full flex flex-col gap-3 p-4 text-white">
      <div className="relative flex flex-row gap-2 items-center flex-wrap">
        <button
          onClick={() => f.setMode("public")}
          className={chip(f.mode === "public")}
        >
          {s.dict.createKit.publicNft}
        </button>
        <button
          onClick={() => {
            f.setMode("anonymous");
            if (!idn.enrolled) {
              openWalkthrough();
            }
          }}
          className={chip(f.mode === "anonymous")}
        >
          {s.dict.createKit.anonymous}
        </button>
      </div>
      {f.mode === "anonymous" && (
        <span className="relative flex text-xs text-gray-400 leading-relaxed">
          {s.dict.createKit.anonymousHint}
        </span>
      )}

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createKit.titleRequired}</span>
        <input
          value={f.title}
          onChange={(e) => f.setTitle(e.target.value)}
          className={inp}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createKit.summaryRequired}</span>
        <textarea
          value={f.summary}
          onChange={(e) => f.setSummary(e.target.value)}
          rows={3}
          className={`${inp} resize-none`}
        />
      </div>

      {groups.map((g) => (
        <div key={g.key} className="relative flex flex-col gap-1">
          <span className={tag}>
            {g.label}
            {g.req ? " *" : ""}
          </span>
          <div className="relative flex flex-row gap-2 items-center">
            <input
              value={f.inputs[g.key]}
              onChange={(e) => f.setInput(g.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  f.addChip(g.key);
                }
              }}
              placeholder={s.dict.createKit.addPlaceholder}
              className={`${inp} flex-1`}
            />
            <button onClick={() => f.addChip(g.key)} className={mini}>
              {s.dict.common.add}
            </button>
          </div>
          {f.lists[g.key].length > 0 && (
            <div className="relative flex flex-row flex-wrap gap-1">
              {f.lists[g.key].map((item, i) => (
                <span
                  key={i}
                  className={`relative inline-flex flex-row items-center gap-1 ${fieldBg} px-2 py-0.5 text-xs`}
                >
                  {item}
                  <button
                    onClick={() => f.removeChip(g.key, i)}
                    aria-label={s.dict.common.remove}
                    className="relative flex text-gray-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createKit.stageRequired}</span>
        <div className="relative flex flex-row gap-2 flex-wrap">
          {rungs.map((r, i) => (
            <button
              key={i}
              onClick={() => f.setStage(i + 1)}
              className={chip(f.stage === i + 1)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createKit.imageRefRequired}</span>
        <input
          value={f.image}
          onChange={(e) => f.setImage(e.target.value)}
          placeholder={s.dict.createKit.imagePlaceholder}
          className={inp}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createKit.videoTutorialUriRequired}</span>
        <input
          value={f.video}
          onChange={(e) => f.setVideo(e.target.value)}
          placeholder={s.dict.createKit.videoPlaceholder}
          className={inp}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createKit.makerKitPdfUriRequired}</span>
        <input
          value={f.pdf}
          onChange={(e) => f.setPdf(e.target.value)}
          placeholder={s.dict.createKit.pdfPlaceholder}
          className={inp}
        />
      </div>

      {!editing && (
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createKit.forkFromOptional}</span>
        {f.parent ? (
          <div className="relative flex flex-row gap-2 items-center">
            <span className="relative flex text-sm">
              {selectedParent
                ? fmt(s.dict.createKit.parentLabel, { id: selectedParent.id, title: selectedParent.title })
                : f.parent}
            </span>
            <button
              onClick={() => {
                f.setParent("");
                setForkQuery("");
              }}
              className={mini}
            >
              {s.dict.common.clear}
            </button>
          </div>
        ) : (
          <>
            <input
              value={forkQuery}
              onChange={(e) => setForkQuery(e.target.value)}
              placeholder={s.dict.createKit.searchProjectsPlaceholder}
              className={inp}
            />
            {forkQuery.trim() && (
              <div className={`relative flex flex-col ${fieldBg}`}>
                {matches.length ? (
                  matches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        f.setParent(p.id);
                        setForkQuery("");
                      }}
                      className="relative flex text-left px-2 py-1 text-xs"
                    >
                      {fmt(s.dict.createKit.parentLabel, { id: p.id, title: p.title })}
                    </button>
                  ))
                ) : (
                  <span className="relative flex px-2 py-1 text-xs text-gray-500">
                    {s.dict.createKit.noMatches}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      )}

      <div className="relative flex flex-row gap-2 items-center">
        <span className={tag}>{s.dict.common.license}</span>
        <span className="relative flex text-xs">{s.dict.common.cc0}</span>
      </div>

      <div className="relative flex flex-row gap-2 items-center flex-wrap">
        <button
          onClick={f.build}
          disabled={!f.canSubmit}
          className={`relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm ${
            f.canSubmit ? "" : "opacity-40 text-gray-400"
          }`}
        >
          {s.dict.createKit.packageContent}
        </button>
        <button onClick={f.reset} className={mini}>
          {s.dict.common.clear}
        </button>
      </div>
    </div>
  );
};

export default CreateKit;
