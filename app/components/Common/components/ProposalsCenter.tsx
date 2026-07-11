"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import { countdown } from "@/app/lib/countdown";
import useChainClock from "../hooks/useChainClock";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useCreatorBans from "../hooks/useCreatorBans";
import { txUrl } from "@/app/lib/chains";
import { ProposalSummary, ProposalsCenterProps } from "../types/common.types";

type GovernDict = ReturnType<typeof useShell>["dict"]["govern"];

const label = "relative flex text-[10px] text-gray-400";

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

const describe = (p: ProposalSummary, d: GovernDict): string => {
  if (p.kind === 0)
    return fmt(p.banned ? d.describeBan : d.describeUnban, {
      address: short(p.project),
    });
  if (p.kind === 1) return fmt(d.describeQuorum, { value: p.value });
  if (p.kind === 2)
    return fmt(d.describeWindow, { minutes: Math.round(Number(p.value) / 60) });
  return "—";
};

const state = (p: ProposalSummary, d: GovernDict, now: number): string => {
  if (p.executed) return d.stateExecuted;
  if (p.end && now < p.end) return d.stateOpen;
  return d.stateClosed;
};

const ProposalsCenter: FunctionComponent<ProposalsCenterProps> = ({
  proposals,
}): JSX.Element => {
  const s = useShell();
  const g = s.dict.govern;
  const now = useChainClock();
  const { bans } = useCreatorBans();
  const fmtTime = (ts?: string): string => {
    const n = Number(ts);
    if (!ts || !n) return "—";
    return new Date(n * 1000).toISOString().slice(0, 10);
  };
  const KIND = [g.kindBan, g.kindQuorum, g.kindWindow];

  return (
    <Caja className="flex-col flex-1 gap-2 p-4 md:min-h-0">
      <span className="relative flex text-sm">{fmt(g.proposalsCount, { count: proposals.length })}</span>

      <div className="relative flex flex-col gap-2 md:min-h-0 md:overflow-y-auto">
        {proposals.length ? (
          proposals.map((p) => (
            <Link key={p.id} href={`/${s.lang}/proposal/${p.id}`}>
              <Caja bg="bg" className="flex-col gap-2 p-3 cursor-blacksmithHS">
                <div className="relative flex flex-row items-center gap-2 flex-wrap">
                  <span className="relative flex text-xs text-gray-300">
                    #{p.id}
                  </span>
                  <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-200">
                    {KIND[p.kind] || "—"}
                  </span>
                  <span className="relative flex flex-1" />
                  {!p.executed && p.end > 0 && now < p.end && (
                    <span className="relative flex bg-green-500/20 px-2 py-0.5 text-[10px] text-green-300">
                      {fmt(s.dict.proposal.timeLeft, {
                        time: countdown(p.end - now),
                      })}
                    </span>
                  )}
                  <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                    {state(p, g, now)}
                  </span>
                </div>

                {p.title && (
                  <span className="relative flex text-xs leading-relaxed">
                    {p.title}
                  </span>
                )}

                <span className="relative flex text-[10px] text-gray-400 leading-relaxed">
                  {describe(p, g)}
                </span>

                <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-400">
                  <span className="relative flex">✓ {p.yes}</span>
                  <span className="relative flex">✗ {p.no}</span>
                </div>
              </Caja>
            </Link>
          ))
        ) : (
          <span className={label}>{s.dict.govern.noProposalsYet}</span>
        )}
      </div>

      <span className="relative flex text-sm">
        {fmt(g.blacklistsCount, { count: bans.length })}
      </span>
      <div className="relative flex flex-col gap-2">
        {bans.length ? (
          bans.map((b, i) => (
            <Caja key={i} bg="bg" className="flex-row items-center gap-2 p-2 flex-wrap">
              <span className="relative flex flex-1 text-xs text-gray-200">
                {fmt(g.blacklistRow, {
                  actor: short(b.actor),
                  creator: short(b.creator),
                })}
              </span>
              <span className="relative flex text-[10px] text-gray-400">
                {fmtTime(b.time)}
              </span>
              <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                {b.banned ? g.blacklistBanned : g.blacklistUnbanned}
              </span>
              {txUrl(b.tx) && (
                <a
                  href={txUrl(b.tx)}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex text-[10px] underline cursor-blacksmithHS"
                >
                  {s.dict.common.viewTx}
                </a>
              )}
            </Caja>
          ))
        ) : (
          <span className={label}>{g.noBlacklists}</span>
        )}
      </div>
    </Caja>
  );
};

export default ProposalsCenter;
