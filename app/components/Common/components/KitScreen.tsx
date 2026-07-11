"use client";

import { FunctionComponent, JSX } from "react";
import { KitScreenProps } from "../types/common.types";
import Shell, { useShell } from "./Shell";
import KitsLeft from "./KitsLeft";
import KitsCenter from "./KitsCenter";
import KitCenter from "./KitCenter";

const Center: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  return s.isKit ? <KitCenter /> : <KitsCenter />;
};

const KitScreen: FunctionComponent<KitScreenProps> = ({
  dict,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<KitsLeft />}>
      <Center />
    </Shell>
  );
};

export default KitScreen;
