import { Suspense } from "react";
import EditAgentScreen from "@/app/components/Common/components/EditAgentScreen";
import { getDictionary } from "../../../dictionaries";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return (
    <Suspense>
      <EditAgentScreen dict={dict} id={id} />
    </Suspense>
  );
}
