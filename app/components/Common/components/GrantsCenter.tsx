"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { GrantsCenterProps } from "../types/common.types";

const label = "relative flex text-[10px] text-gray-400";

const GrantsCenter: FunctionComponent<GrantsCenterProps> = ({
  grants,
}): JSX.Element => {
  const s = useShell();

  return (
    <Caja className="flex-col flex-1 gap-2 p-4 md:min-h-0">
      <span className="relative flex text-sm">{fmt(s.dict.treelinerGrants.heading, { count: grants.length })}</span>

      <div className="relative flex flex-row flex-wrap content-start gap-2 md:min-h-0 md:overflow-y-auto">
        {grants.length ? (
          grants.map((g) => {
            const pct = g.budget ? Math.min(100, (g.raised / g.budget) * 100) : 0;
            const funded = g.raised >= g.budget && g.budget > 0;
            return (
              <Link
                key={g.id}
                href={`/${s.lang}/treeliner-grant/${g.id}`}
                className="relative flex w-full sm:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.34rem)]"
              >
                <Caja
                  bg="bg"
                  className="flex-row flex-1 gap-3 p-3 cursor-blacksmithHS"
                >
                  <img
                    src={g.image}
                    onError={(e) => {
                      e.currentTarget.src = "/images/fabrica.png";
                    }}
                    draggable={false}
                    alt={g.title}
                    className="relative flex w-16 h-16 shrink-0 object-cover"
                  />
                  <div className="relative flex flex-col flex-1 gap-1">
                    <div className="relative flex flex-row items-center gap-2 flex-wrap">
                      <span className="relative flex text-xs">{g.title}</span>
                      <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                        {funded ? s.dict.treelinerGrants.cardFunded : s.dict.treelinerGrants.cardOpen}
                      </span>
                    </div>
                    <span className="relative flex text-[11px] text-gray-300 leading-relaxed">
                      {g.purpose}
                    </span>
                    <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-400">
                      <span className="relative flex">{fmt(s.dict.treelinerGrants.cardKit, { kitId: g.kitId })}</span>
                      <span className="relative flex">
                        {fmt(s.dict.treelinerGrants.cardRaisedOfBudget, { raised: g.raised, budget: g.budget })}
                      </span>
                      <span className="relative flex">{fmt(s.dict.treelinerGrants.cardFunders, { count: g.funders })}</span>
                    </div>
                    <div className="relative flex w-full h-1 bg-white/10">
                      <div
                        className="relative flex h-full bg-white/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Caja>
              </Link>
            );
          })
        ) : (
          <span className={label}>{s.dict.treelinerGrants.empty}</span>
        )}
      </div>
    </Caja>
  );
};

export default GrantsCenter;
