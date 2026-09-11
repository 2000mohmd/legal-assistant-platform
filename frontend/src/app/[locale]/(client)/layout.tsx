import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

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
