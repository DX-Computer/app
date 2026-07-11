import MarketScreen from "../../components/Common/components/MarketScreen";
import { getDictionary } from "../dictionaries";
import { tParams } from "../layout";

export default async function MarketPage({ params }: { params: tParams }) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return <MarketScreen dict={dict} />;
}
