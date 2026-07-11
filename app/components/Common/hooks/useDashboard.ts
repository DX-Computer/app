import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits, parseAbiItem } from "viem";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { DASHBOARD_QUERY, ANON_OWNED_QUERY } from "@/app/lib/graphql/queries";
import { contractConfig } from "@/app/lib/contracts";
import { getIdentity, matchesOwnerTag } from "@/app/lib/zk/identity";
import { semaphoreNullifier } from "@/app/lib/zk/identityTree";
import { commentTag } from "@/app/lib/commentTag";
import resolveUri from "./resolveUri";
import {
  DashboardData,
  DashboardSignalRow,
} from "../types/common.types";

type Hash = `0x${string}`;

const SIGNALED_EVENT = parseAbiItem(
  "event Signaled(uint256 indexed kitId, uint8 choice, uint256 nullifier)",
);
const SIGNALED_PUBLIC_EVENT = parseAbiItem(
  "event SignaledPublic(uint256 indexed kitId, uint8 choice, address indexed signaler)",
);
const VOTED_EVENT = parseAbiItem(
  "event Voted(uint256 indexed id, uint8 choice, uint256 nullifier)",
);

const loadVotedProposals = async (
  publicClient: ReturnType<typeof usePublicClient>,
  councilAddr?: string,
): Promise<{ id: string; choice: number }[]> => {
  const identity = getIdentity();
  if (!identity || !publicClient || !councilAddr) return [];
  try {
    const logs = await publicClient.getLogs({
      address: councilAddr as Hash,
      event: VOTED_EVENT,
      fromBlock: 0n,
    });
    const byProposal = new Map<string, number>();
    for (const l of logs) {
      if (
        l.args.id === undefined ||
        l.args.nullifier === undefined ||
        l.args.choice === undefined
      )
        continue;
      const mine = semaphoreNullifier(l.args.id, identity.secretScalar);
      if (mine === l.args.nullifier) {
        byProposal.set(l.args.id.toString(), Number(l.args.choice));
      }
    }
    return Array.from(byProposal.entries()).map(([id, choice]) => ({
      id,
      choice,
    }));
  } catch {
    return [];
  }
};

type RawDashboard = {
  kits: { kitId: string; contentUri: string; revoked: boolean }[];
  offers: {
    offerId: string;
    contentUri: string;
    exists: boolean;
    price: string;
    quantity: string;
  }[];
  grants: {
    grantId: string;
    contentUri: string;
    removed: boolean;
    budget: string;
    raised: string;
  }[];
  agents: { agentId: string; contentUri: string }[];
  contents: {
    contentId: string;
    contentUri: string;
    canonicalTag: string;
    revoked: boolean;
    createdAtTimestamp: string;
  }[];
  orders: {
    orderId: string;
    offerId: string;
    status: string;
    createdAtTimestamp: string;
    offer: { contentUri: string } | null;
  }[];
  councilProposals: {
    proposalId: string;
    kind: number;
    contentUri: string;
    executed: boolean;
    end: string;
    yes: string;
    no: string;
  }[];
  creatorBans: {
    creator: string;
    banned: boolean;
    createdAtTimestamp: string;
    transactionHash: string;
  }[];
  grantFunders: {
    shares: string;
    grant: { grantId: string; contentUri: string; removed: boolean } | null;
  }[];
  treeliner: {
    totalStaked: string;
    totalClaimed: string;
    grantsFunded: number;
  } | null;
  allKits: { kitId: string }[];
  allGrants: { grantId: string }[];
  allOffers: { offerId: string }[];
  allProposals: { proposalId: string }[];
};

