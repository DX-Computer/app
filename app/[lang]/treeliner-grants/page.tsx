import GrantsScreen from "../../components/Common/components/GrantsScreen";
import { getDictionary } from "../dictionaries";
import { tParams } from "../layout";

export default async function TreelinerGrantsPage({ params }: { params: tParams }) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return <GrantsScreen dict={dict} />;
}
