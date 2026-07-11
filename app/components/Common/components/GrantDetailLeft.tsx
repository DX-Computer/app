"use client";

import { FunctionComponent, JSX } from "react";
import Link from "next/link";
import Caja from "./Caja";
import { useShell } from "./Shell";
import useGrant from "../hooks/useGrant";
import resolveUri from "../hooks/resolveUri";

const GrantDetailLeft: FunctionComponent<{ id: string }> = ({
  id,
}): JSX.Element => {
  const s = useShell();
  const { grant } = useGrant(id);
  const img = resolveUri(grant?.image);

  return (
    <>
      <Caja
        bg="cajatexto1"
        type="stretch"
        className="cursor-blacksmithHS shrink-0 flex-col items-center justify-center gap-1"
      >
        <Link
          href={`/${s.lang}/treeliner-grants`}
          className="relative flex flex-1 w-full cursor-blacksmithHS items-center justify-center text-xs p-3"
        >
          {s.dict.nav.treelinerGrants}
        </Link>
      </Caja>

      <Caja className="flex-col flex-1 md:min-h-0 p-2">
        <div className="relative flex flex-1 w-full overflow-hidden">
          <img
            src={img.embeddable ? img.url : "/images/fabrica.png"}
            onError={(e) => {
              e.currentTarget.src = "/images/fabrica.png";
            }}
            draggable={false}
            alt={grant?.title || "grant"}
            className="absolute inset-0 w-full h-full object-cover"
          />
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

export default GrantDetailLeft;
