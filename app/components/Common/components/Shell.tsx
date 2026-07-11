"use client";

import {
  FunctionComponent,
  JSX,
  createContext,
  useContext,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  RoadmapPhase,
  ShellProps,
  ShellContextValue,
  Filters,
} from "../types/common.types";
import useKits from "../hooks/useKits";
import useKitContent from "../hooks/useKitContent";
import useConnection from "../hooks/useConnection";
import useConnect from "../hooks/useConnect";
import resolveUri from "../hooks/resolveUri";
import Frieze from "./Frieze";
import Caja from "./Caja";
import Beam from "./Beam";
import Marco from "./Marco";

const LOCALES = ["en", "es", "ar", "pt", "fr"];
const NAV = [
  "treeliner-grants",
  "cyberswagman-agents",
  "market",
  "govern",
  "dashboard",
];
const NAV_KEY: Record<string, string> = {
  "treeliner-grants": "treelinerGrants",
  "cyberswagman-agents": "cyberswagmanAgents",
  market: "market",
  govern: "govern",
  dashboard: "dashboard",
};
const stone = (i: number): number => ((i * 13 + 5) % 6) + 1;

const ShellContext = createContext<ShellContextValue | undefined>(undefined);

export const useShell = (): ShellContextValue => {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell must be used within Shell");
  }
  return ctx;
};

