import { useMemo } from "react";
import {
  useAccount,
  useBalance,
  useDisconnect,
  useReadContract,
  useSwitchChain,
} from "wagmi";
import { useModal } from "connectkit";
import { formatUnits } from "viem";
import { ACTIVE_CHAIN, ERC20_ABI, MONA_ADDRESS } from "@/app/lib/constants";
import { ConnectionState } from "../types/common.types";

const useConnection = (): ConnectionState => {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { setOpen } = useModal();

  const expectedId = ACTIVE_CHAIN.id;
  const wrongNetwork = Boolean(isConnected && chainId && chainId !== expectedId);

  const { data: native } = useBalance({ address });

  const { data: monaRaw } = useReadContract({
    address: MONA_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && MONA_ADDRESS) },
  });

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  const nativeText = native
    ? `${Number(formatUnits(native.value, native.decimals)).toFixed(3)} ${native.symbol}`
    : "—";
  const monaText =
    typeof monaRaw === "bigint"
      ? Number(formatUnits(monaRaw, 18)).toFixed(2)
      : "0";

  return useMemo(
    () => ({
      address,
      isConnected: Boolean(isConnected),
      short,
      network: ACTIVE_CHAIN.name,
      wrongNetwork,
      nativeText,
      monaText,
      connect: () => setOpen(true),
      disconnect: () => disconnect(),
      switchNetwork: () => switchChain({ chainId: expectedId }),
    }),
    [address, isConnected, chainId, native, monaRaw, wrongNetwork]
  );
};

export default useConnection;
