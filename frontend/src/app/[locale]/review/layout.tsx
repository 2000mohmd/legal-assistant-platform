import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/sign-out-button";

// Auth-and-role-gated: must be evaluated per-request, never baked into a
// static build-time snapshot.
export const dynamic = "force-dynamic";

export default async function ReviewLayout({
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
    redirect(`/${locale}/login?redirectTo=/review`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const t = await getTranslations({ locale, namespace: "review" });
  const common = await getTranslations({ locale, namespace: "common" });

  if (profile?.role !== "lawyer") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-card border border-line bg-white p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto text-accent" size={28} aria-hidden />
          <h1 className="mt-3 font-serif text-xl text-ink">{t("accessDeniedTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("accessDeniedBody", { email: user.email ?? "" })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--ink)" }}>
      <header className="border-b border-white/10">
        <div className="container-page flex h-14 items-center justify-between">
          <span className="text-sm font-medium text-white">
            {common("internalTool")} — Legal Ops Review Console
          </span>
          <SignOutButton className="text-white/80 hover:bg-white/10 hover:text-white" />
        </div>
      </header>
      <div
        className="min-h-[calc(100vh-3.5rem)] rounded-t-[1.5rem]"
        style={{ background: "var(--bg)" }}
      >
        <div className="container-page py-8">{children}</div>
      </div>
    </div>
  );
}
