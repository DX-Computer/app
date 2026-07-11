"use client";

import { FunctionComponent, JSX, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreateProductProps, KitVersionMeta } from "../types/common.types";
import useCreateProduct from "../hooks/useCreateProduct";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-sm text-white focus:outline-none`;
const tag = "relative flex text-xs text-gray-400";
const mini = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;
const chip = (active: boolean): string =>
  `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS ${
    active ? "" : "opacity-60"
  }`;

const CreateProduct: FunctionComponent<CreateProductProps> = ({
  onCreate,
  initial,
  editMode,
}): JSX.Element => {
  const f = useCreateProduct(onCreate, initial);
  const params = useSearchParams();
  const s = useShell();
  const kits = s.allItems;
  const [kitQuery, setKitQuery] = useState<string>("");

  const selectedKit = kits.find((k) => k.id === f.kit);
  const matches = kits
    .filter((k) =>
      `${k.id} ${k.title}`
        .toLowerCase()
        .includes(kitQuery.trim().toLowerCase()),
    )
    .slice(0, 6);

  const versions: KitVersionMeta[] =
    selectedKit?.versions && selectedKit.versions.length
      ? selectedKit.versions
      : selectedKit
      ? [
          {
            version: selectedKit.version || "0",
            designHash: selectedKit.designHash || "",
            contentUri: selectedKit.contentUri || "",
            createdAtBlock: "",
            createdAtTimestamp: "",
            transactionHash: "",
          },
        ]
      : [];

  useEffect(() => {
    const k = params.get("kit");
    if (k && k !== f.kit) f.setKit(k);
  }, [params]);

  useEffect(() => {
    if (f.kit && !f.version && versions.length) {
      f.setVersion(versions[0].version, versions[0].designHash);
    }
  }, [f.kit, versions.length]);

  return (
    <div className="relative w-full flex flex-col gap-3 p-4 text-white">
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.kitRequired}</span>
        {f.kit ? (
          <div className="relative flex flex-row gap-2 items-center">
            <span className="relative flex text-sm">
              {selectedKit
                ? fmt(s.dict.createProduct.kitSelected, { id: selectedKit.id, title: selectedKit.title })
                : fmt(s.dict.createProduct.kitFallback, { kit: f.kit })}
            </span>
            {!editMode && (
              <button
                onClick={() => {
                  f.setKit("");
                  f.setVersion("", "");
                  setKitQuery("");
                }}
                className={mini}
              >
                {s.dict.common.clear}
              </button>
            )}
          </div>
        ) : (
          <>
            <input
              value={kitQuery}
              onChange={(e) => setKitQuery(e.target.value)}
              placeholder={s.dict.createProduct.searchKitsPlaceholder}
              className={inp}
            />
            {kitQuery.trim() && (
              <div className={`relative flex flex-col ${fieldBg}`}>
                {matches.length ? (
                  matches.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => {
                        f.setKit(k.id);
                        setKitQuery("");
                      }}
                      className="relative flex text-left px-2 py-1 text-xs cursor-blacksmithHS"
                    >
                      {fmt(s.dict.createProduct.kitOption, { id: k.id, title: k.title })}
                    </button>
                  ))
                ) : (
                  <span className="relative flex px-2 py-1 text-xs text-gray-500">
                    {s.dict.createProduct.noMatches}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.versionRequired}</span>
        {editMode ? (
          <span className="relative flex text-sm">
            {fmt(s.dict.createProduct.versionChip, { version: f.version })}
          </span>
        ) : f.kit ? (
          versions.length ? (
            <div className="relative flex flex-row flex-wrap gap-1">
              {versions.map((v) => (
                <button
                  key={v.version}
                  onClick={() => f.setVersion(v.version, v.designHash)}
                  className={chip(f.version === v.version)}
                >
                  {fmt(s.dict.createProduct.versionChip, { version: v.version })}
                </button>
              ))}
            </div>
          ) : (
            <span className="relative flex text-xs text-gray-500">
              {s.dict.createProduct.noVersionsForKit}
            </span>
          )
        ) : (
          <span className="relative flex text-xs text-gray-500">
            {s.dict.createProduct.selectKitFirst}
          </span>
        )}
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.titleRequired}</span>
        <input
          value={f.title}
          onChange={(e) => f.setTitle(e.target.value)}
          className={inp}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.descriptionRequired}</span>
        <textarea
          value={f.description}
          onChange={(e) => f.setDescription(e.target.value)}
          rows={3}
          className={`${inp} resize-none`}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.imageUriRequired}</span>
        <input
          value={f.image}
          onChange={(e) => f.setImage(e.target.value)}
          placeholder={s.dict.createProduct.imageUriPlaceholder}
          className={inp}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.galleryOptional}</span>
        <div className="relative flex flex-row gap-2 items-center">
          <input
            value={f.galleryInput}
            onChange={(e) => f.setGalleryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                f.addGalleryImage();
              }
            }}
            placeholder={s.dict.createProduct.galleryImagePlaceholder}
            className={`${inp} flex-1`}
          />
          <button onClick={f.addGalleryImage} className={mini}>
            {s.dict.common.add}
          </button>
        </div>
        {f.gallery.length > 0 && (
          <div className="relative flex flex-col gap-1">
            {f.gallery.map((g, i) => (
              <div
                key={i}
                className={`relative flex flex-row items-center gap-2 ${fieldBg} px-2 py-1`}
              >
                <span className="relative flex flex-1 text-[10px] text-gray-300 break-all">
                  {g}
                </span>
                <button
                  onClick={() => f.removeGalleryImage(i)}
                  aria-label={s.dict.common.remove}
                  className="relative flex text-[10px] text-gray-400 cursor-blacksmithHS"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.optionsOptional}</span>
        <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
          {s.dict.createProduct.optionsHint}
        </span>
        {f.options.length > 0 && (
          <div className="relative flex flex-col gap-1">
            {f.options.map((o, i) => (
              <div
                key={i}
                className={`relative flex flex-row items-center gap-2 ${fieldBg} px-2 py-1`}
              >
                <span className="relative flex flex-1 text-[10px] text-gray-300">
                  <span className="text-white">{o.label}</span>: {o.choices.join(" · ")}
                </span>
                <button
                  onClick={() => f.removeOption(i)}
                  aria-label={s.dict.common.remove}
                  className="relative flex text-[10px] text-gray-400 cursor-blacksmithHS"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative flex flex-row gap-2 items-center flex-wrap">
          <input
            value={f.optionLabel}
            onChange={(e) => f.setOptionLabel(e.target.value)}
            placeholder={s.dict.createProduct.optionLabelPlaceholder}
            className={`${inp} flex-1`}
          />
          <input
            value={f.optionChoices}
            onChange={(e) => f.setOptionChoices(e.target.value)}
            placeholder={s.dict.createProduct.optionChoicesPlaceholder}
            className={`${inp} flex-1`}
          />
          <button onClick={f.addOption} className={mini}>
            {s.dict.common.add}
          </button>
        </div>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.videoOptional}</span>
        <input
          value={f.video}
          onChange={(e) => f.setVideo(e.target.value)}
          placeholder={s.dict.createProduct.videoPlaceholder}
          className={inp}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.audioOptional}</span>
        <input
          value={f.audio}
          onChange={(e) => f.setAudio(e.target.value)}
          placeholder={s.dict.createProduct.audioPlaceholder}
          className={inp}
        />
      </div>

      <div className="relative flex flex-row gap-2">
        <div className="relative flex flex-col flex-1 gap-1">
          <span className={tag}>{s.dict.createProduct.priceRequired}</span>
          <input
            value={f.price}
            onChange={(e) => f.setPrice(e.target.value)}
            placeholder={s.dict.createProduct.pricePlaceholder}
            className={inp}
          />
        </div>
        <div className="relative flex flex-col flex-1 gap-1">
          <span className={tag}>{s.dict.createProduct.quantityRequired}</span>
          <input
            value={f.quantity}
            onChange={(e) => f.setQuantity(e.target.value)}
            placeholder={s.dict.createProduct.quantityPlaceholder}
            className={inp}
          />
        </div>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.sponsorSliceRequired}</span>
        <input
          value={f.share}
          onChange={(e) => f.setShare(e.target.value)}
          placeholder={s.dict.createProduct.sponsorSlicePlaceholder}
          className={inp}
        />
        <span className="relative flex text-[10px] text-gray-500">
          {s.dict.createProduct.sponsorSliceHint}
        </span>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.cyberSliceLabel}</span>
        <input
          value={f.cyberShare}
          onChange={(e) => f.setCyberShare(e.target.value)}
          placeholder={s.dict.createProduct.cyberSlicePlaceholder}
          className={inp}
        />
        <span className="relative flex text-[10px] text-gray-500">
          {s.dict.createProduct.cyberSliceHint}
        </span>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createProduct.confirmWindowRequired}</span>
        <input
          value={f.confirmDays}
          onChange={(e) => f.setConfirmDays(e.target.value)}
          placeholder={s.dict.createProduct.confirmWindowPlaceholder}
          className={inp}
        />
        <span className="relative flex text-[10px] text-gray-500">
          {s.dict.createProduct.confirmWindowHint}
        </span>
      </div>

      {!editMode && (
        <span className="relative flex text-xs text-gray-400 leading-relaxed">
          {s.dict.createProduct.shippingKeyAuto}
        </span>
      )}

      <div className="relative flex flex-row gap-2 items-center">
        <span className={tag}>{s.dict.common.license}</span>
        <span className="relative flex text-xs">{s.dict.common.cc0}</span>
      </div>

      <div className="relative flex flex-row gap-2 items-center flex-wrap">
        <button
          onClick={f.build}
          disabled={!f.canSubmit}
          className={`relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm ${
            f.canSubmit ? "" : "opacity-40 text-gray-400"
          }`}
        >
          {s.dict.createProduct.packageContent}
        </button>
        <button onClick={f.reset} className={mini}>
          {s.dict.common.clear}
        </button>
      </div>
    </div>
  );
};

export default CreateProduct;
