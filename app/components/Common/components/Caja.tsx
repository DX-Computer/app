"use client";

import { CSSProperties, FunctionComponent, JSX } from "react";
import { CajaProps } from "../types/common.types";

const Caja: FunctionComponent<CajaProps> = ({
  children,
  className,
  border,
  borderWidth = 18,
  slice = 26,
  bg = "fondocaja",
  type = "cover"
}): JSX.Element => {
  const style: CSSProperties = {
    backgroundImage: `url('/images/${bg}.png')`,
    backgroundSize: type === "stretch" ? "100% 100%" : type,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
  if (border) {
    style.borderStyle = "solid";
    style.borderWidth = `${borderWidth}px`;
    style.borderImageSource = `url('/images/${border}.png')`;
    style.borderImageSlice = `${slice}`;
    style.borderImageRepeat = "stretch";
  }
  return (
    <div className={`relative flex ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
};

export default Caja;
