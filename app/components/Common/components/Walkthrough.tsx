"use client";

import { CSSProperties, FunctionComponent, JSX, useState } from "react";
import { usePathname } from "next/navigation";
import Marco from "./Marco";
import useConnection from "../hooks/useConnection";
import useIdentity from "../hooks/useIdentity";
import useChip from "../hooks/useChip";
import { WalkthroughDict, WalkthroughProps } from "../types/common.types";
import { LOCALES } from "@/app/lib/constants";
import { anonReady } from "@/app/lib/zk/anonSigner";
import en from "@/app/dictionaries/en.json";
import es from "@/app/dictionaries/es.json";
import ar from "@/app/dictionaries/ar.json";
import pt from "@/app/dictionaries/pt.json";
import fr from "@/app/dictionaries/fr.json";

const dicts = { en, es, ar, pt, fr } as unknown as Record<
  string,
  { walkthrough: WalkthroughDict }
>;

const ENROLL_STEP = 1;

const fondo: CSSProperties = {
  backgroundImage: "url('/images/bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const navBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-2 text-xs cursor-blacksmithHS";
const ghostBtn =
  "relative flex bg-[url(/images/bg.png)] bg-cover bg-center px-3 py-2 text-xs text-white cursor-blacksmithHS";
const tag = "relative flex text-[10px] text-gray-400";

const Walkthrough: FunctionComponent<WalkthroughProps> = ({
  open,
  onClose,
}): JSX.Element | null => {
  const [i, setI] = useState<number>(0);

  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean);
  const lang = LOCALES.includes(seg[0]) ? seg[0] : "en";
  const w = (dicts[lang] ?? dicts.en).walkthrough;
  const steps = w.steps;

  const conn = useConnection();
  const chip = useChip();
  const id = useIdentity(chip.commitment);

  const doEnroll = async (): Promise<void> => {
    try {
      const d = await chip.enrollData();
      if (!d) return;
      await id.enroll(d.proof, d.commitment, d.enrollNullifier);
      id.refetch();
    } catch {}
  };

  const walletFree = anonReady();
  const enrollWorking = chip.busy || id.isPending;
  const enrollBlocked =
    (walletFree || (conn.isConnected && !conn.wrongNetwork)) && enrollWorking;

  if (!open) return null;

  const step = steps[i];
  const first = i === 0;
  const last = i === steps.length - 1;

  const close = (): void => {
    setI(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex flex-col w-full max-w-lg max-h-[85vh]">
        <Marco className="flex-col">
          <div
            className="relative flex flex-col gap-4 p-5 text-white md:min-h-0 md:overflow-y-auto"
            style={fondo}
          >
            <div className="relative flex flex-row items-center gap-2">
              <span className="relative flex flex-1 text-sm">{w.title}</span>
              <button
                onClick={close}
                aria-label="close"
                className="relative flex text-gray-300 cursor-blacksmithHS"
              >
                ✕
              </button>
            </div>

            <span className="relative flex text-[10px] text-gray-400">
              {i + 1} / {steps.length}
            </span>

            <div className="relative flex flex-row flex-wrap gap-1">
              {steps.map((_, j) => (
                <div
                  key={j}
                  className={`relative flex flex-1 h-1 ${
                    j <= i ? "bg-white/70" : "bg-white/15"
                  }`}
                />
              ))}
            </div>

            <span className="relative flex text-sm">{step.title}</span>
            <span className="relative flex text-xs leading-relaxed">
              {step.body}
            </span>

            {i === ENROLL_STEP && (
              <div className="relative flex flex-col gap-2">
                {!chip.connected ? (
                  <>
                    <span className={tag}>{w.connectPrompt}</span>
                    <button
                      onClick={chip.connect}
                      disabled={chip.busy}
                      className={`${navBtn} self-start ${
                        chip.busy ? "opacity-40" : ""
                      }`}
                    >
                      {chip.busy ? w.connecting : w.connectChip}
                    </button>
                  </>
                ) : (
                  <>
                    <span className={tag}>{w.chipCommitment}</span>
                    <span className="relative flex text-[10px] text-gray-300 break-all">
                      {chip.commitment}
                    </span>

                    {id.enrolled ? (
                      <span className="relative flex text-[10px] text-green-400">
                        ✓ {w.enrolled}
                      </span>
                    ) : id.enrolledKnown ? (
                      <div className="relative flex flex-col gap-2">
                        <span className="relative flex text-[10px] text-gray-300">
                          {w.notEnrolled}
                        </span>
                        <button
                          onClick={
                            walletFree
                              ? doEnroll
                              : !conn.isConnected
                              ? conn.connect
                              : conn.wrongNetwork
                              ? conn.switchNetwork
                              : doEnroll
                          }
                          disabled={enrollBlocked}
                          className={`${navBtn} self-start ${
                            enrollBlocked ? "opacity-40" : ""
                          }`}
                        >
                          {walletFree
                            ? enrollWorking
                              ? w.enrolling
                              : w.enrolChip
                            : !conn.isConnected
                            ? w.connectWallet
                            : conn.wrongNetwork
                            ? w.switchChain
                            : enrollWorking
                            ? w.enrolling
                            : w.enrolChip}
                        </button>
                      </div>
                    ) : (
                      <span className="relative flex text-[10px] text-gray-400">
                        {w.checking}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="relative flex flex-row items-center gap-2 flex-wrap">
              <button
                onClick={() => setI((v) => Math.max(0, v - 1))}
                disabled={first}
                className={`${ghostBtn} ${first ? "opacity-30" : ""}`}
              >
                {w.back}
              </button>
              {last ? (
                <button onClick={close} className={navBtn}>
                  {w.done}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setI((v) => Math.min(steps.length - 1, v + 1))
                  }
                  className={navBtn}
                >
                  {w.next}
                </button>
              )}
            </div>
          </div>
        </Marco>
      </div>
    </div>
  );
};

export default Walkthrough;
