import CreateProposalScreen from "../../../components/Common/components/CreateProposalScreen";
import { getDictionary } from "../../dictionaries";
import { tParams } from "../../layout";

export default async function CreateProposalPage({ params }: { params: tParams }) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return <CreateProposalScreen dict={dict} />;
}
