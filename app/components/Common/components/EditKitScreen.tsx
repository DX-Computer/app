"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import KitsLeft from "./KitsLeft";
import CreateCenter from "./CreateCenter";

const EditKitScreen: FunctionComponent<{ dict: any; id: string }> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<KitsLeft />}>
      <CreateCenter versionOf={id} />
    </Shell>
  );
};

export default EditKitScreen;
