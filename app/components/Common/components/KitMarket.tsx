"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import resolveUri from "../hooks/resolveUri";
import { KitOfferRef } from "../types/common.types";

type Card = {
  id: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
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
const intOf = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const loadCards = async (refs: KitOfferRef[]): Promise<Card[]> =>
  Promise.all(
    refs.map(async (r) => {
      const u = resolveUri(r.contentUri);
      let c: { title?: string; image?: string } = {};
      if (u.kind !== "invalid" && u.url) {
        try {
          c = await (await fetch(u.url)).json();
        } catch {
          c = {};
        }
      }
      return {
        id: r.offerId,
        title: c.title || "",
        image: c.image || "",
        price: num(r.price),
        quantity: intOf(r.quantity),
      };
    }),
  );

const KitMarket: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const refs = s.selected?.offers ?? [];
  const { data } = useQuery({
    queryKey: ["kit-offers", s.selected?.id, refs.length],
    queryFn: () => loadCards(refs),
    enabled: refs.length > 0,
  });
  const rows = data ?? [];

  return (
    <div className="relative flex flex-col flex-1 gap-2">
      <div className="relative flex flex-row items-center gap-2">
        <span className="relative flex flex-1 text-xs text-gray-300">
          {fmt(s.dict.kitMarket.title, { count: refs.length })}
        </span>
        <Link href={`/${s.lang}/market?kit=${s.kitId}`} className={smallBtn}>
          {s.dict.common.viewAll}
        </Link>
      </div>

      <div className="relative flex flex-col gap-2 min-h-72">
        {refs.length === 0 && (
          <div className="relative flex flex-1 items-center justify-center bg-[url(/images/bg.png)] bg-cover bg-center p-3">
            <span className="relative flex text-[10px] text-gray-500">
              {s.dict.kitMarket.empty}
            </span>
          </div>
        )}
        {rows.map((p) => {
          const pImg = resolveUri(p.image);
          return (
            <Link key={p.id} href={`/${s.lang}/market/${p.id}`}>
              <div className="relative flex flex-row items-center gap-2 bg-[url(/images/bg.png)] bg-cover bg-center p-2 cursor-blacksmithHS">
                <img
                  src={pImg.embeddable ? pImg.url : "/images/fabrica.png"}
                  onError={(e) => {
                    e.currentTarget.src = "/images/fabrica.png";
                  }}
                  draggable={false}
                  alt={p.title}
                  className="relative flex w-10 h-10 shrink-0 object-cover"
                />
                <div className="relative flex flex-col flex-1 gap-0.5">
                  <span className="relative flex text-xs text-white">
                    {p.title}
                  </span>
                  <div className="relative flex flex-row items-center gap-3 text-[10px] text-gray-300">
                    <span className="relative flex">{fmt(s.dict.kitMarket.priceMona, { price: p.price })}</span>
                    <span className="relative flex">{fmt(s.dict.kitMarket.quantityLeft, { quantity: p.quantity })}</span>
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

export default KitMarket;
