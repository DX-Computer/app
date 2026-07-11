import MarketDetailScreen from "../../../components/Common/components/MarketDetailScreen";
import { getDictionary } from "../../dictionaries";

export default async function MarketProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <MarketDetailScreen dict={dict} id={id} />;
}
