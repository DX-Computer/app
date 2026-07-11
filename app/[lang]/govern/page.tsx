import GovernScreen from "../../components/Common/components/GovernScreen";
import { getDictionary } from "../dictionaries";
import { tParams } from "../layout";

export default async function GovernPage({ params }: { params: tParams }) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return <GovernScreen dict={dict} />;
}
