"use client";

import { FunctionComponent, JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { parseUnits } from "viem";
import { useShell } from "./Shell";
import { ProductDraft } from "../types/common.types";
import useMarket from "../hooks/useMarket";
import useOffer from "../hooks/useOffer";
import CreateProduct from "./CreateProduct";
import Caja from "./Caja";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const cajaBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm cursor-blacksmithHS";
const ghostBtn = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;

const CreateProductCenter: FunctionComponent<{ editOf?: string }> = ({
  editOf,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const market = useMarket();
  const { offer } = useOffer(editOf ?? "");
  const router = useRouter();

  const [step, setStep] = useState<"form" | "json" | "uri">("form");
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [uri, setUri] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const json = draft
    ? JSON.stringify(
        {
          title: draft.title,
          description: draft.description,
          image: draft.image,
          gallery: draft.gallery,
          video: draft.video,
          audio: draft.audio,
          options: draft.options,
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
        await market.updateOffer(
          BigInt(editOf),
          draft.price ? parseUnits(draft.price, 18) : 0n,
          draft.sliceBps,
          /^\d+$/.test(draft.quantity) ? BigInt(draft.quantity) : 0n,
          uri,
          draft.confirmDays,
          draft.cyberBps,
        );
        router.push(`/${s.lang}/market/${editOf}`);
      } else {
        await market.publishOffer(draft, uri);
        router.push(`/${s.lang}/market`);
      }
    } catch {}
  };

  const blocked =
    conn.isConnected && !conn.wrongNetwork && (!uri.trim() || market.isPending);

  if (editOf && !offer) {
    return (
      <Caja className="flex-col flex-1 items-center justify-center p-4">
        <span className="relative flex text-xs text-gray-400">
          {s.dict.createKit.loadingCurrentContent}
        </span>
      </Caja>
    );
  }

  const initial: Partial<ProductDraft> | undefined =
    editOf && offer
      ? {
          kit: offer.kitId,
          version: offer.version,
          designHash: offer.designHash,
          title: offer.title,
          description: offer.description,
          image: offer.image,
          gallery: offer.gallery,
          video: offer.video,
          audio: offer.audio,
          options: offer.options,
          price: String(offer.price),
          sliceBps: offer.sliceBps,
          cyberBps: offer.cyberSwagBps,
          confirmDays: String(
            Math.max(1, Math.round(Number(offer.confirmWindow || "86400") / 86400)),
          ),
          quantity: String(offer.quantity),
        }
      : undefined;

  return (
    <Caja className="flex-col flex-1 p-2">
      {editOf && (
        <button
          onClick={() => router.push(`/${s.lang}/market/${editOf}`)}
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
        <CreateProduct
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
          <span className="relative flex text-sm">{s.dict.createProduct.packageContent}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createProduct.jsonHint}
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
              {s.dict.createProduct.setUri}
            </button>
            <button onClick={() => setStep("form")} className={ghostBtn}>
              {s.dict.common.back}
            </button>
          </div>
        </div>
      )}

      {step === "uri" && (
        <div className="relative flex flex-col gap-3 p-4 text-white">
          <span className="relative flex text-sm">{s.dict.createProduct.uriHeading}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createProduct.uriHint}
          </span>
          <input
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder={s.dict.createProduct.uriPlaceholder}
            className={`relative flex w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`}
          />
          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button
              onClick={
                !conn.isConnected
                  ? conn.connect
                  : conn.wrongNetwork
                  ? conn.switchNetwork
                  : publish
              }
              disabled={blocked}
              className={`${cajaBtn} ${blocked ? "opacity-40" : ""}`}
            >
              {!conn.isConnected
                ? s.dict.connection.connectWallet
                : conn.wrongNetwork
                ? s.dict.connection.switchChain
                : market.isPending
                ? s.dict.createProduct.creating
                : editOf
                ? s.dict.product.save
                : s.dict.createProduct.createCta}
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

export default CreateProductCenter;