const jsonOf = async (uri: string): Promise<Record<string, unknown> | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    return (await (await fetch(r.url)).json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const titleOf = async (uri: string): Promise<string> => {
  const j = await jsonOf(uri);
  const t = j && (j.title || j.name || j.purpose);
  return typeof t === "string" ? t : "";
};

const textOf = async (uri: string): Promise<string> => {
  const j = await jsonOf(uri);
  return j && typeof j.text === "string" ? j.text : "";
};

const num = (v?: string): number => {
  try {
    return Number(formatUnits(BigInt(v || "0"), 18));
  } catch {
    return 0;
  }
};

const empty: DashboardData = {
  kits: [],
  offers: [],
  grants: [],
  agents: [],
  comments: [],
  signals: [],
  orders: [],
  proposals: [],
  bans: [],
  fundedGrants: [],
  votedProposals: [],
  treeliner: null,
};

type RawAnon = {
  kits: {
    kitId: string;
    contentUri: string;
    ownerTag: string;
    revoked: boolean;
    versions: { designHash: string }[];
  }[];
  contents: {
    contentId: string;
    contentUri: string;
    ownerTag: string;
    contentHash: string;
    canonicalTag: string;
    revoked: boolean;
    createdAtTimestamp: string;
  }[];
};

const loadAnon = async (
  publicClient: ReturnType<typeof usePublicClient>,
  signalReady: boolean,
  signalAddr?: string,
  councilAddr?: string,
): Promise<DashboardData> => {
  const identity = getIdentity();
  if (!identity) return empty;
  const raw = await subgraphQuery<RawAnon>(ANON_OWNED_QUERY);
  if (!raw) return empty;
  const votedProposals = await loadVotedProposals(publicClient, councilAddr);

  const myKitsRaw = (raw.kits ?? []).filter((k) => {
    const v0 = k.versions?.[0]?.designHash;
    return Boolean(v0 && k.ownerTag && matchesOwnerTag(v0, k.ownerTag));
  });
  const kits = await Promise.all(
    myKitsRaw.map(async (k) => ({
      id: k.kitId,
      title: await titleOf(k.contentUri),
      revoked: k.revoked,
    })),
  );

  const myContentsRaw = (raw.contents ?? []).filter((c) =>
    Boolean(c.ownerTag && c.contentHash && matchesOwnerTag(c.contentHash, c.ownerTag)),
  );
  const comments = await Promise.all(
    myContentsRaw.map(async (c) => ({
      id: c.contentId,
      text: await textOf(c.contentUri),
      revoked: c.revoked,
      time: c.createdAtTimestamp,
      href: "",
    })),
  );

  const signals: DashboardSignalRow[] = [];
  if (publicClient && signalReady && signalAddr) {
    try {
      const anonLogs = await publicClient.getLogs({
        address: signalAddr as Hash,
        event: SIGNALED_EVENT,
        fromBlock: 0n,
      });
      for (const l of anonLogs) {
        if (
          l.args.kitId === undefined ||
          l.args.nullifier === undefined ||
          l.args.choice === undefined
        )
          continue;
        const mine = semaphoreNullifier(l.args.kitId, identity.secretScalar);
        if (mine === l.args.nullifier) {
          signals.push({
            kitId: l.args.kitId.toString(),
            choice: Number(l.args.choice),
            mode: "anonymous",
          });
        }
      }
    } catch {}
  }

  return { ...empty, kits, comments, signals, votedProposals };
};

const useDashboard = (): { data: DashboardData; loading: boolean } => {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { address: signalAddr, ready: signalReady } =
    contractConfig("kitSignal");
  const { address: councilAddr } = contractConfig("dxCouncil");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", account, getIdentity()?.commitment?.toString()],
    queryFn: async (): Promise<DashboardData> => {
      if (!account)
        return loadAnon(publicClient, signalReady, signalAddr, councilAddr);
      const user = account.toLowerCase();
      const raw = await subgraphQuery<RawDashboard>(DASHBOARD_QUERY, {
        user,
        userId: user,
      });
      if (!raw) return empty;

      const tagHref = new Map<string, string>();
      for (const k of raw.allKits ?? []) {
        tagHref.set(commentTag("kit", k.kitId), `kit/${k.kitId}`);
      }
      for (const g of raw.allGrants ?? []) {
        tagHref.set(commentTag("grant", g.grantId), `treeliner-grant/${g.grantId}`);
      }
      for (const o of raw.allOffers ?? []) {
        tagHref.set(commentTag("product", o.offerId), `market/${o.offerId}`);
      }
      for (const p of raw.allProposals ?? []) {
        tagHref.set(commentTag("proposal", p.proposalId), `proposal/${p.proposalId}`);
      }

      const [kits, offers, grants, agents, comments, orders, fundedGrants] =
        await Promise.all([
          Promise.all(
            (raw.kits ?? []).map(async (k) => ({
              id: k.kitId,
              title: await titleOf(k.contentUri),
              revoked: k.revoked,
            })),
          ),
          Promise.all(
            (raw.offers ?? []).map(async (o) => ({
              id: o.offerId,
              title: await titleOf(o.contentUri),
              exists: o.exists,
              price: num(o.price),
              quantity: Number(o.quantity) || 0,
            })),
          ),
          Promise.all(
            (raw.grants ?? []).map(async (g) => ({
              id: g.grantId,
              title: await titleOf(g.contentUri),
              removed: g.removed,
              budget: num(g.budget),
              raised: num(g.raised),
            })),
          ),
          Promise.all(
            (raw.agents ?? []).map(async (a) => ({
              id: a.agentId,
              title: await titleOf(a.contentUri),
            })),
          ),
          Promise.all(
            (raw.contents ?? []).map(async (c) => ({
              id: c.contentId,
              text: await textOf(c.contentUri),
              revoked: c.revoked,
              time: c.createdAtTimestamp,
              href: tagHref.get(c.canonicalTag) ?? "",
            })),
          ),
          Promise.all(
            (raw.orders ?? []).map(async (o) => ({
              id: o.orderId,
              offerId: o.offerId,
              title: o.offer ? await titleOf(o.offer.contentUri) : "",
              status: o.status,
              time: o.createdAtTimestamp,
            })),
          ),
          Promise.all(
            (raw.grantFunders ?? [])
              .filter((f) => f.grant !== null)
              .map(async (f) => ({
                id: f.grant!.grantId,
                title: await titleOf(f.grant!.contentUri),
                removed: f.grant!.removed,
                shares: num(f.shares),
              })),
          ),
        ]);

      const signals: DashboardSignalRow[] = [];
      if (publicClient && signalReady && signalAddr) {
        try {
          const [anonLogs, pubLogs] = await Promise.all([
            publicClient.getLogs({
              address: signalAddr as Hash,
              event: SIGNALED_EVENT,
              fromBlock: 0n,
            }),
            publicClient.getLogs({
              address: signalAddr as Hash,
              event: SIGNALED_PUBLIC_EVENT,
              args: { signaler: account },
              fromBlock: 0n,
            }),
          ]);
          for (const l of pubLogs) {
            if (l.args.kitId === undefined || l.args.choice === undefined)
              continue;
            signals.push({
              kitId: l.args.kitId.toString(),
              choice: Number(l.args.choice),
              mode: "public",
            });
          }
          const identity = getIdentity();
          if (identity) {
            for (const l of anonLogs) {
              if (
                l.args.kitId === undefined ||
                l.args.nullifier === undefined ||
                l.args.choice === undefined
              )
                continue;
              const mine = semaphoreNullifier(l.args.kitId, identity.secretScalar);
              if (mine === l.args.nullifier) {
                signals.push({
                  kitId: l.args.kitId.toString(),
                  choice: Number(l.args.choice),
                  mode: "anonymous",
                });
              }
            }
          }
        } catch {}
      }

      const votedProposals = await loadVotedProposals(publicClient, councilAddr);

      return {
        kits,
        offers,
        grants,
        agents,
        comments,
        signals,
        orders,
        votedProposals,
        proposals: (raw.councilProposals ?? []).map((p) => ({
          id: p.proposalId,
          kind: p.kind,
          executed: p.executed,
          end: p.end,
          yes: Number(p.yes) || 0,
          no: Number(p.no) || 0,
        })),
        bans: (raw.creatorBans ?? []).map((b) => ({
          creator: b.creator,
          banned: b.banned,
          time: b.createdAtTimestamp,
          tx: b.transactionHash,
        })),
        fundedGrants,
        treeliner: raw.treeliner
          ? {
              staked: num(raw.treeliner.totalStaked),
              claimed: num(raw.treeliner.totalClaimed),
              grantsFunded: raw.treeliner.grantsFunded,
            }
          : null,
      };
    },
    enabled: subgraphReady() && (Boolean(account) || Boolean(getIdentity())),
  });

  return { data: data ?? empty, loading: isLoading };
};

export default useDashboard;
