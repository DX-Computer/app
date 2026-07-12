"use client";

import { CSSProperties, FunctionComponent, JSX, useState } from "react";
import { usePathname } from "next/navigation";
import Marco from "./Marco";
import useConnection from "../hooks/useConnection";
import useChip from "../hooks/useChip";
import { isStrictChip, setStrictChip } from "@/app/lib/zk/identity";
import { LOCALES } from "@/app/lib/constants";
import en from "@/app/dictionaries/en.json";
import es from "@/app/dictionaries/es.json";
import ar from "@/app/dictionaries/ar.json";
import pt from "@/app/dictionaries/pt.json";
import fr from "@/app/dictionaries/fr.json";

type ConnectModalProps = { open: boolean; onClose: () => void };

const dicts = { en, es, ar, pt, fr } as unknown as Record<string, any>;

const fondo: CSSProperties = {
  backgroundImage: "url('/images/bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const rowBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const actionBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";
const ghostBtn = `relative flex ${rowBg} border border-white/25 rounded-sm px-3 py-2 text-xs text-white cursor-blacksmithHS`;

const ConnectModal: FunctionComponent<ConnectModalProps> = ({
  open,
  onClose,
}): JSX.Element | null => {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean);
  const lang = LOCALES.includes(seg[0]) ? seg[0] : "en";
  const d = (dicts[lang] ?? dicts.en).connection;
  const w = (dicts[lang] ?? dicts.en).walkthrough;

  const conn = useConnection();
  const chip = useChip();
  const [strict, setStrict] = useState<boolean>(isStrictChip());

  if (!open) return null;

  const row = (
    label: string,
    state: string,
    ok: boolean,
    actionLabel: string,
    onAction: () => void,
    showAction: boolean,
  ): JSX.Element => (
    <div className="relative flex flex-col gap-1">
      <div className="relative flex flex-row items-center gap-2 flex-wrap">
        <span className="relative flex flex-1 text-sm">{label}</span>
        <span
          className={`relative flex text-[10px] ${
            ok ? "text-green-400" : "text-gray-400"
          }`}
        >
          {ok ? "✓ " : ""}
          {state}
        </span>
      </div>
      {showAction && (
        <button onClick={onAction} className={`${actionBtn} self-start`}>
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex flex-col w-full max-w-sm">
        <Marco className="flex-col">
          <div
            className="relative flex flex-col gap-4 p-5 text-white"
            style={fondo}
          >
            <div className="relative flex flex-row items-center gap-2">
              <span className="relative flex flex-1 text-sm">{d.connect}</span>
              <button
                onClick={onClose}
                aria-label="close"
                className="relative flex text-gray-300 cursor-blacksmithHS"
              >
                ✕
              </button>
            </div>

            {row(
              d.wallet,
              conn.isConnected ? conn.short : d.notConnected,
              conn.isConnected,
              conn.isConnected ? d.disconnect : d.connectWallet,
              conn.isConnected ? conn.disconnect : conn.connect,
              true,
            )}

            {conn.isConnected &&
              row(
                d.network,
                conn.wrongNetwork ? d.wrongNetwork : conn.network,
                !conn.wrongNetwork,
                d.switchChain,
                conn.switchNetwork,
                conn.wrongNetwork,
              )}

            {row(
              d.chip,
              chip.connected
                ? `${chip.commitment?.slice(0, 10)}…`
                : d.notConnected,
              chip.connected,
              chip.busy
                ? w.connecting
                : chip.connected
                ? d.disconnect
                : w.connectChip,
              chip.connected ? chip.disconnect : chip.connect,
              true,
            )}

            <div className="relative flex flex-col gap-1">
              <span className="relative flex flex-1 text-sm">
                {d.secureTitle}
              </span>
              <div className="relative flex flex-row gap-2">
                <button
                  onClick={() => {
                    setStrictChip(false);
                    setStrict(false);
                  }}
                  className={`${actionBtn} ${strict ? "opacity-50" : ""}`}
                >
                  {d.secureSession}
                </button>
                <button
                  onClick={() => {
                    setStrictChip(true);
                    setStrict(true);
                  }}
                  className={`${actionBtn} ${strict ? "" : "opacity-50"}`}
                >
                  {d.secureMax}
                </button>
              </div>
              <span className="relative flex text-[10px] text-gray-400 leading-relaxed">
                {strict ? d.secureMaxNote : d.secureSessionNote}
              </span>
            </div>

            <button onClick={onClose} className={`${ghostBtn} self-end`}>
              {w.done}
            </button>
          </div>
        </Marco>
      </div>
    </div>
  );
};

export default ConnectModal;
