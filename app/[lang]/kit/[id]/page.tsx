import { redirect } from "next/navigation";
import { subgraphQuery } from "@/app/lib/graphql/fetcher";
import { KIT_VERSION_QUERY } from "@/app/lib/graphql/queries";

export default async function KitPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const data = await subgraphQuery<{ kit: { version: string } | null }>(
    KIT_VERSION_QUERY,
    { id },
  );
  const latest = data?.kit?.version ?? "0";
  redirect(`/${lang}/kit/${id}/${latest}`);
}
