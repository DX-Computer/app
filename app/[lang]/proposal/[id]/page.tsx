import ProposalScreen from "../../../components/Common/components/ProposalScreen";
import { getDictionary } from "../../dictionaries";

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <ProposalScreen dict={dict} id={id} />;
}
