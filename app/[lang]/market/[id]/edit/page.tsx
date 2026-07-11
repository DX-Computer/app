import { Suspense } from "react";
import EditProductScreen from "@/app/components/Common/components/EditProductScreen";
import { getDictionary } from "../../../dictionaries";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return (
    <Suspense>
      <EditProductScreen dict={dict} id={id} />
    </Suspense>
  );
}
