import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { LOCALES } from "./lib/constants";

export type tParams = Promise<{ lang: string }>;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DX APP",
  metadataBase: new URL("https://app.dx.computer/"),
  description:
    "CC0. 0CC. 0pen Confidential Computing.",
  twitter: {
    description:
      "CC0. 0CC. 0pen Confidential Computing.",
    creator: "@digitalax_",
    site: "@digitalax_",
    card: "summary_large_image",
  },
  alternates: {
    canonical: `https://app.dx.computer/`,
    languages: LOCALES.reduce((acc, item) => {
      acc[item] = `https://app.dx.computer/${item}/`;
      return acc;
    }, {} as { [key: string]: string }),
  },
  robots: {
    googleBot: {
      index: true,
      follow: true,
    },
  },
  keywords: [
    "Web3",
    "Web3 Fashion",
    "Moda Web3",
    "Open Source",
    "CC0",
    "Open Source LLMs",
    "DIGITALAX",
    "DX.COMPUTER",
    "digitalax.xyz",
    "dx.computer",
  ],
  creator: "DX.COMPUTER",
  publisher: "DX.COMPUTER",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "DX.COMPUTER",
              url: "https://dx.computer/",

              founder: {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "DIGITALAX",
                url: "https://digitalax.xyz/",
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": "https://digitalax.xyz/",
                },
                sameAs: [
                  "https://web3fashion.xyz/",
                  "https://emancipa.xyz/",
                  "https://highlangu.com/",
                  "https://digitalax.xyz/",
                  "https://cc0web3fashion.com/",
                  "https://cc0web3.com/",
                ],
              },
            }),
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
