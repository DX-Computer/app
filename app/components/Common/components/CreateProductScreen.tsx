"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CreateProductLeft from "./CreateProductLeft";
import CreateProductCenter from "./CreateProductCenter";

const CreateProductScreen: FunctionComponent<{ dict: any }> = ({
  dict,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<CreateProductLeft />}>
      <CreateProductCenter />
    </Shell>
  );
};

export default CreateProductScreen;
