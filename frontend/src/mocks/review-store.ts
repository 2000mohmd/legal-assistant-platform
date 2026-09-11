import { reviewQueue } from "./fixtures/review-queue";
import type { AuditEvent, ReviewItem } from "@/types/review";

// In-memory mock store, scoped to the dev server process — resets on
// restart. Stands in for a real backend persistence layer.
const store: ReviewItem[] = reviewQueue.map((item) => ({ ...item, audit: [...item.audit] }));

export function listReviewItems(): ReviewItem[] {
  return store;
}

export function getReviewItem(id: string): ReviewItem | undefined {
  return store.find((item) => item.id === id);
}

export function applyReviewAction(
  id: string,
  action: "approved" | "edited_approve" | "rejected",
  reviewer: string,
  editedDraft?: string
): ReviewItem | undefined {
  const item = getReviewItem(id);
  if (!item) return undefined;

  const audit: AuditEvent = {
    reviewer,
    action,
    timestamp: new Date().toISOString(),
    note: action === "edited_approve" ? "Draft edited before approval." : undefined,
  };

  item.status =
    action === "approved" ? "approved" : action === "edited_approve" ? "edited_approved" : "rejected";
  if (editedDraft) item.editedDraft = editedDraft;
  item.audit = [...item.audit, audit];

  return item;
}
