"use client";

import { CSSProperties, Fragment, FunctionComponent, JSX } from "react";
import { BandaProps } from "../types/common.types";

const fill = (img?: string): CSSProperties =>
  img
    ? {
        backgroundImage: `url('/images/${img}.png')`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }
    : { backgroundColor: "rgba(255,255,255,0.10)" };

const tileFill = (img?: string): CSSProperties =>
  img
    ? {
        backgroundImage: `url('/images/${img}.png')`,
        backgroundRepeat: "repeat",
        backgroundSize: "32px",
      }
    : { backgroundColor: "rgba(255,255,255,0.10)" };

const Banda: FunctionComponent<BandaProps> = ({
  brick,
  mosaic,
  button,
  height = 14,
  rail = 3,
  segments = 3,
  vertical = false,
}): JSX.Element => {
  const t = height;
  const bandStyle: CSSProperties = vertical
    ? { width: `${t}px`, ...tileFill(brick) }
    : { height: `${t}px`, ...tileFill(brick) };
  const mosaicInset: CSSProperties = vertical
    ? { paddingLeft: `${rail}px`, paddingRight: `${rail}px` }
    : { paddingTop: `${rail}px`, paddingBottom: `${rail}px` };
  const buttonStyle: CSSProperties = vertical
    ? { height: `${t}px`, ...fill(button) }
    : { width: `${t}px`, ...fill(button) };

  return (
    <div
      className={`relative flex items-stretch overflow-hidden ${
        vertical ? "flex-col" : "flex-row flex-1"
      }`}
      style={bandStyle}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <Fragment key={i}>
          <div className="relative flex flex-1" style={mosaicInset}>
            <div className="relative flex flex-1" style={fill(mosaic)} />
          </div>
          {i < segments - 1 && (
            <div
              className="relative flex shrink-0 items-center justify-center"
              style={buttonStyle}
            ></div>
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default Banda;
