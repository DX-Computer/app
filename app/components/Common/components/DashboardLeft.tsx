"use client";

import { FunctionComponent, JSX } from "react";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { DashboardTheme } from "../types/common.types";

const THEMES: DashboardTheme[] = [
  "launches",
  "comments",
  "purchases",
  "sales",
  "governance",
  "earnings",
];

const chip = (active: boolean): string =>
  `relative flex bg-[url(/images/bg.png)] bg-cover bg-center px-3 py-2 text-xs text-white cursor-blacksmithHS ${
    active ? "" : "opacity-50"
  }`;

const DashboardLeft: FunctionComponent<{
  theme: DashboardTheme;
  setTheme: (t: DashboardTheme) => void;
}> = ({ theme, setTheme }): JSX.Element => {
  const s = useShell();
  return (
    <Caja className="flex-col w-full gap-2 p-3">
      <span className="relative flex text-sm text-white">
        {s.dict.dashboard.title}
      </span>
      <div className="relative flex flex-col gap-1">
        {THEMES.map((t) => (
          <button key={t} onClick={() => setTheme(t)} className={chip(theme === t)}>
            {s.dict.dashboard[t]}
          </button>
        ))}
      </div>
    </Caja>
  );
};

export default DashboardLeft;
