"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { IntakeForm } from "@/components/documents/intake-form";
import { DraftedOutput } from "@/components/documents/drafted-output";
import { MyRequests } from "@/components/documents/my-requests";
import { NajizNextSteps } from "@/components/documents/najiz-next-steps";
import type {
  DocumentRequestSummary,
  DraftedDocument,
  DocumentReviewState,
  IntakeRequest,
} from "@/types/documents";

export default function MarriageDocumentsPage() {
  const t = useTranslations("documents");
  const common = useTranslations("common");
  const queryClient = useQueryClient();
  const [demoReviewState, setDemoReviewState] = useState<DocumentReviewState>("pending_lawyer_review");

  const requests = useQuery({
    queryKey: ["document-requests"],
    queryFn: () => apiClient.get<{ requests: DocumentRequestSummary[] }>("/api/documents/requests"),
  });

  const mutation = useMutation({
    mutationFn: (data: IntakeRequest) =>
      apiClient.post<{ draft: DraftedDocument }>("/api/documents/intake", data),
    onSuccess: (res) => {
      setDemoReviewState(res.draft.reviewState);
      // A submission now creates a real review-queue item for a lawyer
      // (migration 0002), so the list below is immediately stale.
      queryClient.invalidateQueries({ queryKey: ["document-requests"] });
    },
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

      <div>
        <h2 className="mb-3 font-serif text-xl text-ink">{t("myRequestsTitle")}</h2>
        {requests.isLoading ? (
          <div className="h-24 animate-pulse rounded-card border border-line bg-white" />
        ) : (
          <MyRequests requests={requests.data?.requests ?? []} />
        )}
      </div>

      <NajizNextSteps />

      <p>
        <span className="demo-watermark">{common("demoWatermark")}</span>
      </p>
    </div>
  );
}
