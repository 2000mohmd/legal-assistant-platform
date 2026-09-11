import type { Citation, Difficulty, EntryType } from "./gold-set";

export type CitationCheckResult = "passed" | "flagged";

export interface CitationCheck {
  citation: Citation;
  result: CitationCheckResult;
  note: string;
}

export type ReviewItemStatus = "pending" | "approved" | "edited_approved" | "rejected";

export interface AuditEvent {
  reviewer: string;
  action: "approved" | "edited_approve" | "rejected" | "submitted";
  timestamp: string;
  note?: string;
}

export interface ReviewItem {
  id: string;
  practiceArea: string;
  entryType: EntryType;
  submittedAt: string;
  difficulty: Difficulty;
  status: ReviewItemStatus;
  question: string;
  aiDraft: string;
  editedDraft?: string;
  citationChecks: CitationCheck[];
  audit: AuditEvent[];
}
