import GrantScreen from "../../../components/Common/components/GrantScreen";
import { getDictionary } from "../../dictionaries";

export default async function TreelinerGrantPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <GrantScreen dict={dict} id={id} />;
}
