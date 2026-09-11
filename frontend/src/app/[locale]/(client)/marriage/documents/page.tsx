"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { IntakeForm } from "@/components/documents/intake-form";
import { DraftedOutput } from "@/components/documents/drafted-output";
import { NajizNextSteps } from "@/components/documents/najiz-next-steps";
import type { DraftedDocument, DocumentReviewState, IntakeRequest } from "@/types/documents";

export default function MarriageDocumentsPage() {
  const t = useTranslations("documents");
  const common = useTranslations("common");
  const [demoReviewState, setDemoReviewState] = useState<DocumentReviewState>("pending_lawyer_review");

  const mutation = useMutation({
    mutationFn: (data: IntakeRequest) =>
      apiClient.post<{ draft: DraftedDocument }>("/api/documents/intake", data),
    onSuccess: (res) => setDemoReviewState(res.draft.reviewState),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="rounded-card border border-line bg-white p-5">
        <IntakeForm onSubmit={(data) => mutation.mutate(data)} submitting={mutation.isPending} />
      </div>

      {mutation.data && (
        <DraftedOutput
          draft={mutation.data.draft}
          reviewState={demoReviewState}
          onToggleDemoState={() =>
            setDemoReviewState((s) => (s === "pending_lawyer_review" ? "template_approved" : "pending_lawyer_review"))
          }
        />
      )}

      <NajizNextSteps />

      <p>
        <span className="demo-watermark">{common("demoWatermark")}</span>
      </p>
    </div>
  );
}
