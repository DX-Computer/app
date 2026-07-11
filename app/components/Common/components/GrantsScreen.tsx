"use client";

import { FunctionComponent, JSX, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "./Shell";
import GrantsLeft from "./GrantsLeft";
import GrantsCenter from "./GrantsCenter";
import useGrantsBrowse from "../hooks/useGrantsBrowse";
import { GrantFilters, GrantsScreenProps } from "../types/common.types";

const GrantsScreen: FunctionComponent<GrantsScreenProps> = ({
  dict,
}): JSX.Element => {
  const { grants } = useGrantsBrowse();
  const params = useSearchParams();
  const [filters, setFilters] = useState<GrantFilters>({
    text: "",
    kit: "",
    status: "all",
    funders: "all",
  });

  useEffect(() => {
    const kit = params.get("kit");
    if (kit) {
      setFilters((f) => (f.kit === kit ? f : { ...f, kit }));
    }
  }, [params]);

  const filtered = grants.filter((g) => {
    const t = filters.text.trim().toLowerCase();
    const textOk =
      t === "" || `${g.title} ${g.purpose}`.toLowerCase().includes(t);
    const kitOk = filters.kit.trim() === "" || g.kitId === filters.kit.trim();
    const funded = g.raised >= g.budget && g.budget > 0;
    const statusOk =
      filters.status === "all" ||
      (filters.status === "funded" ? funded : !funded);
    const fundersOk =
      filters.funders === "all" ||
      (filters.funders === "funded" ? g.funders > 0 : g.funders === 0);
    return textOk && kitOk && statusOk && fundersOk;
  });

  return (
    <Shell
      dict={dict}
      left={
        <GrantsLeft
          filters={filters}
          setFilters={setFilters}
          count={filtered.length}
          total={grants.length}
        />
      }
    >
      <GrantsCenter grants={filtered} />
    </Shell>
  );
};

export default GrantsScreen;
