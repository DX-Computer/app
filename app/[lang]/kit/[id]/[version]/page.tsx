import { getDictionary } from "../../../dictionaries";
import KitScreen from "@/app/components/Common/components/KitScreen";

export default async function KitVersionPage({
  params,
}: {
  params: Promise<{ lang: string; id: string; version: string }>;
}) {
  const { lang } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <KitScreen dict={dict} />;
}
