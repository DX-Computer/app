import { Suspense } from "react";
import CreateGrantScreen from "../../../components/Common/components/CreateGrantScreen";
import { getDictionary } from "../../dictionaries";
import { tParams } from "../../layout";

export default async function CreateTreelinerGrantPage({ params }: { params: tParams }) {
  const { lang } = await params;
  const dict = await (getDictionary as (locale: any) => Promise<any>)(lang);
  return (
    <Suspense>
      <CreateGrantScreen dict={dict} />
    </Suspense>
  );
}
