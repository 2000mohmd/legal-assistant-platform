import { Clock3, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DocumentReviewState } from "@/types/documents";

export function ReviewStateBanner({ state }: { state: DocumentReviewState }) {
  const t = useTranslations("documents");

  if (state === "template_approved") {
    return (
      <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary-tint p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-medium text-ink">{t("templateApprovedTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("templateApprovedBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-lg border border-accent/30 bg-accent-tint/60 p-4">
      <Clock3 size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="text-sm font-medium text-ink">{t("pendingReviewTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("pendingReviewBody")}</p>
      </div>
    </div>
  );
}
