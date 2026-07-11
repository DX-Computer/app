import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextRequest, NextResponse } from "next/server";

let locales = ["en", "es", "ar", "pt", "fr"];
let localeSegments = ["en", "es", "ar", "pt", "fr"];
let defaultLocale = "en";

function getLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  let headers = {
    "accept-language": request.headers.get("accept-language") || "en",
  };
  let languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

function isBot(userAgent: string) {
  return /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou/i.test(
    userAgent,
  );
}

export function middleware(request: NextRequest) {
  const pathname = decodeURIComponent(request.nextUrl.pathname);
  const userAgent = request.headers.get("user-agent") || "";

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/videos") ||
    pathname.startsWith("/circuits") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/opengraph-image.png") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/image-sitemap.xml") ||
    pathname.startsWith("/llms.txt")
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = localeSegments.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    const urlLocale = localeSegments.find(
      (locale) =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
    );
    const response = NextResponse.next();
    if (urlLocale && request.cookies.get("NEXT_LOCALE")?.value !== urlLocale) {
      response.cookies.set("NEXT_LOCALE", urlLocale, {
        path: "/",
        sameSite: "lax",
      });
    }
    return response;
  }

  if (isBot(userAgent)) {
    return NextResponse.next();
  }

  const locale = getLocale(request);

  if (locale === defaultLocale) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url),
  );

  response.cookies.set("NEXT_LOCALE", locale, { path: "/", sameSite: "lax" });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|images|videos|circuits|llms.txt|fonts|favicon.ico|opengraph-image.png|api|sitemap|image-sitemap.xml).*)",
  ],
};
