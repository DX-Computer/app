"use client";

import { CSSProperties, FunctionComponent, JSX } from "react";
import { usePathname } from "next/navigation";
import Marco from "./Marco";
import { LOCALES } from "@/app/lib/constants";
import en from "@/app/dictionaries/en.json";
import es from "@/app/dictionaries/es.json";
import ar from "@/app/dictionaries/ar.json";
import pt from "@/app/dictionaries/pt.json";
import fr from "@/app/dictionaries/fr.json";

type Props = { open: boolean; onClose: () => void };

const dicts = { en, es, ar, pt, fr } as unknown as Record<string, any>;

const STAKING_URL =
  process.env.NEXT_PUBLIC_STAKING_URL || "https://staking.digitalax.xyz";

const fondo: CSSProperties = {
  backgroundImage: "url('/images/bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const actionBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";
const label = "relative flex text-[10px] text-gray-400";

const SponsorPoolModal: FunctionComponent<Props> = ({
  open,
  onClose,
}): JSX.Element | null => {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean);
  const lang = LOCALES.includes(seg[0]) ? seg[0] : "en";
  const d = (dicts[lang] ?? dicts.en).sponsor;

  if (!open) return null;

  const href = `${STAKING_URL}/${lang}/#matroid`;

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

            <div className="relative flex flex-row gap-2 flex-wrap">
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className={`${actionBtn} self-start`}
              >
                {d.topUp}
              </a>
              <button onClick={onClose} className={`${actionBtn} self-start`}>
                {(dicts[lang] ?? dicts.en).common.close}
              </button>
            </div>
          </div>
        </Marco>
      </div>
    </div>
  );
};

export default SponsorPoolModal;
