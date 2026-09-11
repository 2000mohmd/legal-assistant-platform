import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarriageTabs } from "@/components/layout/marriage-tabs";

// Auth-gated: must be evaluated per-request, never baked into a static
// build-time snapshot (see (client)/layout.tsx for the same reasoning).
export const dynamic = "force-dynamic";

export default async function MarriageLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectTo=/marriage/chat`);
  }

  return (
    <div className="container-page py-8">
      <MarriageTabs />
      {children}
    </div>
  );
}
