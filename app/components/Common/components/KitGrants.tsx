"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import resolveUri from "../hooks/resolveUri";
import { KitGrantRef } from "../types/common.types";

type Card = {
  id: string;
  purpose: string;
  image: string;
  budget: number;
  raised: number;
};

const smallBtn =
  "relative flex bg-[url(/images/bg.png)] bg-cover bg-center px-2 py-1 text-[10px] text-white cursor-blacksmithHS";

const num = (v: string): number => {
  try {
    return Number(formatUnits(BigInt(v), 18));
  } catch {
    return 0;
  }
};

const loadCards = async (refs: KitGrantRef[]): Promise<Card[]> =>
  Promise.all(
    refs.map(async (r) => {
      const u = resolveUri(r.contentUri);
      let c: { title?: string; purpose?: string; image?: string } = {};
      if (u.kind !== "invalid" && u.url) {
        try {
          c = await (await fetch(u.url)).json();
        } catch {
          c = {};
        }
      }
      return {
        id: r.grantId,
        purpose: c.purpose || c.title || "",
        image: c.image || "",
        budget: num(r.budget),
        raised: num(r.raised),
      };
    }),
  );

const KitGrants: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const refs = s.selected?.grants ?? [];
  const { data } = useQuery({
    queryKey: ["kit-grants", s.selected?.id, refs.length],
    queryFn: () => loadCards(refs),
    enabled: refs.length > 0,
  });
  const rows = data ?? [];

  return (
    <div className="relative flex flex-col flex-1 gap-2">
      <div className="relative flex flex-row items-center gap-2">
        <span className="relative flex flex-1 text-xs text-gray-300">
          {fmt(s.dict.kitGrants.title, { count: refs.length })}
        </span>
        <Link href={`/${s.lang}/treeliner-grants?kit=${s.kitId}`} className={smallBtn}>
          {s.dict.common.viewAll}
        </Link>
      </div>

      <div className="relative flex flex-col gap-2 min-h-72">
        {refs.length === 0 && (
          <div className="relative flex flex-1 items-center justify-center bg-[url(/images/bg.png)] bg-cover bg-center p-3">
            <span className="relative flex text-[10px] text-gray-500">
              {s.dict.kitGrants.empty}
            </span>
          </div>
        )}
        {rows.map((g) => {
          const gImg = resolveUri(g.image);
          return (
            <Link key={g.id} href={`/${s.lang}/treeliner-grant/${g.id}`}>
              <div className="relative flex flex-row items-center gap-2 bg-[url(/images/bg.png)] bg-cover bg-center p-2 cursor-blacksmithHS">
                <img
                  src={gImg.embeddable ? gImg.url : "/images/fabrica.png"}
                  onError={(e) => {
                    e.currentTarget.src = "/images/fabrica.png";
                  }}
                  draggable={false}
                  alt={g.purpose}
                  className="relative flex w-10 h-10 shrink-0 object-cover"
                />
                <div className="relative flex flex-col flex-1 gap-0.5">
                  <span className="relative flex text-xs text-white">
                    {g.purpose}
                  </span>
                  <span className="relative flex text-[10px] text-gray-300">
                    {fmt(s.dict.kitGrants.amountOfBudget, { raised: g.raised, budget: g.budget })}
                  </span>
                  <div className="relative flex w-full h-1 bg-white/20">
                    <div
                      className="relative flex h-full bg-white/70"
                      style={{
                        width: `${
                          g.budget ? Math.min(100, (g.raised / g.budget) * 100) : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default KitGrants;
