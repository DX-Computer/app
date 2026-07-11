import { Suspense } from "react";
import DashboardScreen from "@/app/components/Common/components/DashboardScreen";
import { getDictionary } from "../dictionaries";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await (getDictionary as (l: any) => Promise<any>)(lang);
  return (
    <Suspense>
      <DashboardScreen dict={dict} />
    </Suspense>
  );
}
