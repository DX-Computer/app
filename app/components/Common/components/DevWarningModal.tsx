"use client";

import { CSSProperties, FunctionComponent, JSX, useState } from "react";
import { usePathname } from "next/navigation";
import Marco from "./Marco";
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

const actionBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";

const DevWarningModal: FunctionComponent = (): JSX.Element | null => {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean);
  const lang = LOCALES.includes(seg[0]) ? seg[0] : "en";
  const d = (dicts[lang] ?? dicts.en).dev;

  const [open, setOpen] = useState<boolean>(true);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex flex-col w-full max-w-md">
        <Marco className="flex-col">
          <div
            className="relative flex flex-col gap-4 p-5 text-white"
            style={fondo}
          >
            <span className="relative flex text-sm text-yellow-300">
              {d.title}
            </span>
            <span className="relative flex text-[11px] text-gray-200 leading-relaxed">
              {d.body}
            </span>
            <button
              onClick={() => setOpen(false)}
              className={`${actionBtn} self-start`}
            >
              {d.understand}
            </button>
          </div>
        </Marco>
      </div>
    </div>
  );
};

export default DevWarningModal;
