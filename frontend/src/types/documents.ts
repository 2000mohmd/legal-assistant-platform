export interface IntakeRequest {
  situation: string;
  desiredConditions: string;
  relevantFacts: string;
}

export type DocumentReviewState = "pending_lawyer_review" | "template_approved";

export interface DraftedCondition {
  title_ar: string;
  title_en: string;
  text_ar: string;
  text_en: string;
}

export interface DraftedDocument {
  id: string;
  reviewState: DocumentReviewState;
  reviewModel: "per_instance" | "template_level";
  conditions: DraftedCondition[];
  generatedAt: string;
}

/** Where a submitted request stands with the reviewing lawyer. Mirrored
 * onto document_requests by the trigger in migration 0002, so the client
 * never reads the lawyer-only review_items table. */
export type RequestReviewStatus = "pending" | "approved" | "edited_approved" | "rejected";

export interface DocumentRequestSummary {
  id: string;
  situation: string;
  desiredConditions: string;
  reviewStatus: RequestReviewStatus;
  reviewState: DocumentReviewState;
  /** Only populated once a lawyer approves — a rejection deliberately
   * delivers nothing rather than showing a draft they declined. */
  deliveredText: string | null;
  conditions: DraftedCondition[];
  generatedAt: string;
  reviewedAt: string | null;
}
