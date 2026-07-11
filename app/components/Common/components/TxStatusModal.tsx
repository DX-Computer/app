"use client";

import { CSSProperties, FunctionComponent, JSX } from "react";
import { usePathname } from "next/navigation";
import Marco from "./Marco";
import { TxStatus } from "../types/common.types";
import { LOCALES } from "@/app/lib/constants";
import en from "@/app/dictionaries/en.json";
import es from "@/app/dictionaries/es.json";
import ar from "@/app/dictionaries/ar.json";
import pt from "@/app/dictionaries/pt.json";
import fr from "@/app/dictionaries/fr.json";

const dicts = { en, es, ar, pt, fr } as unknown as Record<string, any>;

const fondo: CSSProperties = {
  backgroundImage: "url('/images/bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const navBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-2 text-xs cursor-blacksmithHS";

type Props = {
  status: TxStatus | null;
  onClose: () => void;
};

const TxStatusModal: FunctionComponent<Props> = ({
  status,
  onClose,
}): JSX.Element | null => {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean);
  const lang = LOCALES.includes(seg[0]) ? seg[0] : "en";
  const t = (dicts[lang] ?? dicts.en).tx;

  if (!status) return null;

  const canClose = status.phase !== "pending";
  const pendingBody =
    (status.message && t[status.message]) || status.message || t.waiting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex flex-col w-full max-w-sm">
        <Marco className="flex-col">
          <div
            className="relative flex flex-col gap-3 p-5 text-white"
            style={fondo}
          >
            <div className="relative flex flex-row items-center gap-2">
              <span className="relative flex flex-1 text-sm break-all">
                {t[status.phase]}
              </span>
              {canClose && (
                <button
                  onClick={onClose}
                  aria-label="close"
                  className="relative flex text-gray-300 cursor-blacksmithHS"
                >
                  ✕
                </button>
              )}
            </div>

            {status.phase === "pending" && (
              <div className="relative flex flex-row items-center gap-2">
                <span className="relative flex h-2 w-2 animate-pulse bg-white/70" />
                <span className="relative flex text-[10px] text-gray-400">
                  {pendingBody}
                </span>
              </div>
            )}

            {status.message && status.phase === "error" && (
              <span className="relative flex text-[10px] text-red-400 leading-relaxed break-words break-all overflow-y-scroll max-h-[70vh]">
                {t[status.message] || status.message}
              </span>
            )}

            {status.note && status.phase === "success" && (
              <span className="relative flex text-[10px] text-yellow-300 leading-relaxed break-words break-all overflow-y-scroll max-h-[70vh]">
                {status.note}
              </span>
            )}

            {status.hash && (
              <span className="relative flex text-[10px] text-gray-300 break-all overflow-y-scroll max-h-[70vh]">
                {status.hash}
              </span>
            )}

            {canClose && (
              <button onClick={onClose} className={`${navBtn} self-start`}>
                {t.close}
              </button>
            )}
          </div>
        </Marco>
      </div>
    </div>
  );
};

export default TxStatusModal;
