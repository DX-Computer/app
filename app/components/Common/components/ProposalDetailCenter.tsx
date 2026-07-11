"use client";

import { FunctionComponent, JSX, useState } from "react";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
import { contractConfig } from "@/app/lib/contracts";
import { getIdentity } from "@/app/lib/zk/identity";
import { semaphoreNullifier } from "@/app/lib/zk/identityTree";
import { countdown } from "@/app/lib/countdown";
import useChainClock from "../hooks/useChainClock";
import Caja from "./Caja";
import KitComments from "./KitComments";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useProposal from "../hooks/useProposal";
import useCouncil from "../hooks/useCouncil";
import useWalkthrough from "../hooks/useWalkthrough";
import useChip from "../hooks/useChip";
import { anonReady } from "@/app/lib/zk/anonSigner";
import useIdentity from "../hooks/useIdentity";
import resolveUri from "../hooks/resolveUri";
import { txUrl } from "@/app/lib/chains";
import { commentTag } from "@/app/lib/commentTag";
import { ProposalSummary } from "../types/common.types";

const label = "relative flex text-[10px] text-gray-400";
const arLink =
  "relative flex w-fit text-xs underline cursor-blacksmithHS text-gray-200";
const btn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";

type ProposalDict = ReturnType<typeof useShell>["dict"]["proposal"];

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
const fmtTime = (ts?: number): string => {
  if (!ts) return "—";
  return new Date(ts * 1000).toISOString().slice(0, 16).replace("T", " ");
};

const describe = (p: ProposalSummary, d: ProposalDict): string => {
  if (p.kind === 0)
    return fmt(p.banned ? d.describeBan : d.describeUnban, {
      address: short(p.project),
    });
  if (p.kind === 1) return fmt(d.describeQuorum, { value: p.value });
  if (p.kind === 2)
    return fmt(d.describeWindow, { minutes: Math.round(Number(p.value) / 60) });
  return "—";
};

