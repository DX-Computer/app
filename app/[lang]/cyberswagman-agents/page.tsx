import AgentsScreen from "@/app/components/Common/components/AgentsScreen";
import { getDictionary } from "../dictionaries";
import { tParams } from "../layout";

export default async function CyberswagmanAgentsPage({
  params,
}: {
  params: tParams;
}) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return <AgentsScreen dict={dict} />;
}