const Shell: FunctionComponent<ShellProps> = ({
  dict,
  left,
  children,
}): JSX.Element => {
  const roadmap = dict?.common?.roadmap ?? {};
  const labels = roadmap?.labels ?? {};
  const rungs: string[] = roadmap?.stage?.rungs ?? [];
  const ui = roadmap?.ui ?? {};

  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean);
  const lang = LOCALES.includes(seg[0]) ? seg[0] : "en";
  const router = useRouter();
  const isHome =
    seg.length === 0 || (seg.length === 1 && LOCALES.includes(seg[0]));
  const kitIdx = seg.indexOf("kit");
  const routeKitId = kitIdx >= 0 ? (seg[kitIdx + 1] ?? "") : "";
  const routeKitVersion = kitIdx >= 0 ? (seg[kitIdx + 2] ?? "") : "";
  const isKit = routeKitId !== "";

  const { kits } = useKits();
  const allItems: RoadmapPhase[] = kits;
  const conn = useConnection();
  const { openConnect } = useConnect();

  const [filters, setFilters] = useState<Filters>({
    text: "",
    tags: [],
    hardware: [],
    software: [],
    fabrication: [],
    stage: 0,
    mode: "all",
    fork: "all",
  });
  const [selectedId, setSelectedId] = useState<string>("");

  const hasAllTags = (filterVals: string[], itemVals: string[]): boolean =>
    filterVals.every((v) =>
      itemVals.some((iv) => iv.toLowerCase().includes(v.toLowerCase())),
    );

  const filtered = allItems.filter((p) => {
    const t = filters.text.trim().toLowerCase();
    const textOk =
      t === "" ||
      [p.title, p.desc, ...p.hardware, ...p.software, ...p.fabrication]
        .join(" ")
        .toLowerCase()
        .includes(t);
    const tagsOk = hasAllTags(filters.tags, [
      ...(p.tags ?? []),
      p.title,
      p.desc,
    ]);
    const hwOk = hasAllTags(filters.hardware, p.hardware);
    const swOk = hasAllTags(filters.software, p.software);
    const fabOk = hasAllTags(filters.fabrication, p.fabrication);
    const openOk = filters.stage === 0 || p.stage === filters.stage;
    const modeOk = filters.mode === "all" || p.mode === filters.mode;
    const isFork = Boolean(p.parentId && p.parentId !== "0");
    const forkOk =
      filters.fork === "all" || (filters.fork === "fork" ? isFork : !isFork);
    return (
      textOk && tagsOk && hwOk && swOk && fabOk && openOk && modeOk && forkOk
    );
  });

  const selectedBase =
    allItems.find((p) => p.id === (routeKitId || selectedId)) ??
    filtered[0] ??
    allItems[0];
  const selected = useKitContent(selectedBase, routeKitVersion);
  const rungCount = rungs.length || 4;

  const value: ShellContextValue = {
    dict,
    lang,
    isHome,
    isKit,
    kitId: routeKitId,
    kitVersion: routeKitVersion,
    conn,
    ui,
    labels,
    rungs,
    rungCount,
    filters,
    setFilters,
    allItems,
    filtered,
    selectedId,
    setSelectedId,
    selected,
  };

  return (
    <ShellContext.Provider value={value}>
      <div className="relative w-full min-h-screen md:h-screen flex flex-col text-white overflow-y-auto md:overflow-hidden">
        <Frieze />
        <div className="relative w-full flex flex-row items-center gap-2 px-3 py-2">
          <span className="relative flex text-sm">{ui?.title}</span>
        </div>

        <div className="relative w-full flex flex-col md:flex-row flex-1 md:min-h-0 gap-2 p-2">
          <div className="relative flex flex-col gap-2 w-full md:w-44 md:min-h-0">
            {left}
          </div>

          <Marco bottom={false} className="flex-col flex-1">
            {children}
          </Marco>

          <div className="relative flex flex-col w-full md:w-40">
            <div
              className="relative flex flex-col gap-2 p-2"
              style={{
                backgroundImage: "url('/images/fondocaja2.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {selected && isHome && (
                <Caja
                  bg="cajatexto"
                  type="stretch"
                  className="cursor-blacksmithHS flex-col items-center justify-center gap-1 md:w-full w-fit self-center"
                >
                  <Link
                    href={`/${lang}/kit/${selected.id}`}
                    className="relative cursor-blacksmithHS flex flex-1 w-full items-center justify-center text-xs py-3 md:px-0 px-5"
                  >
                    {dict.connection.openKit}
                  </Link>
                </Caja>
              )}

              <Caja
                bg="cajatexto"
                type="stretch"
                className="cursor-blacksmithHS flex-col items-center justify-center gap-1 md:w-full w-fit self-center"
              >
                <button
                  onClick={openConnect}
                  className="relative cursor-blacksmithHS flex flex-1 w-full items-center justify-center text-xs py-3 md:px-0 px-5"
                >
                  {conn.wrongNetwork
                    ? dict.connection.wrongNetwork
                    : conn.isConnected
                      ? conn.short
                      : dict.connection.connect}
                </button>
              </Caja>

              {NAV.map((path) => {
                const isCurrent =
                  seg.includes(path) ||
                  (path === "govern" && seg.includes("proposal")) ||
                  (path === "treeliner-grants" &&
                    seg.includes("treeliner-grant")) ||
                  (path === "cyberswagman-agents" &&
                    seg.includes("cyberswagman-agent"));
                return (
                  <Caja
                    key={path}
                    className="cursor-blacksmithHS flex-col items-center justify-center gap-1 p-2"
                  >
                    <Link
                      href={isCurrent ? `/${lang}` : `/${lang}/${path}`}
                      className="relative cursor-blacksmithHS flex flex-1 w-full items-center justify-center text-xs"
                    >
                      {isCurrent
                        ? dict.connection.goHome
                        : dict.nav[NAV_KEY[path]]}
                    </Link>
                  </Caja>
                );
              })}
            </div>
            <div className="relative justify-center flex flex-1 w-full mb-10">
              <div
                className="relative flex w-3/4 md:w-full h-full min-h-[18rem] md:min-h-auto bg-no-repeat bg-center bg-contain md:bg-cover"
                style={{
                  backgroundImage: "url('/images/mazmorra.png')",
                }}
              ></div>
            </div>
          </div>

          <div className="relative flex flex-row flex-wrap justify-center md:flex-col items-center gap-2 p-1 mb-10 md:mb-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="relative flex w-8 h-8 shrink-0"
                style={{
                  backgroundImage: `url('/images/esmeralda${i + 1}.png')`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative w-full h-0">
          <Beam />
        </div>

        <Caja className="w-full flex-col gap-1 p-4">
          <div className="relative w-full flex flex-row flex-wrap gap-2">
            {filtered.length
              ? filtered.map((p) => {
                  const cardImg = resolveUri(p.image);
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        isHome
                          ? setSelectedId(p.id)
                          : router.push(`/${lang}/kit/${p.id}`)
                      }
                      style={{
                        backgroundImage: `url('${
                          cardImg.embeddable ? cardImg.url : "/images/lock.png"
                        }')`,
                        backgroundSize: "cover",
                      }}
                      className="relative flex w-36 h-24 opacity-60 bg-no-repeat bg-center rounded-md"
                    >
                      <span
                        style={{
                          backgroundImage: "url('/images/cajacuadrado.png')",
                          backgroundSize: "100% 100%",
                        }}
                        className="absolute inset-0 bg-no-repeat bg-center"
                      />
                    </button>
                  );
                })
              : Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundImage: "url('/images/lock.png')",
                      backgroundSize: "100% 100%",
                    }}
                    className="relative flex w-24 h-24 opacity-60 bg-no-repeat bg-center rounded-md"
                  >
                    <span
                      style={{
                        backgroundImage: "url('/images/cajacuadrado.png')",
                        backgroundSize: "100% 100%",
                      }}
                      className="absolute inset-0 bg-no-repeat bg-center"
                    />
                  </div>
                ))}
          </div>
        </Caja>

        <div className="relative w-full flex flex-row overflow-hidden">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="relative flex w-8 h-8 shrink-0"
              style={{
                backgroundImage: `url('/images/piedra${stone(i)}.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ))}
        </div>
      </div>
    </ShellContext.Provider>
  );
};

export default Shell;
