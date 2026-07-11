"use client";

import { FunctionComponent, JSX, useState } from "react";
import Shell from "./Shell";
import AgentsLeft from "./AgentsLeft";
import AgentsCenter from "./AgentsCenter";
import useAgentsBrowse from "../hooks/useAgentsBrowse";
import { AgentFilters, AgentsScreenProps } from "../types/common.types";

const AgentsScreen: FunctionComponent<AgentsScreenProps> = ({
  dict,
}): JSX.Element => {
  const { agents } = useAgentsBrowse();
  const [filters, setFilters] = useState<AgentFilters>({
    text: "",
    cyberswagman: "",
    kit: "",
    tags: [],
  });

  const filtered = agents.filter((a) => {
    const t = filters.text.trim().toLowerCase();
    const textOk =
      t === "" ||
      `${a.name} ${a.description} ${a.tags.join(" ")}`
        .toLowerCase()
        .includes(t);
    const swagOk =
      filters.cyberswagman.trim() === "" ||
      a.owner.toLowerCase().includes(filters.cyberswagman.trim().toLowerCase());
    const kit = filters.kit.trim();
    const kitOk = kit === "" || a.kits.includes(kit);
    const lower = a.tags.map((x) => x.toLowerCase());
    const tagsOk = filters.tags.every((ft) =>
      lower.some((x) => x.includes(ft.toLowerCase())),
    );
    return textOk && swagOk && kitOk && tagsOk;
  });

  return (
    <Shell
      dict={dict}
      left={
        <AgentsLeft
          filters={filters}
          setFilters={setFilters}
          count={filtered.length}
          total={agents.length}
        />
      }
    >
      <AgentsCenter agents={filtered} />
    </Shell>
  );
};

export default AgentsScreen;
