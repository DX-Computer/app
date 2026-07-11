import { Suspense } from "react";
import { getDictionary } from "./[lang]/dictionaries";
import Wrapper from "./components/Common/components/Wrapper";
import Entry from "./components/Common/components/Entry";

export default async function IndexPage() {
  const dict = await (getDictionary as (locale: any) => Promise<any>)("en");
  return (
    <Wrapper
      page={
        <Suspense fallback={<></>}>
          <Entry dict={dict} />
        </Suspense>
      }
    />
  );
}
