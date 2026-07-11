"use client";

import { FunctionComponent, JSX, useState } from "react";
import Shell from "./Shell";
import DashboardLeft from "./DashboardLeft";
import DashboardCenter from "./DashboardCenter";
import { DashboardTheme } from "../types/common.types";

const DashboardScreen: FunctionComponent<{ dict: any }> = ({
  dict,
}): JSX.Element => {
  const [theme, setTheme] = useState<DashboardTheme>("launches");
  return (
    <Shell dict={dict} left={<DashboardLeft theme={theme} setTheme={setTheme} />}>
      <DashboardCenter theme={theme} />
    </Shell>
  );
};

export default DashboardScreen;
