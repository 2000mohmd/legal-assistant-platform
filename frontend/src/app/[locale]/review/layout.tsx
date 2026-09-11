"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "demo-review-role";

export default function ReviewLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("review");
  const common = useTranslations("common");
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      setRole(sessionStorage.getItem(SESSION_KEY));
    } catch {
      // sessionStorage unavailable — fall back to the gate every time.
    }
    setChecked(true);
  }, []);

  function enter() {
    try {
      sessionStorage.setItem(SESSION_KEY, "lawyer");
    } catch {
      // ignore — demo-only convenience, not required for the gate to work
    }
    setRole("lawyer");
  }

  if (!checked) return null;

  if (!role) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-card border border-line bg-white p-6 text-center shadow-sm">
          <ShieldCheck className="mx-auto text-primary" size={28} aria-hidden />
          <h1 className="mt-3 font-serif text-xl text-ink">{t("gateTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("gateSubtitle")}</p>
          <Button className="mt-5 w-full" onClick={enter}>
            {t("roleLawyer")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--ink)" }}>
      <header className="border-b border-white/10">
        <div className="container-page flex h-14 items-center">
          <span className="text-sm font-medium text-white">
            {common("internalTool")} — Legal Ops Review Console
          </span>
        </div>
      </header>
      <div className="min-h-[calc(100vh-3.5rem)] rounded-t-[1.5rem]" style={{ background: "var(--bg)" }}>
        <div className="container-page py-8">{children}</div>
      </div>
    </div>
  );
}
