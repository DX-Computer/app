"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import resolveUri from "../hooks/resolveUri";
import { AgentsCenterProps } from "../types/common.types";

const label = "relative flex text-[10px] text-gray-400";

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

const AgentsCenter: FunctionComponent<AgentsCenterProps> = ({
  agents,
}): JSX.Element => {
  const s = useShell();
  const router = useRouter();

  return (
    <Caja className="flex-col flex-1 gap-2 p-4 md:min-h-0">
      <span className="relative flex text-sm">{fmt(s.dict.cyberswagmanAgents.agentsCount, { count: agents.length })}</span>

      <div className="relative flex flex-row flex-wrap content-start gap-2 md:min-h-0 md:overflow-y-auto">
        {agents.length ? (
          agents.map((a) => (
            <Link
              key={a.id}
              href={`/${s.lang}/cyberswagman-agent/${a.id}`}
              className="relative flex w-full sm:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.34rem)]"
            >
              <Caja bg="bg" className="flex-row flex-1 gap-3 p-3 cursor-blacksmithHS">
                <img
                  src={resolveUri(a.image).url || "/images/fabrica.png"}
                  onError={(e) => {
                    e.currentTarget.src = "/images/fabrica.png";
                  }}
                  draggable={false}
                  alt={a.name}
                  className="relative flex w-16 h-16 shrink-0 object-cover"
                />
                <div className="relative flex flex-col flex-1 gap-1">
                  <span className="relative flex text-xs">{a.name}</span>
                  <span className="relative flex text-[11px] text-gray-300 leading-relaxed">
                    {a.description}
                  </span>
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/${s.lang}/cyberswagman/${a.owner}`);
                    }}
                    className="relative flex w-fit text-[10px] text-gray-400 underline cursor-blacksmithHS"
                  >
                    {fmt(s.dict.cyberswagmanAgents.by, { address: short(a.owner) })}
                  </span>
                  {a.tags.length > 0 && (
                    <div className="relative flex flex-row flex-wrap gap-1">
                      {a.tags.slice(0, 4).map((t, i) => (
                        <span
                          key={i}
                          className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Caja>
            </Link>
          ))
        ) : (
          <span className={label}>{s.dict.cyberswagmanAgents.noAgentsMatch}</span>
        )}
      </div>
    </Caja>
  );
};

export default AgentsCenter;
