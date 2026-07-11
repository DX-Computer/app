import { Suspense } from "react";
import CreateProductScreen from "../../../components/Common/components/CreateProductScreen";
import { getDictionary } from "../../dictionaries";
import { tParams } from "../../layout";

export default async function CreateProductPage({
  params,
}: {
  params: tParams;
}) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return (
    <Suspense>
      <CreateProductScreen dict={dict} />
    </Suspense>
  );
}
