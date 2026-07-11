"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CreateAgentLeft from "./CreateAgentLeft";
import CreateAgentCenter from "./CreateAgentCenter";

const EditAgentScreen: FunctionComponent<{ dict: any; id: string }> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<CreateAgentLeft />}>
      <CreateAgentCenter editOf={id} />
    </Shell>
  );
};

export default EditAgentScreen;
