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
