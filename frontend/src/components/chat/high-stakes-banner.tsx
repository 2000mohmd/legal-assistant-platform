import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function HighStakesBanner({ councilNote }: { councilNote?: string | null }) {
  const t = useTranslations("chat");

  return (
    <div className="flex gap-3 rounded-lg border border-accent/30 bg-accent-tint/60 p-3">
      <Users size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="text-sm font-medium text-ink">{t("highStakesTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("highStakesBody")}</p>
        {councilNote && <p className="mt-1.5 text-xs text-muted">{councilNote}</p>}
      </div>
    </div>
  );
}
