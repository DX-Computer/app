"use client";

import { FunctionComponent, JSX } from "react";
import KitScreen from "./KitScreen";

const Entry: FunctionComponent<{ dict: any }> = ({ dict }): JSX.Element => {
  return (
    <div className="relative w-full flex flex-col flex-1">
      <KitScreen dict={dict} />
    </div>
  );
};

export default Entry;
