import { IPFS_GATEWAY } from "@/app/lib/constants";
import { ResolvedUri } from "../types/common.types";

const resolveUri = (raw?: string): ResolvedUri => {
  const uri = (raw || "").trim();
  if (!uri) {
    return { kind: "invalid", url: "", embeddable: false };
  }
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice(7).replace(/^ipfs\//, "");
    return { kind: "ipfs", url: `${IPFS_GATEWAY}/ipfs/${cid}`, embeddable: true };
  }
  if (uri.startsWith("https://")) {
    return { kind: "https", url: uri, embeddable: true };
  }
  if (uri.startsWith("ar://")) {
    return {
      kind: "arweave",
      url: `https://arweave.net/${uri.slice(5)}`,
      embeddable: false,
    };
  }
  return { kind: "invalid", url: "", embeddable: false };
};

export default resolveUri;
