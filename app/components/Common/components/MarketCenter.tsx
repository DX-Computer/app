"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { MarketCenterProps } from "../types/common.types";

const label = "relative flex text-[10px] text-gray-400";

const MarketCenter: FunctionComponent<MarketCenterProps> = ({
  products,
}): JSX.Element => {
  const s = useShell();

  return (
    <Caja className="flex-col flex-1 gap-2 p-4 md:min-h-0">
      <span className="relative flex text-sm">{fmt(s.dict.market.heading, { count: products.length })}</span>

      <div className="relative flex flex-row flex-wrap content-start gap-2 md:min-h-0 md:overflow-y-auto">
        {products.length ? (
          products.map((p) => {
            const soldOut = p.quantity <= 0;
            return (
              <Link
                key={p.id}
                href={`/${s.lang}/market/${p.id}`}
                className="relative flex w-full sm:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.34rem)]"
              >
                <Caja
                  bg="bg"
                  className="flex-row flex-1 gap-3 p-3 cursor-blacksmithHS"
                >
                  <img
                    src={p.image}
                    onError={(e) => {
                      e.currentTarget.src = "/images/fabrica.png";
                    }}
                    draggable={false}
                    alt={p.title}
                    className="relative flex w-16 h-16 shrink-0 object-cover"
                  />
                  <div className="relative flex flex-col flex-1 gap-1">
                    <div className="relative flex flex-row items-center gap-2 flex-wrap">
                      <span className="relative flex text-xs">{p.title}</span>
                      <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                        {soldOut ? s.dict.market.cardSoldOut : s.dict.market.cardInStock}
                      </span>
                      {p.grantLinked && (
                        <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                          {s.dict.market.cardFundsGrant}
                        </span>
                      )}
                    </div>
                    <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-400">
                      <span className="relative flex">{fmt(s.dict.market.cardKit, { kitId: p.kitId })}</span>
                      <span className="relative flex">{fmt(s.dict.market.cardPrice, { price: p.price })}</span>
                      <span className="relative flex">{fmt(s.dict.market.cardLeft, { quantity: p.quantity })}</span>
                      <span className="relative flex">
                        {fmt(s.dict.market.cardUpfront, { pct: (p.sliceBps / 100).toFixed(0) })}
                      </span>
                    </div>
                  </div>
                </Caja>
              </Link>
            );
          })
        ) : (
          <span className={label}>{s.dict.market.empty}</span>
        )}
      </div>
    </Caja>
  );
};

export default MarketCenter;
