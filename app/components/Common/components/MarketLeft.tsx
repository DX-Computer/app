"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { MarketLeftProps } from "../types/common.types";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`;
const tag = "relative flex text-[10px] text-gray-400";
const chip = (active: boolean): string =>
  `relative flex ${fieldBg} px-2 py-1 text-[10px] text-white cursor-blacksmithHS ${
    active ? "" : "opacity-60"
  }`;

const PRICE = ["all", "<25", "25–100", "100+"];
const STOCK = ["all", "in stock", "sold out"];
const GRANT = ["all", "linked", "unlinked"];

const MarketLeft: FunctionComponent<MarketLeftProps> = ({
  filters,
  setFilters,
  count,
  total,
}): JSX.Element => {
  const s = useShell();
  const stockLabel: Record<string, string> = {
    all: s.dict.common.all,
    "in stock": s.dict.market.inStock,
    "sold out": s.dict.market.soldOut,
  };
  const grantLabel: Record<string, string> = {
    all: s.dict.common.all,
    linked: s.dict.market.grantLinked,
    unlinked: s.dict.market.grantUnlinked,
  };

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={`/${s.lang}/market/create`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.dict.market.createProductCta}
        </Link>
      </Caja>

      <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-2 p-2">
        <input
          value={filters.text}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, text: e.target.value }))
          }
          placeholder={s.dict.market.searchPlaceholder}
          className={inp}
        />

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.market.kit}</span>
          <input
            value={filters.kit}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, kit: e.target.value }))
            }
            placeholder={s.dict.market.kitIdPlaceholder}
            className={inp}
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.market.price}</span>
          <div className="relative flex flex-row flex-wrap gap-1">
            {PRICE.map((m) => (
              <button
                key={m}
                onClick={() => setFilters((prev) => ({ ...prev, price: m }))}
                className={chip(filters.price === m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.market.availability}</span>
          <div className="relative flex flex-row flex-wrap gap-1">
            {STOCK.map((m) => (
              <button
                key={m}
                onClick={() => setFilters((prev) => ({ ...prev, stock: m }))}
                className={chip(filters.stock === m)}
              >
                {stockLabel[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.market.treelinerGrant}</span>
          <div className="relative flex flex-row flex-wrap gap-1">
            {GRANT.map((m) => (
              <button
                key={m}
                onClick={() => setFilters((prev) => ({ ...prev, grant: m }))}
                className={chip(filters.grant === m)}
              >
                {grantLabel[m]}
              </button>
            ))}
          </div>
        </div>

        <span className="relative flex text-[10px] text-gray-400">
          {fmt(s.dict.market.countOfTotal, { count, total })}
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

export default MarketLeft;
