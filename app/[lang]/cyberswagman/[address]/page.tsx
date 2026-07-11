import CyberswagmanScreen from "@/app/components/Common/components/CyberswagmanScreen";
import { getDictionary } from "../../dictionaries";

export default async function CyberswagmanPage({
  params,
}: {
  params: Promise<{ lang: string; address: string }>;
}) {
  const { lang, address } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <CyberswagmanScreen dict={dict} address={address} />;
}
