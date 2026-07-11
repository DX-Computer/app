export type tParams = Promise<{ lang: string }>;

const RTL_LANGS = ["ar", "א", "د", "yi"];

export async function generateStaticParams() {
  return [
    { lang: "en" },
    { lang: "es" },
    { lang: "ar" },
    { lang: "pt" },
    { lang: "fr" },
  ];
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: tParams;
}>) {
  const { lang } = await params;
  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  return (
    <>
      <div
        dir={dir}
        className="min-h-full h-auto min-w-screen w-screen relative selection:bg-skyBlue selection:text-dull cursor-blacksmithS overflow-x-hidden flex flex-col"
        id="noScroll"
      >
        {children}
      </div>
    </>
  );
}