const ProposalDetailCenter: FunctionComponent<{ id: string }> = ({
  id,
}): JSX.Element => {
  const s = useShell();
  const d = s.dict.proposal;
  const KIND = [d.kindBan, d.kindQuorum, d.kindWindow];
  const conn = s.conn;
  const { proposal: p, refetch } = useProposal(id);
  const now = useChainClock();
  const c = useCouncil();
  const { openWalkthrough } = useWalkthrough();
  const signer = useChip();
  const idn = useIdentity(signer.commitment);

  const publicClient = usePublicClient();
  const [confirmChoice, setConfirmChoice] = useState<0 | 1 | null>(null);
  const council = contractConfig("dxCouncil");
  const { data: myVote, refetch: refetchVote } = useQuery({
    queryKey: ["my-vote", id, signer.commitment],
    queryFn: async (): Promise<number> => {
      const identity = getIdentity();
      if (!identity || !publicClient || !council.ready) return -1;
      const mine = semaphoreNullifier(BigInt(id), identity.secretScalar);
      const logs = await publicClient.getLogs({
        address: council.address as `0x${string}`,
        event: parseAbiItem(
          "event Voted(uint256 indexed id, uint8 choice, uint256 nullifier)",
        ),
        args: { id: BigInt(id) },
        fromBlock: 0n,
      });
      const ours = logs.filter((l) => l.args.nullifier === mine);
      return ours.length ? Number(ours[ours.length - 1].args.choice) : -1;
    },
    enabled: Boolean(publicClient && council.ready && signer.connected),
  });
  const voted = typeof myVote === "number" && myVote >= 0;

  if (!p) {
    return (
      <Caja className="flex-col flex-1 gap-2 p-4">
        <span className="relative flex text-sm text-gray-400">
          {fmt(s.dict.proposal.notFound, { id })}
        </span>
      </Caja>
    );
  }

  const open = !p.executed && p.end > 0 && now < p.end;
  const closed = !p.executed && p.end > 0 && now >= p.end;
  const canVote =
    idn.enrolled &&
    (anonReady() || (conn.isConnected && !conn.wrongNetwork));
  const stateText = p.executed ? d.stateExecuted : open ? d.stateOpen : d.stateClosed;
  const total = p.yes + p.no;
  const pct = total > 0 ? (p.yes / total) * 100 : 0;
  const quorum = typeof c.quorum === "bigint" ? Number(c.quorum) : 0;

  const txHref = txUrl(p.tx);

  const castVote = async (choice: 0 | 1): Promise<void> => {
    if (!anonReady()) {
      if (!conn.isConnected) {
        conn.connect();
        return;
      }
      if (conn.wrongNetwork) {
        conn.switchNetwork();
        return;
      }
    }
    if (!idn.enrolled) {
      openWalkthrough();
      return;
    }
    try {
      await c.vote(BigInt(p.id), choice);
      refetch();
      refetchVote();
    } catch {}
  };

  const doExecute = async (): Promise<void> => {
    if (!conn.isConnected) {
      conn.connect();
      return;
    }
    if (conn.wrongNetwork) {
      conn.switchNetwork();
      return;
    }
    try {
      await c.execute(BigInt(p.id));
      refetch();
    } catch {}
  };

  return (
    <Caja className="flex-col flex-1 gap-2 p-4">
      <div className="relative flex flex-col lg:flex-row gap-2">
        <div className="relative flex flex-col flex-1 gap-2">
          <Caja bg="bg" className="flex-col gap-2 p-3">
            <div className="relative flex flex-row items-center gap-2 flex-wrap text-xs text-gray-300">
              <span className="relative flex">{fmt(s.dict.proposal.proposalNumber, { id: p.id })}</span>
              <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-200">
                {KIND[p.kind] || "—"}
              </span>
              <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px]">
                {stateText}
              </span>
              {open && (
                <span className="relative flex bg-green-500/20 px-2 py-0.5 text-[10px] text-green-300">
                  {fmt(s.dict.proposal.timeLeft, {
                    time: countdown(p.end - now),
                  })}
                </span>
              )}
            </div>
            <span className="relative flex text-sm">{p.title || "—"}</span>
            <span className="relative flex text-[10px] text-gray-400">
              {describe(p, d)}
            </span>
            <div className="relative flex flex-row gap-2 items-center">
              <span className={label}>{s.dict.proposal.tx}</span>
              {txHref ? (
                <a href={txHref} target="_blank" rel="noreferrer" className={arLink}>
                  {s.dict.common.viewTx}
                </a>
              ) : (
                <span className="relative flex text-[10px] text-gray-500">—</span>
              )}
            </div>
          </Caja>

          <Caja bg="bg" className="flex-col gap-1 p-2">
            <span className={label}>{s.dict.proposal.reason}</span>
            <span className="relative flex text-xs leading-relaxed whitespace-pre-wrap">
              {p.reason || "—"}
            </span>
          </Caja>

          {p.links.length > 0 && (
            <Caja bg="bg" className="flex-col gap-1 p-2">
              <span className={label}>{s.dict.proposal.evidence}</span>
              {p.links.map((l, i) => {
                const r = resolveUri(l);
                const href = r.url
                  ? r.url
                  : /^https?:\/\//i.test(l)
                  ? l
                  : `https://${l}`;
                return (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={arLink}
                  >
                    {l}
                  </a>
                );
              })}
            </Caja>
          )}

          <Caja bg="bg" className="flex-col gap-2 p-3">
            <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
              <span className="relative flex">{fmt(s.dict.proposal.opens, { time: fmtTime(p.start) })}</span>
              <span className="relative flex">{fmt(s.dict.proposal.closes, { time: fmtTime(p.end) })}</span>
              <span className="relative flex">{fmt(s.dict.proposal.quorum, { quorum: quorum || "—" })}</span>
            </div>
            <div className="relative flex flex-row flex-wrap gap-x-4 text-xs">
              <span className="relative flex">✓ {p.yes}</span>
              <span className="relative flex">✗ {p.no}</span>
            </div>
            <div className="relative flex w-full h-1 bg-white/10">
              <div
                className="relative flex h-full bg-white/60"
                style={{ width: `${pct}%` }}
              />
            </div>
          </Caja>

          {open && voted && (
            <Caja bg="bg" className="flex-col gap-2 p-3">
              <span className="relative flex text-xs text-green-400">
                ✓{" "}
                {fmt(s.dict.proposal.alreadyVoted, {
                  choice:
                    myVote === 1 ? s.dict.proposal.yes : s.dict.proposal.no,
                })}
              </span>
            </Caja>
          )}

          {open && !voted && confirmChoice !== null && (
            <Caja bg="bg" className="flex-col gap-2 p-3">
              <span className="relative flex text-xs text-yellow-300 leading-relaxed">
                {fmt(s.dict.proposal.voteConfirm, {
                  choice:
                    confirmChoice === 1
                      ? s.dict.proposal.yes
                      : s.dict.proposal.no,
                })}
              </span>
              <div className="relative flex flex-row gap-2 items-center flex-wrap">
                <button
                  onClick={() => {
                    const ch = confirmChoice;
                    setConfirmChoice(null);
                    castVote(ch);
                  }}
                  disabled={c.isPending}
                  className={`${btn} ${c.isPending ? "opacity-40" : ""}`}
                >
                  {s.dict.proposal.confirmVote}
                </button>
                <button
                  onClick={() => setConfirmChoice(null)}
                  className={btn}
                >
                  {s.dict.common.cancel}
                </button>
              </div>
            </Caja>
          )}

          {open && !voted && confirmChoice === null && (
            <Caja bg="bg" className="flex-col gap-2 p-3">
              <span className={label}>{s.dict.proposal.voteAnonymous}</span>
              <div className="relative flex flex-row gap-2 items-center flex-wrap">
                <button
                  onClick={() => (canVote ? setConfirmChoice(1) : castVote(1))}
                  disabled={c.isPending}
                  className={`${btn} ${c.isPending ? "opacity-40" : ""}`}
                >
                  {anonReady()
                    ? !idn.enrolled
                      ? s.dict.proposal.registerChip
                      : s.dict.proposal.voteYes
                    : !conn.isConnected
                    ? s.dict.connection.connectWallet
                    : conn.wrongNetwork
                    ? s.dict.connection.switchChain
                    : !idn.enrolled
                    ? s.dict.proposal.registerChip
                    : s.dict.proposal.voteYes}
                </button>
                {(anonReady() || (conn.isConnected && !conn.wrongNetwork)) &&
                  idn.enrolled && (
                  <button
                    onClick={() => (canVote ? setConfirmChoice(0) : castVote(0))}
                    disabled={c.isPending}
                    className={`${btn} ${c.isPending ? "opacity-40" : ""}`}
                  >
                    {s.dict.proposal.voteNo}
                  </button>
                )}
              </div>
            </Caja>
          )}

          {closed && (
            <Caja bg="bg" className="flex-col gap-2 p-3">
              <span className={label}>{s.dict.proposal.votingClosed}</span>
              <button
                onClick={doExecute}
                disabled={c.isPending}
                className={`${btn} w-fit ${c.isPending ? "opacity-40" : ""}`}
              >
                {!conn.isConnected
                  ? s.dict.connection.connectWallet
                  : conn.wrongNetwork
                  ? s.dict.connection.switchChain
                  : s.dict.proposal.execute}
              </button>
            </Caja>
          )}
        </div>

        <KitComments canonicalTag={commentTag("proposal", p.id)} />
      </div>
    </Caja>
  );
};

export default ProposalDetailCenter;
