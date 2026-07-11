"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import resolveUri from "../hooks/resolveUri";
import { KitAgentRef } from "../types/common.types";

type Card = {
  id: string;
  title: string;
  image: string;
};

const smallBtn =
  "relative flex bg-[url(/images/bg.png)] bg-cover bg-center px-2 py-1 text-[10px] text-white cursor-blacksmithHS";

const loadCards = async (refs: KitAgentRef[]): Promise<Card[]> =>
  Promise.all(
    refs.map(async (r) => {
      const u = resolveUri(r.agent.contentUri);
      let c: { name?: string; title?: string; image?: string } = {};
      if (u.kind !== "invalid" && u.url) {
        try {
          c = await (await fetch(u.url)).json();
        } catch {
          c = {};
        }
      }
      return {
        id: r.agent.agentId,
        title: c.name || c.title || "",
        image: c.image || "",
      };
    }),
  );

const KitAgents: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const refs = s.selected?.agents ?? [];
  const { data } = useQuery({
    queryKey: ["kit-agents", s.selected?.id, refs.length],
    queryFn: () => loadCards(refs),
    enabled: refs.length > 0,
  });
  const rows = data ?? [];

  return (
    <div className="relative flex flex-col flex-1 gap-2">
      <div className="relative flex flex-row items-center gap-2">
        <span className="relative flex flex-1 text-xs text-gray-300">
          {fmt(s.dict.kitAgents.title, { count: refs.length })}
        </span>
        <Link href={`/${s.lang}/cyberswagman-agents`} className={smallBtn}>
          {s.dict.common.viewAll}
        </Link>
      </div>

      <div className="relative flex flex-col gap-2 min-h-72">
        {refs.length === 0 && (
          <div className="relative flex flex-1 items-center justify-center bg-[url(/images/bg.png)] bg-cover bg-center p-3">
            <span className="relative flex text-[10px] text-gray-500">
              {s.dict.kitAgents.empty}
            </span>
          </div>
        )}
        {rows.map((a) => {
          const aImg = resolveUri(a.image);
          return (
            <Link key={a.id} href={`/${s.lang}/cyberswagman-agent/${a.id}`}>
              <div className="relative flex flex-row items-center gap-2 bg-[url(/images/bg.png)] bg-cover bg-center p-2 cursor-blacksmithHS">
                <img
                  src={aImg.embeddable ? aImg.url : "/images/fabrica.png"}
                  onError={(e) => {
                    e.currentTarget.src = "/images/fabrica.png";
                  }}
                  draggable={false}
                  alt={a.title}
                  className="relative flex w-10 h-10 shrink-0 object-cover"
                />
                <div className="relative flex flex-col flex-1 gap-0.5">
                  <span className="relative flex text-xs text-white">
                    #{a.id}
                    {a.title ? ` · ${a.title}` : ""}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default KitAgents;
