"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CreateAgentLeft from "./CreateAgentLeft";
import CreateAgentCenter from "./CreateAgentCenter";

const CreateAgentScreen: FunctionComponent<{ dict: any }> = ({
  dict,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<CreateAgentLeft />}>
      <CreateAgentCenter />
    </Shell>
  );
};

export default CreateAgentScreen;
