"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";

const tag = "relative flex text-[10px] text-gray-400";

const ProposalDetailLeft: FunctionComponent<{ id: string }> = ({
  id,
}): JSX.Element => {
  const s = useShell();

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={`/${s.lang}/govern`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.dict.proposal.govern}
        </Link>
      </Caja>

      <Caja className="flex-col flex-1 md:min-h-0 md:overflow-y-auto gap-3 p-3">
        <span className="relative flex text-sm">{s.dict.proposal.leftTitle}</span>
        <div className="relative flex flex-col gap-1">
          <span className={tag}>{s.dict.proposal.id}</span>
          <span className="relative flex text-xs">#{id}</span>
        </div>
        <span className="relative flex text-xs text-gray-300 leading-relaxed">
          {s.dict.proposal.leftBody}
        </span>
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

export default ProposalDetailLeft;
