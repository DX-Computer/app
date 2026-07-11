"use client";

import { FunctionComponent, JSX, useState } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import resolveUri from "../hooks/resolveUri";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`;
const mini = `relative flex ${fieldBg} px-2 py-1 text-[10px] text-white`;
const tag = "relative flex text-[10px] text-gray-400";
const chip = (active: boolean): string =>
  `relative flex ${fieldBg} px-2 py-1 text-[10px] text-white ${
    active ? "" : "opacity-60"
  }`;

type LKey = "tags" | "hardware" | "software" | "fabrication";

const KitsLeft: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const f = s.filters;
  const img = resolveUri(s.selected?.image);
  const modeLabel: Record<string, string> = {
    all: s.dict.common.all,
    public: s.dict.home.modePublic,
    anonymous: s.dict.home.modeAnonymous,
  };
  const forkLabel: Record<string, string> = {
    all: s.dict.common.all,
    fork: s.dict.home.forkOnly,
    original: s.dict.home.forkOriginal,
  };
  const [inputs, setInputs] = useState<{ [k in LKey]: string }>({
    tags: "",
    hardware: "",
    software: "",
    fabrication: "",
  });

  const add = (key: LKey): void => {
    const v = inputs[key].trim();
    if (!v) return;
    s.setFilters((prev) => ({ ...prev, [key]: [...prev[key], v] }));
    setInputs((prev) => ({ ...prev, [key]: "" }));
  };
  const remove = (key: LKey, i: number): void =>
    s.setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, j) => j !== i),
    }));

  const lists: { key: LKey; label: string }[] = [
    { key: "tags", label: s.dict.home.tags },
    { key: "hardware", label: s.dict.home.hardware },
    { key: "software", label: s.dict.home.software },
    { key: "fabrication", label: s.dict.home.fabrication },
  ];

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={s.isHome ? `/${s.lang}/create` : `/${s.lang}`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.isHome ? s.dict.home.createKit : s.dict.connection.goHome}
        </Link>
      </Caja>

      {s.isHome ? (
        <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-2 p-2">
          <input
            value={f.text}
            onChange={(e) =>
              s.setFilters((prev) => ({ ...prev, text: e.target.value }))
            }
            placeholder={s.ui?.search}
            className={inp}
          />

          {lists.map((g) => (
            <div key={g.key} className="relative flex flex-col gap-1">
              <span className={tag}>{g.label}</span>
              <div className="relative flex flex-row gap-1">
                <input
                  value={inputs[g.key]}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [g.key]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add(g.key);
                    }
                  }}
                  placeholder={s.dict.createKit.addPlaceholder}
                  className={`${inp} flex-1`}
                />
                <button onClick={() => add(g.key)} className={mini}>
                  {s.dict.common.add}
                </button>
              </div>
              {f[g.key].length > 0 && (
                <div className="relative flex flex-row flex-wrap gap-1">
                  {f[g.key].map((item, i) => (
                    <span
                      key={i}
                      className={`relative inline-flex flex-row items-center gap-1 ${fieldBg} px-2 py-0.5 text-[10px]`}
                    >
                      {item}
                      <button
                        onClick={() => remove(g.key, i)}
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
            <span className={tag}>{s.dict.home.stage}</span>
            <div className="relative flex flex-row flex-wrap gap-1">
              <button
                onClick={() =>
                  s.setFilters((prev) => ({ ...prev, stage: 0 }))
                }
                className={chip(f.stage === 0)}
              >
                {s.dict.common.all}
              </button>
              {s.rungs.map((r, i) => (
                <button
                  key={i}
                  onClick={() =>
                    s.setFilters((prev) => ({ ...prev, stage: i + 1 }))
                  }
                  className={chip(f.stage === i + 1)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-1">
            <span className={tag}>{s.dict.home.mode}</span>
            <div className="relative flex flex-row flex-wrap gap-1">
              {["all", "public", "anonymous"].map((m) => (
                <button
                  key={m}
                  onClick={() => s.setFilters((prev) => ({ ...prev, mode: m }))}
                  className={chip(f.mode === m)}
                >
                  {modeLabel[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-1">
            <span className={tag}>{s.dict.home.fork}</span>
            <div className="relative flex flex-row flex-wrap gap-1">
              {["all", "fork", "original"].map((m) => (
                <button
                  key={m}
                  onClick={() => s.setFilters((prev) => ({ ...prev, fork: m }))}
                  className={chip(f.fork === m)}
                >
                  {forkLabel[m]}
                </button>
              ))}
            </div>
          </div>

          <span className="relative flex text-[10px] text-gray-400">
            {fmt(s.dict.home.countOfTotal, { filtered: s.filtered.length, total: s.allItems.length })}
          </span>
        </Caja>
      ) : s.isKit ? (
        <Caja className="flex-col flex-1 md:min-h-0 p-2">
          <div className="relative flex flex-1 w-full overflow-hidden">
            <img
              src={img.embeddable ? img.url : "/images/fabrica.png"}
              onError={(e) => {
                e.currentTarget.src = "/images/fabrica.png";
              }}
              draggable={false}
              alt={s.selected?.title || "kit"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </Caja>
      ) : (
        <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-3 p-3">
          <span className="relative flex text-sm">
            {s.dict.home.publicVsAnonymous}
          </span>
          <div className="relative flex flex-col gap-1">
            <span className={tag}>{s.dict.home.publicNft}</span>
            <span className="relative flex text-xs leading-relaxed">
              {s.dict.home.publicNftDesc}
            </span>
          </div>
          <div className="relative flex flex-col gap-1">
            <span className={tag}>{s.dict.home.anonymous}</span>
            <span className="relative flex text-xs leading-relaxed">
              {s.dict.home.anonymousDesc}
            </span>
          </div>
        </Caja>
      )}

      <div className="relative flex shrink-0 flex-row flex-wrap content-start gap-2 p-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="relative flex w-6 h-6 shrink-0"
            style={{
              backgroundImage: `url('/images/esmeralda-${11 + (i % 6)}.png')`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        ))}
      </div>

      <div
        className="relative flex w-full h-24 shrink-0 bg-no-repeat bg-center bg-contain"
        style={{ backgroundImage: "url('/images/sprite.png')" }}
      />
    </>
  );
};

export default KitsLeft;
