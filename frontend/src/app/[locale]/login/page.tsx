"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Mail, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const linkError = searchParams.get("error") === "invalid_link";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const next = `/${locale}${redirectTo}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
          <Scale size={20} aria-hidden />
        </span>
        <h1 className="mt-3 font-serif text-xl text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

        {status === "sent" ? (
          <div className="mt-5 rounded-lg bg-primary-tint p-4 text-sm text-primary">
            <Mail className="mx-auto mb-2" size={20} aria-hidden />
            {t("checkEmail", { email })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-start">
            <label htmlFor="login-email" className="sr-only">
              {t("emailLabel")}
            </label>
            <Input
              id="login-email"
              type="email"
              required
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? t("sending") : t("sendLink")}
            </Button>
          </form>
        )}

        {(status === "error" || linkError) && (
          <p className="mt-3 text-xs text-accent">{t("error")}</p>
        )}
      </div>
    </div>
  );
}
