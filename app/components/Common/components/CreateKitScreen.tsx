"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import KitsLeft from "./KitsLeft";
import CreateCenter from "./CreateCenter";

const CreateKitScreen: FunctionComponent<{ dict: any }> = ({
  dict,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<KitsLeft />}>
      <CreateCenter />
    </Shell>
  );
};

export default CreateKitScreen;
