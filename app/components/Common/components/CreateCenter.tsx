"use client";

import { FunctionComponent, JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { useShell } from "./Shell";
import { KitDraft } from "../types/common.types";
import useKitRegistry from "../hooks/useKitRegistry";
import CreateKit from "./CreateKit";
import Caja from "./Caja";
import { anonReady } from "@/app/lib/zk/anonSigner";
import useChip from "../hooks/useChip";
import useIdentity from "../hooks/useIdentity";
import useWalkthrough from "../hooks/useWalkthrough";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const cajaBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm cursor-blacksmithHS";
const ghostBtn = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;

const CreateCenter: FunctionComponent<{ versionOf?: string }> = ({
  versionOf,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const kit = useKitRegistry();
  const router = useRouter();
  const chipSigner = useChip();
  const idn = useIdentity(chipSigner.commitment);
  const { openWalkthrough } = useWalkthrough();
  const parents = s.allItems.map((p) => ({ id: p.id, title: p.title }));

  const initial: Partial<KitDraft> | undefined =
    versionOf && s.selected
      ? {
          mode: s.selected.mode,
          title: s.selected.title,
          summary: s.selected.desc,
          tags: s.selected.tags,
          hardware: s.selected.hardware,
          software: s.selected.software,
          fabrication: s.selected.fabrication,
          stage: s.selected.stage,
          image: s.selected.image,
          video: s.selected.video,
          pdf: s.selected.pdf,
          parent: s.selected.parentId,
        }
      : undefined;

  const [step, setStep] = useState<"form" | "json" | "uri">("form");
  const [draft, setDraft] = useState<KitDraft | null>(null);
  const [uri, setUri] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const json = draft
    ? JSON.stringify(
        {
          title: draft.title,
          summary: draft.summary,
          tags: draft.tags,
          hardware: draft.hardware,
          software: draft.software,
          fabrication: draft.fabrication,
          stage: draft.stage,
          image: draft.image,
          video: draft.video,
          pdf: draft.pdf,
        },
        null,
        2,
      )
    : "";

  const copy = (): void => {
    navigator.clipboard.writeText(json);
    setCopied(true);
  };

  const kitMode = versionOf ? s.selected?.mode : draft?.mode;
  const needsChip = kitMode === "anonymous" && !idn.enrolled;

  const publish = async (): Promise<void> => {
    if (!draft) return;
    if (needsChip) {
      openWalkthrough();
      return;
    }
    try {
      if (versionOf) {
        const v0 =
          s.selected?.versions?.find((v) => v.version === "0")?.designHash ??
          s.selected?.designHash;
        await kit.pushVersionKit(
          versionOf,
          draft,
          uri,
          s.selected?.mode,
          s.selected?.version,
          v0,
          s.selected?.ownerTag,
        );
        router.push(`/${s.lang}/kit/${versionOf}`);
      } else {
        await kit.publishKit(draft, uri);
        router.push(`/${s.lang}`);
      }
    } catch {}
  };

  const anonMode =
    (versionOf ? s.selected?.mode : draft?.mode) === "anonymous" &&
    anonReady();
  const blocked =
    (anonMode || (conn.isConnected && !conn.wrongNetwork)) &&
    (!uri.trim() || kit.isPending);

  if (versionOf && s.selected?.id !== versionOf) {
    return (
      <Caja className="flex-col flex-1 items-center justify-center p-4">
        <span className="relative flex text-xs text-gray-400">
          {s.dict.createKit.loadingCurrentContent}
        </span>
      </Caja>
    );
  }

  return (
    <Caja className="flex-col flex-1 p-2">
      <div
        className={
          step === "form" ? "relative flex flex-col flex-1" : "hidden"
        }
      >
        <CreateKit
          onCreate={(d) => {
            setDraft(d);
            setCopied(false);
            setStep("json");
          }}
          parents={parents}
          labels={s.labels}
          rungs={s.rungs}
          initial={initial}
        />
      </div>

      {step === "json" && (
        <div className="relative flex flex-col gap-3 p-4 text-white">
          <span className="relative flex text-sm">{s.dict.createKit.packageContent}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createKit.jsonHint}
          </span>
          <textarea
            readOnly
            value={json}
            rows={10}
            className={`relative flex w-full ${fieldBg} px-2 py-1 text-[10px] text-white focus:outline-none resize-none`}
          />
          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button onClick={copy} className={cajaBtn}>
              {copied ? s.dict.common.copied : s.dict.common.copy}
            </button>
            <button onClick={() => setStep("uri")} className={cajaBtn}>
              {s.dict.createKit.setUri}
            </button>
            <button onClick={() => setStep("form")} className={ghostBtn}>
              {s.dict.common.back}
            </button>
          </div>
        </div>
      )}

      {step === "uri" && (
        <div className="relative flex flex-col gap-3 p-4 text-white">
          <span className="relative flex text-sm">{s.dict.createKit.contentUri}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createKit.uriHint}
          </span>
          <input
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder={s.dict.createKit.uriPlaceholder}
            className={`relative flex w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`}
          />
          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button
              onClick={
                anonMode
                  ? publish
                  : !conn.isConnected
                  ? conn.connect
                  : conn.wrongNetwork
                  ? conn.switchNetwork
                  : publish
              }
              disabled={blocked}
              className={`${cajaBtn} ${blocked ? "opacity-40" : ""}`}
            >
              {anonMode
                ? kit.isPending
                  ? s.dict.createKit.creating
                  : versionOf
                  ? s.dict.createKit.publishVersion
                  : s.dict.createKit.createKitCta
                : !conn.isConnected
                ? s.dict.connection.connectWallet
                : conn.wrongNetwork
                ? s.dict.connection.switchChain
                : kit.isPending
                ? s.dict.createKit.creating
                : versionOf
                ? s.dict.createKit.publishVersion
                : s.dict.createKit.createKitCta}
            </button>
            <button onClick={() => setStep("json")} className={ghostBtn}>
              {s.dict.common.back}
            </button>
          </div>
        </div>
      )}
    </Caja>
  );
};

export default CreateCenter;
