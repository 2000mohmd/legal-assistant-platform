import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleToggle } from "./locale-toggle";

export function SiteHeader() {
  const t = useTranslations("common");

  return (
    <header className="border-b border-line bg-white">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Scale size={18} aria-hidden />
          </span>
          <span className="font-serif text-lg text-ink">{t("firmPlaceholder")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{t("brandTagline")}</span>
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}
