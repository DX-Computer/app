import AgentScreen from "@/app/components/Common/components/AgentScreen";
import { getDictionary } from "../../dictionaries";

export default async function CyberswagmanAgentPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <AgentScreen dict={dict} id={id} />;
}
