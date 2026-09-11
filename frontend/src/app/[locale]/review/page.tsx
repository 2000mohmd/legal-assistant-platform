"use client";

import { useTranslations } from "next-intl";
import { useReviewQueue } from "@/lib/api/queries";
import { ReviewQueueTable } from "@/components/review/review-queue-table";

export default function ReviewQueuePage() {
  const t = useTranslations("review");
  const { data, isLoading } = useReviewQueue();

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl text-ink">{t("queueTitle")}</h1>
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-card border border-line bg-white" />
      ) : (
        <ReviewQueueTable items={data?.items ?? []} />
      )}
    </div>
  );
}
