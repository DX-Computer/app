"use client";

import { FunctionComponent, JSX } from "react";

const Frieze: FunctionComponent = (): JSX.Element => {
  return (
    <div className="relative w-full shrink-0">
      <div
        className="relative w-full flex h-7"
        style={{
          backgroundImage: "url('/images/mosaico.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "20% 100%",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-10 h-3 translate-y-1/2 pointer-events-none"
        style={{
          backgroundImage: "url('/images/borde.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
        }}
      />
    </div>
  );
};

export default Frieze;
