"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import GrantDetailLeft from "./GrantDetailLeft";
import GrantDetailCenter from "./GrantDetailCenter";

const GrantScreen: FunctionComponent<{ dict: any; id: string }> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<GrantDetailLeft id={id} />}>
      <GrantDetailCenter id={id} />
    </Shell>
  );
};

export default GrantScreen;
