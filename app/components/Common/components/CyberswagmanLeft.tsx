"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { CyberswagmanStats } from "../types/common.types";
import { addressUrl } from "@/app/lib/chains";

const tag = "relative flex text-[10px] text-gray-400";

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

const CyberswagmanLeft: FunctionComponent<{ stats: CyberswagmanStats }> = ({
  stats,
}): JSX.Element => {
  const s = useShell();
  const href = addressUrl(stats.address);

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={`/${s.lang}/cyberswagman-agents`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.dict.cyberswagman.cyberswagmanAgents}
        </Link>
      </Caja>

      <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-3 p-3">
        <span className="relative flex text-sm">{s.dict.cyberswagman.cyberswagman}</span>
        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.cyberswagman.address}</span>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="relative flex text-xs underline cursor-blacksmithHS break-all"
            >
              {short(stats.address)}
            </a>
          ) : (
            <span className="relative flex text-xs break-all">
              {short(stats.address)}
            </span>
          )}
        </div>

        <div className="relative flex flex-col gap-2">
          <div className="relative flex flex-row items-center gap-2">
            <span className={`${tag} flex-1`}>{s.dict.cyberswagman.agents}</span>
            <span className="relative flex text-xs">{stats.agentCount}</span>
          </div>
        </div>
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

export default CyberswagmanLeft;
