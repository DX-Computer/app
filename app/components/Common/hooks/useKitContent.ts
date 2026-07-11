import { useQuery } from "@tanstack/react-query";
import { applyContent, fetchContent } from "./kitContent";
import { RoadmapPhase } from "../types/common.types";

const useKitContent = (
  base?: RoadmapPhase,
  version?: string,
): RoadmapPhase | undefined => {
  const vm = base?.versions?.find((v) => v.version === version);
  const needFetch = Boolean(
    base && vm && vm.contentUri && vm.version !== base.version,
  );
  const target = needFetch && vm ? vm.contentUri : "";

  const { data } = useQuery({
    queryKey: ["kit-version", base?.id, target],
    queryFn: () => fetchContent(target),
    enabled: needFetch,
  });

  if (!base) return undefined;
  if (!needFetch || !vm || !data) return base;

  return {
    ...applyContent(base, data),
    version: vm.version,
    contentUri: vm.contentUri,
    designHash: vm.designHash,
    createdAtBlock: vm.createdAtBlock,
    createdAtTimestamp: vm.createdAtTimestamp,
    transactionHash: vm.transactionHash,
  };
};

export default useKitContent;
