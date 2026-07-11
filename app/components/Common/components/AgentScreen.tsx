"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import AgentDetailLeft from "./AgentDetailLeft";
import AgentDetailCenter from "./AgentDetailCenter";

const AgentScreen: FunctionComponent<{ dict: any; id: string }> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<AgentDetailLeft id={id} />}>
      <AgentDetailCenter id={id} />
    </Shell>
  );
};

export default AgentScreen;
