import CreateAgentScreen from "@/app/components/Common/components/CreateAgentScreen";
import { getDictionary } from "../../dictionaries";
import { tParams } from "../../layout";

export default async function CreateCyberswagmanAgentPage({
  params,
}: {
  params: tParams;
}) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return <CreateAgentScreen dict={dict} />;
}
