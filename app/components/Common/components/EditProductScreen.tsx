"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import CreateProductLeft from "./CreateProductLeft";
import CreateProductCenter from "./CreateProductCenter";

const EditProductScreen: FunctionComponent<{ dict: any; id: string }> = ({
  dict,
  id,
}): JSX.Element => {
  return (
    <Shell dict={dict} left={<CreateProductLeft />}>
      <CreateProductCenter editOf={id} />
    </Shell>
  );
};

export default EditProductScreen;
