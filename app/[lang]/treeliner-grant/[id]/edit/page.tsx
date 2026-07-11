import { Suspense } from "react";
import EditGrantScreen from "@/app/components/Common/components/EditGrantScreen";
import { getDictionary } from "../../../dictionaries";

export default async function EditGrantPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return (
    <Suspense>
      <EditGrantScreen dict={dict} id={id} />
    </Suspense>
  );
}
