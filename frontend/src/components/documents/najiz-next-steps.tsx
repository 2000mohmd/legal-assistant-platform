import { Landmark } from "lucide-react";
import { useTranslations } from "next-intl";

export function NajizNextSteps() {
  const t = useTranslations("documents");

  return (
    <div className="rounded-card border border-line bg-white p-5">
      <div className="flex items-center gap-2.5">
        <Landmark size={18} className="text-ink" aria-hidden />
        <h3 className="font-serif text-lg text-ink">{t("najizTitle")}</h3>
      </div>
      <p className="mt-2 text-sm text-muted">{t("najizBody")}</p>
    </div>
  );
}
