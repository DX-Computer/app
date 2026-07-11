import EditKitScreen from "@/app/components/Common/components/EditKitScreen";
import { getDictionary } from "../../../dictionaries";

export default async function EditKitPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return <EditKitScreen dict={dict} id={id} />;
}
