import { useEffect, useRef, useState } from "react";
import { useBlock } from "wagmi";
import { ACTIVE_CHAIN } from "@/app/lib/constants";

// A live, monotonic clock anchored to the chain's block timestamp but ticking
// forward with wall-clock. On a real network each new block re-anchors it (so
// it stays exact); on a local test node whose timestamp freezes between blocks
// it keeps counting in real time instead of appearing stuck. It never jumps
// backward when a stale/low block timestamp arrives.
export const useChainClock = (): number => {
  const { data: block } = useBlock({ watch: true, chainId: ACTIVE_CHAIN.id });
  const anchor = useRef<{ chain: number; wall: number } | null>(null);
  const [nowSec, setNowSec] = useState<number>(() =>
    Math.floor(Date.now() / 1000),
  );

  useEffect(() => {
    if (!block) return;
    const chain = Number(block.timestamp);
    const wall = Date.now() / 1000;
    const estimate = anchor.current
      ? anchor.current.chain + (wall - anchor.current.wall)
      : -Infinity;
    if (chain >= estimate) {
      anchor.current = { chain, wall };
    }
  }, [block?.timestamp]);

  useEffect(() => {
    const compute = (): number => {
      const a = anchor.current;
      return a
        ? Math.floor(a.chain + (Date.now() / 1000 - a.wall))
        : Math.floor(Date.now() / 1000);
    };
    setNowSec(compute());
    const iv = setInterval(() => setNowSec(compute()), 1000);
    return () => clearInterval(iv);
  }, []);

  return nowSec;
};

export default useChainClock;
