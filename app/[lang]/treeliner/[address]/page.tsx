import TreelinerScreen from "@/app/components/Common/components/TreelinerScreen";
import { getDictionary } from "../../dictionaries";

export default async function TreelinerPage({
  params,
}: {
  params: Promise<{ lang: string; address: string }>;
}) {
  const { lang, address } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <TreelinerScreen dict={dict} address={address} />;
}
