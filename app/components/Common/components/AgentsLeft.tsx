"use client";

import { FunctionComponent, JSX, useState } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { AgentsLeftProps } from "../types/common.types";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`;
const mini = `relative flex ${fieldBg} px-2 py-1 text-[10px] text-white cursor-blacksmithHS`;
const tag = "relative flex text-[10px] text-gray-400";

const AgentsLeft: FunctionComponent<AgentsLeftProps> = ({
  filters,
  setFilters,
  count,
  total,
}): JSX.Element => {
  const s = useShell();
  const [tagInput, setTagInput] = useState<string>("");

  const addTag = (): void => {
    const v = tagInput.trim();
    if (!v) return;
    setFilters((prev) => ({ ...prev, tags: [...prev.tags, v] }));
    setTagInput("");
  };
  const removeTag = (i: number): void =>
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, j) => j !== i),
    }));

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={`/${s.lang}/cyberswagman-agents/create`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.dict.cyberswagmanAgents.registerAgent}
        </Link>
      </Caja>

      <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-2 p-2">
        <input
          value={filters.text}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, text: e.target.value }))
          }
          placeholder={s.dict.cyberswagmanAgents.searchPlaceholder}
          className={inp}
        />

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.cyberswagmanAgents.cyberswagman}</span>
          <input
            value={filters.cyberswagman}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, cyberswagman: e.target.value }))
            }
            placeholder={s.dict.cyberswagmanAgents.cyberswagmanAddressPlaceholder}
            className={inp}
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.cyberswagmanAgents.kit}</span>
          <input
            value={filters.kit}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, kit: e.target.value }))
            }
            inputMode="numeric"
            placeholder={s.dict.cyberswagmanAgents.kitIdPlaceholder}
            className={inp}
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.cyberswagmanAgents.tags}</span>
          <div className="relative flex flex-row gap-1">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={s.dict.cyberswagmanAgents.addPlaceholder}
              className={`${inp} flex-1`}
            />
            <button onClick={addTag} className={mini}>
              {s.dict.common.add}
            </button>
          </div>
          {filters.tags.length > 0 && (
            <div className="relative flex flex-row flex-wrap gap-1">
              {filters.tags.map((t, i) => (
                <span
                  key={i}
                  className={`relative inline-flex flex-row items-center gap-1 ${fieldBg} px-2 py-0.5 text-[10px]`}
                >
                  {t}
                  <button
                    onClick={() => removeTag(i)}
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

        <span className="relative flex text-[10px] text-gray-400">
          {fmt(s.dict.cyberswagmanAgents.countOfTotal, { count, total })}
        </span>
      </Caja>

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

export default AgentsLeft;
