"use client";

import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocumentRequestSummary, RequestReviewStatus } from "@/types/documents";

function StatusBadge({ status }: { status: RequestReviewStatus }) {
  const t = useTranslations("documents");

  if (status === "approved" || status === "edited_approved") {
    return (
      <Badge variant="verified">
        <CheckCircle2 size={12} aria-hidden />
        {t("statusApproved")}
      </Badge>
    );
  }
  if (status === "rejected") {
    // Gold, not red — consistent with the rest of the product's treatment
    // of review outcomes as quality signals rather than user errors.
    return (
      <Badge variant="flagged">
        <XCircle size={12} aria-hidden />
        {t("statusRejected")}
      </Badge>
    );
  }
  return (
    <Badge variant="neutral">
      <Clock3 size={12} aria-hidden />
      {t("statusPending")}
    </Badge>
  );
}

export function MyRequests({ requests }: { requests: DocumentRequestSummary[] }) {
  const t = useTranslations("documents");
  const locale = useLocale();

  if (requests.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-white/60 p-6 text-center">
        <FileText className="mx-auto text-muted" size={20} aria-hidden />
        <p className="mt-2 text-sm text-muted">{t("noRequestsYet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-card border border-line bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-medium text-ink">{request.situation}</p>
            <StatusBadge status={request.reviewStatus} />
          </div>
          <p className="mt-1 text-xs text-muted">
            <bdi dir="ltr">{new Date(request.generatedAt).toLocaleString()}</bdi>
          </p>

          {request.reviewStatus === "pending" && (
            <p className="mt-3 text-sm text-muted">{t("pendingReviewBody")}</p>
          )}

          {request.deliveredText && (
            <div className="mt-3 rounded-lg bg-primary-tint/60 p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
                {t("deliveredHeading")}
              </p>
              <p className="whitespace-pre-line text-sm text-body">{request.deliveredText}</p>
            </div>
          )}

          {request.reviewStatus === "rejected" && (
            <p className="mt-3 text-sm text-muted">{t("rejectedBody")}</p>
          )}

          {request.reviewStatus === "pending" && request.conditions.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {request.conditions.map((condition, i) => (
                <li key={i} className="text-xs text-muted">
                  • {locale === "ar" ? condition.title_ar : condition.title_en}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
