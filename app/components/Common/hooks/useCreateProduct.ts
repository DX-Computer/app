import { useState } from "react";
import resolveUri from "./resolveUri";
import {
  CreateProductState,
  ProductDraft,
  ProductOption,
} from "../types/common.types";

const useCreateProduct = (
  onCreate: (draft: ProductDraft) => void,
  initial?: Partial<ProductDraft>,
): CreateProductState => {
  const [kit, setKit] = useState<string>(initial?.kit ?? "");
  const [version, setVersionState] = useState<string>(initial?.version ?? "");
  const [designHash, setDesignHash] = useState<string>(initial?.designHash ?? "");
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [image, setImage] = useState<string>(initial?.image ?? "");
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [galleryInput, setGalleryInput] = useState<string>("");
  const [video, setVideo] = useState<string>(initial?.video ?? "");
  const [audio, setAudio] = useState<string>(initial?.audio ?? "");
  const [price, setPrice] = useState<string>(initial?.price ?? "");
  const [share, setShare] = useState<string>(
    initial?.sliceBps !== undefined ? String(initial.sliceBps / 100) : "",
  );
  const [cyberShare, setCyberShare] = useState<string>(
    initial?.cyberBps !== undefined ? String(initial.cyberBps / 100) : "",
  );
  const [confirmDays, setConfirmDays] = useState<string>(
    initial?.confirmDays ?? "",
  );
  const [quantity, setQuantity] = useState<string>(initial?.quantity ?? "");
  const [options, setOptions] = useState<ProductOption[]>(
    initial?.options ?? [],
  );
  const [optionLabel, setOptionLabel] = useState<string>("");
  const [optionChoices, setOptionChoices] = useState<string>("");

  const addOption = (): void => {
    const label = optionLabel.trim();
    const choices = optionChoices
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (!label || choices.length === 0) return;
    setOptions((o) => [...o, { label, choices }]);
    setOptionLabel("");
    setOptionChoices("");
  };
  const removeOption = (i: number): void =>
    setOptions((o) => o.filter((_, j) => j !== i));

  const setVersion = (v: string, dh: string): void => {
    setVersionState(v);
    setDesignHash(dh);
  };

  const addGalleryImage = (): void => {
    const v = galleryInput.trim();
    if (!v || resolveUri(v).kind === "invalid") return;
    setGallery((s) => [...s, v]);
    setGalleryInput("");
  };
  const removeGalleryImage = (i: number): void =>
    setGallery((s) => s.filter((_, j) => j !== i));

  const reset = (): void => {
    setKit("");
    setVersionState("");
    setDesignHash("");
    setTitle("");
    setDescription("");
    setImage("");
    setGallery([]);
    setGalleryInput("");
    setVideo("");
    setAudio("");
    setPrice("");
    setShare("");
    setCyberShare("");
    setConfirmDays("");
    setQuantity("");
    setOptions([]);
    setOptionLabel("");
    setOptionChoices("");
  };

  const build = (): void => {
    const draft: ProductDraft = {
      id: `product-${Date.now()}`,
      kit: kit.trim(),
      version: version.trim(),
      designHash: designHash.trim(),
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      gallery: galleryInput.trim() ? [...gallery, galleryInput.trim()] : gallery,
      video: video.trim(),
      audio: audio.trim(),
      price: price.trim(),
      sliceBps: Math.round(Number(share || "0") * 100),
      cyberBps: Math.round(Number(cyberShare || "0") * 100),
      confirmDays: confirmDays.trim(),
      quantity: quantity.trim(),
      options,
    };
    onCreate(draft);
  };

  const shareNum = Number(share);
  const shareOk =
    share.trim().length > 0 &&
    Number.isFinite(shareNum) &&
    shareNum >= 5 &&
    shareNum <= 70;

  const cyberNum = Number(cyberShare || "0");
  const cyberOk = Number.isFinite(cyberNum) && cyberNum >= 0 && cyberNum <= 30;

  const confirmNum = Number(confirmDays);
  const confirmOk =
    confirmDays.trim().length > 0 &&
    Number.isFinite(confirmNum) &&
    confirmNum >= 1 &&
    confirmNum <= 365;

  const canSubmit =
    kit.trim().length > 0 &&
    version.trim().length > 0 &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    image.trim().length > 0 &&
    price.trim().length > 0 &&
    shareOk &&
    cyberOk &&
    confirmOk &&
    quantity.trim().length > 0;

  return {
    kit,
    setKit,
    version,
    designHash,
    setVersion,
    title,
    setTitle,
    description,
    setDescription,
    image,
    setImage,
    gallery,
    galleryInput,
    setGalleryInput,
    addGalleryImage,
    removeGalleryImage,
    video,
    setVideo,
    audio,
    setAudio,
    price,
    setPrice,
    share,
    setShare,
    cyberShare,
    setCyberShare,
    confirmDays,
    setConfirmDays,
    quantity,
    setQuantity,
    options,
    optionLabel,
    optionChoices,
    setOptionLabel,
    setOptionChoices,
    addOption,
    removeOption,
    build,
    reset,
    canSubmit,
  };
};

export default useCreateProduct;
