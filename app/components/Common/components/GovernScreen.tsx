"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import GovernLeft from "./GovernLeft";
import ProposalsCenter from "./ProposalsCenter";
import useProposalsBrowse from "../hooks/useProposalsBrowse";
import { GovernScreenProps } from "../types/common.types";

const GovernScreen: FunctionComponent<GovernScreenProps> = ({
  dict,
}): JSX.Element => {
  const { proposals } = useProposalsBrowse();

  return (
    <Shell dict={dict} left={<GovernLeft />}>
      <ProposalsCenter proposals={proposals} />
    </Shell>
  );
};

export default GovernScreen;
