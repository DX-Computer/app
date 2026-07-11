"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CreateProposalLeft from "./CreateProposalLeft";
import CreateProposalCenter from "./CreateProposalCenter";
import { GovernScreenProps } from "../types/common.types";

const CreateProposalScreen: FunctionComponent<GovernScreenProps> = ({
  dict,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<CreateProposalLeft />}>
      <CreateProposalCenter />
    </Shell>
  );
};

export default CreateProposalScreen;
