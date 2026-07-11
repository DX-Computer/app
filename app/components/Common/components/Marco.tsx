"use client";

import { CSSProperties, FunctionComponent, JSX } from "react";
import { MarcoProps } from "../types/common.types";
import Banda from "./Banda";

const fill = (img?: string): CSSProperties =>
  img
    ? {
        backgroundImage: `url('/images/${img}.png')`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }
    : { backgroundColor: "rgba(255,255,255,0.10)" };

const Marco: FunctionComponent<MarcoProps> = ({
  children,
  className,
  top = true,
  bottom = true,
  left = true,
  right = true,
  mosaic = "mosaico4",
  button = "button",
  brick = "borde1",
  ...parts
}): JSX.Element => {
  const t = parts.height ?? 14;
  const corner = (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: `${t}px`, height: `${t}px`, ...fill(button) }}
    ></div>
  );

  return (
    <div className={`relative flex flex-col md:min-h-0 ${className ?? ""}`}>
      {top && (
        <div className="relative flex flex-row items-stretch">
          {left && corner}
          <Banda brick={brick} button={button} mosaic={mosaic} {...parts} />
          {right && corner}
        </div>
      )}
      <div className="relative flex flex-row flex-1 items-stretch md:min-h-0">
        {left && <Banda brick={brick} button={button} mosaic={mosaic} {...parts} vertical />}
        <div className="relative flex flex-col flex-1 md:min-h-0 md:overflow-y-auto">
          {children}
        </div>
        {right && <Banda brick={brick} button={button} mosaic={mosaic} {...parts} vertical />}
      </div>
      {bottom && (
        <div className="relative flex flex-row items-stretch">
          {left && corner}
          <Banda brick={brick} button={button} mosaic={mosaic} {...parts} />
          {right && corner}
        </div>
      )}
    </div>
  );
};

export default Marco;
