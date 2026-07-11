"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import ProposalDetailLeft from "./ProposalDetailLeft";
import ProposalDetailCenter from "./ProposalDetailCenter";
import { ProposalScreenProps } from "../types/common.types";

const ProposalScreen: FunctionComponent<ProposalScreenProps> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<ProposalDetailLeft id={id} />}>
      <ProposalDetailCenter id={id} />
    </Shell>
  );
};

export default ProposalScreen;
