import { Suspense } from "react";
import CreateKitScreen from "../../components/Common/components/CreateKitScreen";
import { getDictionary } from "../dictionaries";
import { tParams } from "../layout";

export default async function CreatePage({ params }: { params: tParams }) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return (
    <Suspense>
      <CreateKitScreen dict={dict} />
    </Suspense>
  );
}
