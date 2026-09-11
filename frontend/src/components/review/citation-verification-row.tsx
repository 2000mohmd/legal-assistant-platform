import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CitationCheck } from "@/types/review";

export function CitationVerificationRow({ check }: { check: CitationCheck }) {
  const t = useTranslations("review");
  const passed = check.result === "passed";

  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <bdi dir="ltr">{check.citation.article_or_madda}</bdi>
          <span className="text-muted">· {check.citation.source_document}</span>
        </p>
        {passed ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <CheckCircle2 size={13} aria-hidden />
            {t("passed")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
            <AlertTriangle size={13} aria-hidden />
            {t("flaggedResult")}
          </span>
        )}
      </div>
      <p className="mt-2 rounded bg-primary-tint/40 p-2 text-xs text-body">{check.citation.quoted_text}</p>
      <p className="mt-1.5 text-xs text-muted">{check.note}</p>
    </div>
  );
}
