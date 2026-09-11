import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

// SiteHeader reads the auth session on every render (sign-in vs. sign-out
// state) — force dynamic rendering so that's evaluated per-request rather
// than baked into a static build-time snapshot. Same reasoning as
// marriage/layout.tsx's redirect-if-signed-out check.
export const dynamic = "force-dynamic";

// Client-facing chrome (home + marriage flows) — deliberately NOT shared
// with /review, which needs visibly different chrome per frontend-CLAUDE.md
// ("this is the internal tool").
export default function ClientChromeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}
