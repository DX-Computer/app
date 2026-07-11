"use client";

import { FunctionComponent, JSX } from "react";
import Shell from "./Shell";
import TreelinerLeft from "./TreelinerLeft";
import GrantsCenter from "./GrantsCenter";
import useTreeliner from "../hooks/useTreeliner";
import { TreelinerScreenProps } from "../types/common.types";

const TreelinerScreen: FunctionComponent<TreelinerScreenProps> = ({
  dict,
  address,
}): JSX.Element => {
  const { stats, grants } = useTreeliner(address);

  return (
    <Shell dict={dict} left={<TreelinerLeft stats={stats} />}>
      <GrantsCenter grants={grants} />
    </Shell>
  );
};

export default TreelinerScreen;
