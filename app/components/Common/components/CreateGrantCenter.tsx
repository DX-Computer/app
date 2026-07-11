"use client";

import { FunctionComponent, JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { useShell } from "./Shell";
import { GrantDraft } from "../types/common.types";
import useGrants from "../hooks/useGrants";
import useGrant from "../hooks/useGrant";
import CreateGrant from "./CreateGrant";
import Caja from "./Caja";
import { anonReady } from "@/app/lib/zk/anonSigner";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const cajaBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm cursor-blacksmithHS";
const ghostBtn = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;

const CreateGrantCenter: FunctionComponent<{ editOf?: string }> = ({
  editOf,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const grant = useGrants();
  const { grant: current } = useGrant(editOf ?? "");
  const router = useRouter();

  const [step, setStep] = useState<"form" | "json" | "uri">("form");
  const [draft, setDraft] = useState<GrantDraft | null>(null);
  const [uri, setUri] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const json = draft
    ? JSON.stringify(
        {
          title: draft.title,
          purpose: draft.purpose,
          image: draft.image,
          deliverables: draft.deliverables,
          milestones: draft.milestones,
          links: draft.links,
        },
        null,
        2,
      )
    : "";

  const copy = (): void => {
    navigator.clipboard.writeText(json);
    setCopied(true);
  };

  const publish = async (): Promise<void> => {
    if (!draft) return;
    try {
      if (editOf) {
        await grant.updateGrant(BigInt(editOf), draft, uri);
        router.push(`/${s.lang}/treeliner-grant/${editOf}`);
      } else {
        await grant.publishGrant(draft, uri);
        router.push(`/${s.lang}/treeliner-grants`);
      }
    } catch {}
  };

  const anonMode = draft?.mode === "anonymous" && anonReady();
  const blocked =
    (anonMode || (conn.isConnected && !conn.wrongNetwork)) &&
    (!uri.trim() || grant.isPending);

  if (editOf && !current) {
    return (
      <Caja className="flex-col flex-1 items-center justify-center p-4">
        <span className="relative flex text-xs text-gray-400">
          {s.dict.createKit.loadingCurrentContent}
        </span>
      </Caja>
    );
  }

  const initial: Partial<GrantDraft> | undefined =
    editOf && current
      ? {
          mode: "public",
          kit: current.kitId,
          title: current.title,
          purpose: current.purpose,
          image: current.image,
          budget: String(current.budget),
          deliverables: current.deliverables,
          milestones: current.milestones,
          links: current.links,
        }
      : undefined;

  return (
    <Caja className="flex-col flex-1 p-2">
      {editOf && (
        <button
          onClick={() => router.push(`/${s.lang}/treeliner-grant/${editOf}`)}
          className={`${ghostBtn} w-fit mb-2`}
        >
          {`← ${s.dict.common.back}`}
        </button>
      )}
      <div
        className={
          step === "form" ? "relative flex flex-col flex-1" : "hidden"
        }
      >
        <CreateGrant
          onCreate={(d) => {
            setDraft(d);
            setCopied(false);
            setStep("json");
          }}
          initial={initial}
          editMode={Boolean(editOf)}
        />
      </div>

      {step === "json" && (
        <div className="relative flex flex-col gap-3 p-4 text-white">
          <span className="relative flex text-sm">{s.dict.createGrant.packageContent}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createGrant.jsonHint}
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
              {s.dict.createGrant.setUri}
            </button>
            <button onClick={() => setStep("form")} className={ghostBtn}>
              {s.dict.common.back}
            </button>
          </div>
        </div>
      )}

      {step === "uri" && (
        <div className="relative flex flex-col gap-3 p-4 text-white">
          <span className="relative flex text-sm">{s.dict.createGrant.uriHeading}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createGrant.uriHint}
          </span>
          <input
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder={s.dict.createGrant.uriPlaceholder}
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
                ? grant.isPending
                  ? s.dict.createGrant.creating
                  : editOf
                  ? s.dict.product.save
                  : s.dict.createGrant.createCta
                : !conn.isConnected
                ? s.dict.connection.connectWallet
                : conn.wrongNetwork
                ? s.dict.connection.switchChain
                : grant.isPending
                ? s.dict.createGrant.creating
                : editOf
                ? s.dict.product.save
                : s.dict.createGrant.createCta}
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

export default CreateGrantCenter;
