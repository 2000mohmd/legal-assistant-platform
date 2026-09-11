import type { AuditEvent, CitationCheck, ReviewItem } from "@/types/review";

interface ReviewItemRow {
  id: string;
  practice_area: string;
  entry_type: string;
  submitted_at: string;
  difficulty: string;
  status: string;
  question: string;
  ai_draft: string;
  edited_draft: string | null;
  citation_checks: CitationCheck[];
}

interface AuditEventRow {
  reviewer: string;
  action: string;
  occurred_at: string;
  note: string | null;
}

export function mapReviewItemRow(row: ReviewItemRow, audit: AuditEventRow[] = []): ReviewItem {
  return {
    id: row.id,
    practiceArea: row.practice_area,
    entryType: row.entry_type as ReviewItem["entryType"],
    submittedAt: row.submitted_at,
    difficulty: row.difficulty as ReviewItem["difficulty"],
    status: row.status as ReviewItem["status"],
    question: row.question,
    aiDraft: row.ai_draft,
    editedDraft: row.edited_draft ?? undefined,
    citationChecks: row.citation_checks,
    audit: audit
      .slice()
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
      .map((event) => ({
        reviewer: event.reviewer,
        action: event.action as AuditEvent["action"],
        timestamp: event.occurred_at,
        note: event.note ?? undefined,
      })),
  };
}
