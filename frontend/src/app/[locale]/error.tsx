"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Without this, an unhandled render error showed Next's default error
// screen — a blank page with a framework message, in English, ignoring
// the app's direction and giving a user no way forward. For a legal
// product aimed at the public that's the worst possible moment to look
// broken and untrustworthy.
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("Unhandled render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto text-accent" size={28} aria-hidden />
        <h1 className="mt-3 font-serif text-xl text-ink">{t("unexpectedTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("unexpectedBody")}</p>
        <Button className="mt-5" onClick={reset}>
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
