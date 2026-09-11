"use client";

import { useLocale, useTranslations } from "next-intl";
import { ReviewStateBanner } from "./review-state-banner";
import type { DraftedDocument, DocumentReviewState } from "@/types/documents";

export function DraftedOutput({
  draft,
  reviewState,
  onToggleDemoState,
}: {
  draft: DraftedDocument;
  reviewState: DocumentReviewState;
  onToggleDemoState: () => void;
}) {
  const t = useTranslations("documents");
  const locale = useLocale();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-ink">{t("draftTitle")}</h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={reviewState === "template_approved"}
            onChange={onToggleDemoState}
            className="h-4 w-4 accent-accent"
          />
          {t("demoToggleLabel")}
        </label>
      </div>
      <p className="demo-watermark">{t("demoToggleNote")}</p>

      <ReviewStateBanner state={reviewState} />

      <ul className="space-y-3">
        {draft.conditions.map((condition, i) => (
          <li key={i} className="rounded-card border border-line bg-white p-4">
            <p className="text-sm font-medium text-ink">
              {locale === "ar" ? condition.title_ar : condition.title_en}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              {locale === "ar" ? condition.text_ar : condition.text_en}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
