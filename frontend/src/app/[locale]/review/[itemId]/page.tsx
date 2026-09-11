"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useReviewAction, useReviewItem } from "@/lib/api/queries";
import { ReviewDetailSplit } from "@/components/review/review-detail-split";

const DEMO_REVIEWER = "Demo Reviewing Lawyer";

export default function ReviewItemPage() {
  const t = useTranslations("review");
  const params = useParams<{ itemId: string }>();
  const itemId = params.itemId;
  const { data, isLoading } = useReviewItem(itemId);
  const action = useReviewAction(itemId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">{t("detailTitle")}</h1>
        <Link href="/review" className="text-sm text-primary hover:underline">
          {t("backToQueue")}
        </Link>
      </div>

      {isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-card border border-line bg-white" />
      ) : (
        <ReviewDetailSplit
          item={data.item}
          onAction={(actionType, editedDraft) =>
            action.mutate({ action: actionType, reviewer: DEMO_REVIEWER, editedDraft })
          }
        />
      )}
    </div>
  );
}
