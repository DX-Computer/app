"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { GrantsLeftProps } from "../types/common.types";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`;
const tag = "relative flex text-[10px] text-gray-400";
const chip = (active: boolean): string =>
  `relative flex ${fieldBg} px-2 py-1 text-[10px] text-white cursor-blacksmithHS ${
    active ? "" : "opacity-60"
  }`;

const STATUS = ["all", "open", "funded"];
const FUNDERS = ["all", "funded", "none"];

const GrantsLeft: FunctionComponent<GrantsLeftProps> = ({
  filters,
  setFilters,
  count,
  total,
}): JSX.Element => {
  const s = useShell();
  const statusLabel: Record<string, string> = {
    all: s.dict.common.all,
    open: s.dict.treelinerGrants.statusOpen,
    funded: s.dict.treelinerGrants.statusFunded,
  };
  const fundersLabel: Record<string, string> = {
    all: s.dict.common.all,
    funded: s.dict.treelinerGrants.fundersFunded,
    none: s.dict.treelinerGrants.fundersNone,
  };

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={`/${s.lang}/treeliner-grants/create`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.dict.treelinerGrants.createGrantCta}
        </Link>
      </Caja>

      <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-2 p-2">
        <input
          value={filters.text}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, text: e.target.value }))
          }
          placeholder={s.dict.treelinerGrants.searchPlaceholder}
          className={inp}
        />

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.treelinerGrants.kit}</span>
          <input
            value={filters.kit}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, kit: e.target.value }))
            }
            placeholder={s.dict.treelinerGrants.kitIdPlaceholder}
            className={inp}
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.treelinerGrants.status}</span>
          <div className="relative flex flex-row flex-wrap gap-1">
            {STATUS.map((m) => (
              <button
                key={m}
                onClick={() => setFilters((prev) => ({ ...prev, status: m }))}
                className={chip(filters.status === m)}
              >
                {statusLabel[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.treelinerGrants.funders}</span>
          <div className="relative flex flex-row flex-wrap gap-1">
            {FUNDERS.map((m) => (
              <button
                key={m}
                onClick={() => setFilters((prev) => ({ ...prev, funders: m }))}
                className={chip(filters.funders === m)}
              >
                {fundersLabel[m]}
              </button>
            ))}
          </div>
        </div>

        <span className="relative flex text-[10px] text-gray-400">
          {fmt(s.dict.treelinerGrants.countOfTotal, { count, total })}
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

export default GrantsLeft;
