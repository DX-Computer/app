"use client";

import { CSSProperties, FunctionComponent, JSX, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import Marco from "./Marco";
import useConnection from "../hooks/useConnection";
import useChip from "../hooks/useChip";
import useIdentity from "../hooks/useIdentity";
import usePool from "../hooks/usePool";
import { contractConfig } from "@/app/lib/contracts";
import { ACTIVE_CHAIN, LOCALES } from "@/app/lib/constants";
import en from "@/app/dictionaries/en.json";
import es from "@/app/dictionaries/es.json";
import ar from "@/app/dictionaries/ar.json";
import pt from "@/app/dictionaries/pt.json";
import fr from "@/app/dictionaries/fr.json";

type Props = { open: boolean; onClose: () => void };

const dicts = { en, es, ar, pt, fr } as unknown as Record<string, any>;

const fondo: CSSProperties = {
  backgroundImage: "url('/images/bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const actionBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";
const label = "relative flex text-[10px] text-gray-400";

const RegisterBalanceModal: FunctionComponent<Props> = ({
  open,
  onClose,
}): JSX.Element | null => {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean);
  const lang = LOCALES.includes(seg[0]) ? seg[0] : "en";
  const d = (dicts[lang] ?? dicts.en).balance;
  const c = (dicts[lang] ?? dicts.en).connection;

  const conn = useConnection();
  const chip = useChip();
  const idn = useIdentity(chip.commitment);
  const pool = usePool();
  const [deposited, setDeposited] = useState(false);

  const { address: account } = useAccount();
  const monaCfg = contractConfig("mona");
  const { data: balRaw } = useReadContract({
    address: monaCfg.address as `0x${string}`,
    abi: monaCfg.abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    chainId: ACTIVE_CHAIN.id,
    query: { enabled: Boolean(monaCfg.ready && account && open) },
  });
  const balance = typeof balRaw === "bigint" ? balRaw : 0n;
  const denom = typeof pool.denomination === "bigint" ? pool.denomination : 0n;

  useEffect(() => {
    if (!open || !chip.connected || !idn.enrolled) return;
    pool.hasDeposit("active").then(setDeposited);
  }, [open, chip.connected, idn.enrolled, pool.activeBucket]);

  if (!open) return null;

  const ready =
    conn.isConnected && !conn.wrongNetwork && chip.connected && idn.enrolled;
  const noMona =
    conn.isConnected && !conn.wrongNetwork && denom > 0n && balance < denom;

  const doDeposit = async (): Promise<void> => {
    try {
      await pool.deposit();
      setDeposited(true);
    } catch {}
  };

  const primary = !conn.isConnected
    ? { text: c.connectWallet, run: conn.connect }
    : conn.wrongNetwork
    ? { text: c.switchChain, run: conn.switchNetwork }
    : !chip.connected
    ? { text: c.chip, run: () => chip.connect() }
    : { text: pool.isPending ? d.registering : d.register, run: doDeposit };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex flex-col w-full max-w-sm">
        <Marco className="flex-col">
          <div
            className="relative flex flex-col gap-4 p-5 text-white"
            style={fondo}
          >
            <div className="relative flex flex-row items-center gap-2">
              <span className="relative flex flex-1 text-sm">{d.title}</span>
              <button
                onClick={onClose}
                aria-label="close"
                className="relative flex text-gray-300 cursor-blacksmithHS"
              >
                ✕
              </button>
            </div>

            <span className={`${label} leading-relaxed`}>{d.hint}</span>

            <span
              className={`relative flex text-[10px] text-yellow-300 leading-relaxed`}
            >
              {d.privacyNote}
            </span>

            <div className="relative flex flex-col gap-1">
              <span className="relative flex text-[10px] text-gray-300">
                {conn.isConnected ? "✓ " : "• "}
                {conn.isConnected ? conn.short : c.notConnected} · {c.wallet}
              </span>
              <span className="relative flex text-[10px] text-gray-300">
                {chip.connected && idn.enrolled ? "✓ " : "• "}
                {chip.connected
                  ? idn.enrolled
                    ? c.connected
                    : d.needEnroll
                  : c.notConnected}{" "}
                · {c.chip}
              </span>
              {denom > 0n && (
                <span className="relative flex text-[10px] text-gray-300">
                  {d.denomination}: {Number(formatUnits(denom, 18)).toLocaleString()} MONA
                </span>
              )}
              {conn.isConnected && (
                <span
                  className={`relative flex text-[10px] ${
                    noMona ? "text-red-400" : "text-gray-300"
                  }`}
                >
                  {noMona ? "• " : "✓ "}
                  {Number(formatUnits(balance, 18)).toLocaleString()} MONA
                </span>
              )}
              {deposited && (
                <span className="relative flex text-[10px] text-green-400">
                  ✓ {d.deposited}
                </span>
              )}
            </div>

            {noMona && (
              <span className={`${label} text-red-400`}>{d.noMona}</span>
            )}

            <div className="relative flex flex-row gap-2 flex-wrap">
              {!deposited && (
                <button
                  onClick={primary.run}
                  disabled={pool.isPending || (ready && noMona)}
                  className={`${actionBtn} self-start ${
                    pool.isPending || (ready && noMona) ? "opacity-40" : ""
                  }`}
                >
                  {primary.text}
                </button>
              )}
              {deposited && (
                <span className={label}>{d.withdrawNote}</span>
              )}
            </div>

            {ready && !noMona && !deposited && (
              <span className={label}>{d.readyHint}</span>
            )}
          </div>
        </Marco>
      </div>
    </div>
  );
};

export default RegisterBalanceModal;
