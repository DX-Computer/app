"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CyberswagmanLeft from "./CyberswagmanLeft";
import AgentsCenter from "./AgentsCenter";
import useCyberswagman from "../hooks/useCyberswagman";
import { CyberswagmanScreenProps } from "../types/common.types";

const CyberswagmanScreen: FunctionComponent<CyberswagmanScreenProps> = ({
  dict,
  address,
}): JSX.Element => {
  const { stats, agents } = useCyberswagman(address);

  return (
    <Shell dict={dict} left={<CyberswagmanLeft stats={stats} />}>
      <AgentsCenter agents={agents} />
    </Shell>
  );
};

export default CyberswagmanScreen;
