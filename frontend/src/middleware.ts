import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Refresh the Supabase session cookie first, then let next-intl decide
  // the actual response (locale redirect/rewrite); carry the refreshed
  // auth cookies over onto whichever response next-intl produces.
  const { response: supabaseResponse } = await updateSession(request);
  const intlResponse = intlMiddleware(request);

  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|auth|_next|.*\\..*).*)"],
};
