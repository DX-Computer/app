"use client";

import {
  FunctionComponent,
  JSX,
  ReactNode,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useDashboard from "../hooks/useDashboard";
import useChip from "../hooks/useChip";
import usePool from "../hooks/usePool";
import useGrantRewards from "../hooks/useGrantRewards";
import useGrants from "../hooks/useGrants";
import useDxBudget from "../hooks/useDxBudget";
import DashboardOrders from "./DashboardOrders";
import { txUrl } from "@/app/lib/chains";
import { DashboardTheme } from "../types/common.types";

const btn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-3 py-1 text-[10px] cursor-blacksmithHS";

const label = "relative flex text-[10px] text-gray-400";
const row =
  "relative flex flex-row items-center gap-2 bg-[url(/images/fondocaja.png)] bg-cover bg-center p-2";
const rowLink = `${row} cursor-blacksmithHS`;
const tagChip =
  "relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300";

const fmtTime = (ts?: string): string => {
  const n = Number(ts);
  if (!ts || !n) return "—";
  return new Date(n * 1000).toISOString().slice(0, 10);
};

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

const DashboardCenter: FunctionComponent<{ theme: DashboardTheme }> = ({
  theme,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const chip = useChip();
  const { data, loading } = useDashboard();
  const grantRewards = useGrantRewards(data.fundedGrants.map((g) => g.id));
  const grants = useGrants();
  const budget = useDxBudget();
  const pool = usePool();
  const [poolDeposits, setPoolDeposits] = useState<
    { bucket: number; denomination: bigint }[]
  >([]);
  const [view, setView] = useState<"public" | "anonymous">(
    conn.isConnected ? "public" : "anonymous",
  );

  useEffect(() => {
    if (!chip.connected) return;
    pool.deposits().then(setPoolDeposits);
  }, [chip.connected, pool.activeBucket, pool.isPending]);

  const claimGrant = async (grantId: string): Promise<void> => {
    try {
      await grants.claim(BigInt(grantId));
      grantRewards.refetch();
    } catch {}
  };

  if (!conn.isConnected && !chip.connected) {
    return (
      <Caja className="flex-col flex-1 items-center justify-center p-4">
        <span className="relative flex text-xs text-gray-400">
          {s.dict.dashboard.connectPrompt}
        </span>
      </Caja>
    );
  }

  if (loading) {
    return (
      <Caja className="flex-col flex-1 items-center justify-center p-4">
        <span className="relative flex text-xs text-gray-400">
          {s.dict.createKit.loadingCurrentContent}
        </span>
      </Caja>
    );
  }

  const section = (heading: string, children: ReactNode): JSX.Element => (
    <Caja bg="bg" className="flex-col gap-2 p-3">
      <span className={label}>{heading}</span>
      <div className="relative flex flex-col gap-1">{children}</div>
    </Caja>
  );

  const emptyNote = (
    <span className="relative flex text-[10px] text-gray-500">
      {loading ? s.dict.createKit.loadingCurrentContent : s.dict.dashboard.empty}
    </span>
  );

  const budgetSection = budget.ready && budget.isAdmin
    ? section(
        s.dict.dashboard.matroidBudget,
        <>
          <div className={row}>
            <span className={label}>{s.dict.dashboard.budgetEpoch}</span>
            <span className="relative flex text-[10px]">
              {String(budget.targetEpoch)}
            </span>
            <span className={label}>{s.dict.dashboard.budgetClaimable}</span>
            <span className="relative flex text-[10px]">
              {formatUnits(budget.claimable ?? 0n, 18)} MONA
            </span>
            <span className={label}>{s.dict.dashboard.budgetBalance}</span>
            <span className="relative flex text-[10px]">
              {formatUnits(budget.projectBalance ?? 0n, 18)} MONA
            </span>
          </div>
          <div className="relative flex flex-row flex-wrap gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => budget.claimBudget()}
              disabled={budget.isPending}
            >
              {s.dict.dashboard.budgetClaim}
            </button>
          </div>
        </>,
      )
    : null;

  const poolSection =
    pool.ready && poolDeposits.length > 0
      ? section(
          s.dict.balance.title,
          <>
            {poolDeposits.map((dep) => (
              <div key={dep.bucket} className={row}>
                <span className="relative flex text-[10px] text-green-400">
                  ✓ {s.dict.balance.deposited}
                </span>
                <span className={`${label} flex-1`}>
                  {formatUnits(dep.denomination, 18)} MONA
                </span>
                <button
                  type="button"
                  className={btn}
                  onClick={() =>
                    !conn.isConnected
                      ? conn.connect()
                      : conn.wrongNetwork
                      ? conn.switchNetwork()
                      : pool.withdraw(dep.bucket)
                  }
                  disabled={pool.isPending}
                >
                  {!conn.isConnected
                    ? s.dict.connection.connectWallet
                    : conn.wrongNetwork
                    ? s.dict.connection.switchChain
                    : pool.isPending
                    ? s.dict.balance.withdrawing
                    : s.dict.balance.withdraw}
                </button>
              </div>
            ))}
          </>,
        )
      : null;

  return (
    <Caja className="flex-col flex-1 gap-2 p-4">
      <div className="relative flex flex-row gap-1">
        <button
          onClick={() => setView("public")}
          className={`relative flex bg-white/10 px-2 py-1 text-[10px] cursor-blacksmithHS ${
            view === "public" ? "text-white" : "text-gray-500"
          }`}
        >
          {s.dict.createProposal.visibilityPublic}
        </button>
        <button
          onClick={() => setView("anonymous")}
          className={`relative flex bg-white/10 px-2 py-1 text-[10px] cursor-blacksmithHS ${
            view === "anonymous" ? "text-white" : "text-gray-500"
          }`}
        >
          {s.dict.createProposal.visibilityAnonymous}
        </button>
      </div>
      {view === "public" && budgetSection}
      {view === "anonymous" && poolSection}
      {theme === "launches" && (
        <>
          {section(
            fmt(s.dict.dashboard.kitsHeading, { count: data.kits.length }),
            data.kits.length
              ? data.kits.map((k) => (
                  <div key={k.id} className={`${row} flex-wrap`}>
                    <Link
                      href={`/${s.lang}/kit/${k.id}`}
                      className="relative flex flex-1 text-xs text-white cursor-blacksmithHS"
                    >
                      #{k.id} · {k.title || "—"}
                    </Link>
                    {k.revoked && (
                      <span className={tagChip}>{s.dict.dashboard.deletedTag}</span>
                    )}
                  </div>
                ))
              : emptyNote,
          )}
          {section(
            fmt(s.dict.dashboard.productsHeading, { count: data.offers.length }),
            data.offers.length
              ? data.offers.map((o) => (
                  <Link key={o.id} href={`/${s.lang}/market/${o.id}`} className={rowLink}>
                    <span className="relative flex flex-1 text-xs text-white">
                      #{o.id} · {o.title || "—"}
                    </span>
                    {!o.exists && (
                      <span className={tagChip}>{s.dict.dashboard.deletedTag}</span>
                    )}
                  </Link>
                ))
              : emptyNote,
          )}
          {section(
            fmt(s.dict.dashboard.grantsHeading, { count: data.grants.length }),
            data.grants.length
              ? data.grants.map((g) => (
                  <Link
                    key={g.id}
                    href={`/${s.lang}/treeliner-grant/${g.id}`}
                    className={rowLink}
                  >
                    <span className="relative flex flex-1 text-xs text-white">
                      #{g.id} · {g.title || "—"}
                    </span>
                    <span className="relative flex text-[10px] text-gray-300">
                      {fmt(s.dict.kitGrants.amountOfBudget, {
                        raised: g.raised,
                        budget: g.budget,
                      })}
                    </span>
                    {g.removed && (
                      <span className={tagChip}>{s.dict.dashboard.deletedTag}</span>
                    )}
                  </Link>
                ))
              : emptyNote,
          )}
          {section(
            fmt(s.dict.dashboard.agentsHeading, { count: data.agents.length }),
            data.agents.length
              ? data.agents.map((a) => (
                  <Link
                    key={a.id}
                    href={`/${s.lang}/cyberswagman-agent/${a.id}`}
                    className={rowLink}
                  >
                    <span className="relative flex flex-1 text-xs text-white">
                      #{a.id} · {a.title || "—"}
                    </span>
                  </Link>
                ))
              : emptyNote,
          )}
        </>
      )}

      {theme === "comments" && (
        <>
          {section(
            fmt(s.dict.dashboard.commentsHeading, { count: data.comments.length }),
            data.comments.length
              ? data.comments.map((c) => {
                  const inner = (
                    <>
                      <span className="relative flex flex-1 text-xs text-white leading-relaxed">
                        {c.text || "—"}
                      </span>
                      <span className="relative flex text-[10px] text-gray-400">
                        {fmtTime(c.time)}
                      </span>
                      {c.revoked && (
                        <span className={tagChip}>{s.dict.dashboard.deletedTag}</span>
                      )}
                    </>
                  );
                  return c.href ? (
                    <Link key={c.id} href={`/${s.lang}/${c.href}`} className={rowLink}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={c.id} className={row}>
                      {inner}
                    </div>
                  );
                })
              : emptyNote,
          )}
          {section(
            fmt(s.dict.dashboard.signalsHeading, { count: data.signals.length }),
            data.signals.length
              ? data.signals.map((sig, i) => (
                  <Link
                    key={i}
                    href={`/${s.lang}/kit/${sig.kitId}`}
                    className={rowLink}
                  >
                    <span className="relative flex flex-1 text-xs text-white">
                      {fmt(s.dict.agent.kitNumber, { id: sig.kitId })}
                    </span>
                    <span className="relative flex text-[10px] text-gray-300">
                      {sig.choice === 1 ? s.dict.kit.endorse : s.dict.kit.needsWork}
                    </span>
                    <span className={tagChip}>
                      {sig.mode === "public"
                        ? s.dict.comments.public
                        : s.dict.comments.anonymous}
                    </span>
                  </Link>
                ))
              : emptyNote,
          )}
        </>
      )}

      {theme === "purchases" && <DashboardOrders mode="bought" />}

      {theme === "sales" && <DashboardOrders mode="sold" />}

      {theme === "governance" && (
        <>
          {section(
            fmt(s.dict.dashboard.proposalsHeading, {
              count: data.proposals.length,
            }),
            data.proposals.length
              ? data.proposals.map((p) => (
                  <Link
                    key={p.id}
                    href={`/${s.lang}/proposal/${p.id}`}
                    className={rowLink}
                  >
                    <span className="relative flex flex-1 text-xs text-white">
                      #{p.id}
                    </span>
                    <span className="relative flex text-[10px] text-gray-300">
                      {fmt(s.dict.dashboard.tally, { yes: p.yes, no: p.no })}
                    </span>
                    <span className={tagChip}>
                      {p.executed
                        ? s.dict.dashboard.executedTag
                        : s.dict.dashboard.openTag}
                    </span>
                  </Link>
                ))
              : emptyNote,
          )}
          {section(
            fmt(s.dict.dashboard.votedHeading, {
              count: data.votedProposals.length,
            }),
            data.votedProposals.length
              ? data.votedProposals.map((v) => (
                  <Link
                    key={v.id}
                    href={`/${s.lang}/proposal/${v.id}`}
                    className={rowLink}
                  >
                    <span className="relative flex flex-1 text-xs text-white">
                      #{v.id}
                    </span>
                    <span className={tagChip}>
                      {v.choice === 1
                        ? s.dict.proposal.yes
                        : s.dict.proposal.no}
                    </span>
                  </Link>
                ))
              : emptyNote,
          )}
          {section(
            fmt(s.dict.dashboard.bansHeading, { count: data.bans.length }),
            data.bans.length
              ? data.bans.map((b, i) => (
                  <div key={i} className={`${row} flex-wrap`}>
                    <span className="relative flex flex-1 text-xs text-white">
                      {fmt(s.dict.dashboard.bannedCreator, {
                        address: short(b.creator),
                      })}
                    </span>
                    <span className="relative flex text-[10px] text-gray-400">
                      {fmtTime(b.time)}
                    </span>
                    <span className={tagChip}>
                      {b.banned
                        ? s.dict.dashboard.bannedTag
                        : s.dict.dashboard.unbannedTag}
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
                  </div>
                ))
              : emptyNote,
          )}
        </>
      )}

      {theme === "earnings" && (
        <>
          {section(
            s.dict.dashboard.treelinerHeading,
            data.treeliner ? (
              <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs text-white">
                <span className="relative flex">
                  {fmt(s.dict.dashboard.staked, { amount: data.treeliner.staked })}
                </span>
                <span className="relative flex">
                  {fmt(s.dict.dashboard.claimed, {
                    amount: data.treeliner.claimed,
                  })}
                </span>
                <span className="relative flex text-gray-300">
                  {fmt(s.dict.dashboard.grantsFundedCount, {
                    count: data.treeliner.grantsFunded,
                  })}
                </span>
              </div>
            ) : (
              emptyNote
            ),
          )}
          {section(
            fmt(s.dict.dashboard.fundedHeading, {
              count: data.fundedGrants.length,
            }),
            data.fundedGrants.length
              ? data.fundedGrants.map((g) => {
                  const pending = grantRewards.pending[g.id] ?? 0;
                  return (
                    <div key={g.id} className={`${row} flex-wrap`}>
                      <Link
                        href={`/${s.lang}/treeliner-grant/${g.id}`}
                        className="relative flex flex-1 text-xs text-white cursor-blacksmithHS"
                      >
                        #{g.id} · {g.title || "—"}
                      </Link>
                      <span className="relative flex text-[10px] text-gray-300">
                        {fmt(s.dict.dashboard.sharesLabel, { amount: g.shares })}
                      </span>
                      <span className="relative flex text-[10px] text-gray-300">
                        {fmt(s.dict.dashboard.pendingLabel, { amount: pending })}
                      </span>
                      <button
                        onClick={
                          conn.wrongNetwork
                            ? conn.switchNetwork
                            : () => claimGrant(g.id)
                        }
                        disabled={grants.isPending || pending <= 0}
                        className={`${btn} ${
                          grants.isPending || pending <= 0 ? "opacity-40" : ""
                        }`}
                      >
                        {s.dict.dashboard.claimReward}
                      </button>
                      {g.removed && (
                        <span className={tagChip}>{s.dict.dashboard.deletedTag}</span>
                      )}
                    </div>
                  );
                })
              : emptyNote,
          )}
        </>
      )}
    </Caja>
  );
};

export default DashboardCenter;
