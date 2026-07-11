"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CreateGrantLeft from "./CreateGrantLeft";
import CreateGrantCenter from "./CreateGrantCenter";

const EditGrantScreen: FunctionComponent<{ dict: any; id: string }> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<CreateGrantLeft />}>
      <CreateGrantCenter editOf={id} />
    </Shell>
  );
};

export default EditGrantScreen;
