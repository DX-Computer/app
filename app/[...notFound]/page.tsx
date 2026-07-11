import { Suspense } from "react";
import { getDictionary } from "../[lang]/dictionaries";
import Wrapper from "../components/Common/components/Wrapper";
import NotFoundEntry from "../components/Common/components/NotFoundEntry";

export default async function NotFound() {
  const dict = await (getDictionary as (locale: any) => Promise<any>)("en");
  return (
    <Wrapper
      page={
        <Suspense fallback={<></>}>
          <NotFoundEntry dict={dict} />
        </Suspense>
      }
    />
  );
}
