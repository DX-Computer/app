"use client";

import { CSSProperties, FunctionComponent, JSX } from "react";

const BEAM = 30;
const CAP = 48;

const Beam: FunctionComponent = (): JSX.Element => {
  const capStyle: CSSProperties = { height: `${CAP}px` };
  return (
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-row items-center overflow-visible">
      <img
        src="/images/izquierda.png"
        alt=""
        draggable={false}
        className="relative flex w-auto shrink-0 select-none"
        style={capStyle}
      />
      <div
        className="relative flex flex-1"
        style={{
          height: `${BEAM}px`,
          backgroundImage: "url('/images/centro.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
        }}
      />
      <img
        src="/images/derecha.png"
        alt=""
        draggable={false}
        className="relative flex w-auto shrink-0 select-none"
        style={capStyle}
      />
    </div>
  );
};

export default Beam;
