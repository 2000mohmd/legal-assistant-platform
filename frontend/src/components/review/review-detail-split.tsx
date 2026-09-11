"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CitationVerificationRow } from "./citation-verification-row";
import { DiffView } from "./diff-view";
import { AuditTrail } from "./audit-trail";
import type { ReviewItem } from "@/types/review";

export function ReviewDetailSplit({
  item,
  onAction,
}: {
  item: ReviewItem;
  onAction: (action: "approved" | "edited_approve" | "rejected", editedDraft?: string) => void;
}) {
  const t = useTranslations("review");
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(item.editedDraft ?? item.aiDraft);
  const resolved = item.status !== "pending";

  const statusLabel: Record<ReviewItem["status"], string> = {
    pending: t("statusPending"),
    approved: t("statusApproved"),
    edited_approved: t("statusEditedApproved"),
    rejected: t("statusRejected"),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-line bg-white p-4">
          <p className="mb-2 text-xs font-medium text-muted">{t("aiDraftLabel")}</p>
          {editing ? (
            <Textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={6} />
          ) : (
            <p className="whitespace-pre-line text-sm text-body">{item.editedDraft ?? item.aiDraft}</p>
          )}
        </div>
        <div className="rounded-card border border-line bg-white p-4">
          <p className="mb-2 text-xs font-medium text-muted">{t("verificationLabel")}</p>
          <div className="space-y-2.5">
            {item.citationChecks.map((check, i) => (
              <CitationVerificationRow key={i} check={check} />
            ))}
          </div>
        </div>
      </div>

      {!resolved && editing && draftText !== item.aiDraft && <DiffView before={item.aiDraft} after={draftText} />}
      {resolved && item.editedDraft && item.editedDraft !== item.aiDraft && (
        <DiffView before={item.aiDraft} after={item.editedDraft} />
      )}

      {resolved ? (
        <div className="flex items-center gap-2.5">
          <Badge variant="verified">{statusLabel[item.status]}</Badge>
          <span className="text-xs text-muted">{t("resolvedNote")}</span>
        </div>
      ) : editing ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onAction("edited_approve", draftText)}>{t("saveEdit")}</Button>
          <Button variant="outline" onClick={() => setEditing(false)}>
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onAction("approved")}>{t("approve")}</Button>
          <Button variant="outline" onClick={() => setEditing(true)}>
            {t("editApprove")}
          </Button>
          <Button variant="destructive" onClick={() => onAction("rejected")}>
            {t("reject")}
          </Button>
        </div>
      )}

      <AuditTrail events={item.audit} />
    </div>
  );
}
