"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CreateGrantLeft from "./CreateGrantLeft";
import CreateGrantCenter from "./CreateGrantCenter";

const CreateGrantScreen: FunctionComponent<{ dict: any }> = ({
  dict,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<CreateGrantLeft />}>
      <CreateGrantCenter />
    </Shell>
  );
};

export default CreateGrantScreen;
