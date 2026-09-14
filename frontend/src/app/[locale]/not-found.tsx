import { useTranslations } from "next-intl";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-white p-6 text-center shadow-sm">
        <Compass className="mx-auto text-muted" size={28} aria-hidden />
        <h1 className="mt-3 font-serif text-xl text-ink">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("notFoundBody")}</p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
