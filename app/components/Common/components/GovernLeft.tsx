"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { contractConfig } from "@/app/lib/contracts";

const tag = "relative flex text-[10px] text-gray-400";
const body = "relative flex text-xs leading-relaxed";

const GovernLeft: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const council = contractConfig("dxCouncil");
  const { data: quorumRaw } = useReadContract({
    address: council.address,
    abi: council.abi,
    functionName: "quorum",
    query: { enabled: council.ready },
  });
  const { data: windowRaw } = useReadContract({
    address: council.address,
    abi: council.abi,
    functionName: "votingWindow",
    query: { enabled: council.ready },
  });
  const quorum = typeof quorumRaw === "bigint" ? quorumRaw.toString() : "—";
  const windowMin =
    typeof windowRaw === "bigint"
      ? `${Math.round(Number(windowRaw) / 60)} min`
      : "—";

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={`/${s.lang}/govern/create`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.dict.govern.createProposal}
        </Link>
      </Caja>

      <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-3 p-3">
        <span className="relative flex text-sm">{s.dict.govern.govern}</span>
        <span className={body}>
          {s.dict.govern.governIntro}
        </span>
        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.govern.whatGetsProposed}</span>
          <span className={`${body} whitespace-pre-line`}>
            {s.dict.govern.whatGetsProposedBody}
          </span>
        </div>
        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.govern.theCycle}</span>
          <span className={body}>
            {s.dict.govern.theCycleBody}
          </span>
        </div>
        <div className="relative flex flex-col gap-1">
          <span className="relative flex text-xs">
            {s.dict.govern.currentQuorum}: {quorum}
          </span>
          <span className="relative flex text-xs">
            {s.dict.govern.votingTime}: {windowMin}
          </span>
        </div>
      </Caja>

      <div className="relative flex shrink-0 flex-row flex-wrap content-start gap-2 p-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="relative flex w-6 h-6 shrink-0"
            style={{
              backgroundImage: `url('/images/esmeralda-${11 + (i % 6)}.png')`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        ))}
      </div>

      <div
        className="relative flex w-full h-24 shrink-0 bg-no-repeat bg-center bg-contain"
        style={{ backgroundImage: "url('/images/sprite.png')" }}
      />
    </>
  );
};

export default GovernLeft;
