"use client";
import {
  createContext,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { injected } from "@wagmi/connectors";
import { foundry, zksyncInMemoryNode } from "viem/chains";
import { ACTIVE_CHAIN, lensTestnet, LENS_TESTNET_RPC } from "./lib/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FullScreenVideo, TxStatus } from "./components/Common/types/common.types";
import { mainnet, PublicClient } from "@lens-protocol/client";
import Walkthrough from "./components/Common/components/Walkthrough";
import ConnectModal from "./components/Common/components/ConnectModal";
import RegisterBalanceModal from "./components/Common/components/RegisterBalanceModal";
import SponsorPoolModal from "./components/Common/components/SponsorPoolModal";
import DevWarningModal from "./components/Common/components/DevWarningModal";
import TxStatusModal from "./components/Common/components/TxStatusModal";

const queryClient = new QueryClient();

export const ModalContext = createContext<
  | {
      setFullScreenVideo: (e: SetStateAction<FullScreenVideo>) => void;
      fullScreenVideo: FullScreenVideo;
      rewind: RefObject<HTMLDivElement | null>;
      handleRewind: () => void;
      lensClient: PublicClient | undefined;
      walkthrough: boolean;
      setWalkthrough: (e: SetStateAction<boolean>) => void;
      connectOpen: boolean;
      setConnectOpen: (e: SetStateAction<boolean>) => void;
      balanceOpen: boolean;
      setBalanceOpen: (e: SetStateAction<boolean>) => void;
      sponsorOpen: boolean;
      setSponsorOpen: (e: SetStateAction<boolean>) => void;
      txStatus: TxStatus | null;
      setTxStatus: (e: SetStateAction<TxStatus | null>) => void;
    }
  | undefined
>(undefined);

const RPCS: Record<number, string> = {
  [foundry.id]: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  [zksyncInMemoryNode.id]:
    process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || "http://127.0.0.1:8011",
  [lensTestnet.id]: LENS_TESTNET_RPC,
};

export const config = createConfig({
  chains: [ACTIVE_CHAIN],
  transports: {
    [ACTIVE_CHAIN.id]: http(RPCS[ACTIVE_CHAIN.id]),
  } as never,
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  ssr: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const rewind = useRef<null | HTMLDivElement>(null);
  const handleRewind = (): void => {
    rewind.current?.scrollIntoView({ behavior: "smooth" });
  };
  const [lensClient, setLensClient] = useState<PublicClient | undefined>();
  const [fullScreenVideo, setFullScreenVideo] = useState<FullScreenVideo>({
    open: false,
    allVideos: [],
    index: 0,
    volume: 0.5,
  });
  const [walkthrough, setWalkthrough] = useState<boolean>(false);
  const [connectOpen, setConnectOpen] = useState<boolean>(false);
  const [balanceOpen, setBalanceOpen] = useState<boolean>(false);
  const [sponsorOpen, setSponsorOpen] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);


  useEffect(() => {
    if (!lensClient) {
      setLensClient(
        PublicClient.create({
          environment: mainnet,
          storage: window.localStorage,
        }),
      );
    }
  }, []);


  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          customTheme={{
            "--ck-font-family": '"HandJet"',
          }}
        >
          <ModalContext.Provider
            value={{
              rewind,
              lensClient,
              handleRewind,
              fullScreenVideo,
              setFullScreenVideo,
              walkthrough,
              setWalkthrough,
              connectOpen,
              setConnectOpen,
              balanceOpen,
              setBalanceOpen,
              sponsorOpen,
              setSponsorOpen,
              txStatus,
              setTxStatus,
            }}
          >
            <div
              className={`flex relative w-full h-full`}
            >
              {children}
              <Walkthrough
                open={walkthrough}
                onClose={() => setWalkthrough(false)}
              />
              <ConnectModal
                open={connectOpen}
                onClose={() => setConnectOpen(false)}
              />
              <RegisterBalanceModal
                open={balanceOpen}
                onClose={() => setBalanceOpen(false)}
              />
              <SponsorPoolModal
                open={sponsorOpen}
                onClose={() => setSponsorOpen(false)}
              />
              <DevWarningModal />
              <TxStatusModal
                status={txStatus}
                onClose={() => setTxStatus(null)}
              />
            </div>
          </ModalContext.Provider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
