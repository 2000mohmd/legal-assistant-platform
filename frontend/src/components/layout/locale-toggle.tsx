"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";

export function LocaleToggle() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const nextLocale: AppLocale = locale === "ar" ? "en" : "ar";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label="Toggle language"
    >
      <Languages size={14} aria-hidden />
      {t("toggleLabel")}
    </Button>
  );
}
