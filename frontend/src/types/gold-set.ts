// TypeScript mirror of the pydantic GoldSetEntry / Citation schemas in the root CLAUDE.md.
// Keep field names in sync with src/mizan/schemas/gold_set.py once the backend exists.

export type EntryType = "qa" | "document_generation";
export type EntryStatus = "draft" | "in_review" | "approved";
export type Difficulty = "routine" | "moderate" | "high_stakes";
export type ReviewModel = "per_instance" | "template_level" | null;

export interface Citation {
  source_document: string;
  article_or_madda: string;
  quoted_text: string | null;
  /**
   * True for every fixture in src/mocks — fabricated, never real statutory
   * text. Was a `true` literal type (impossible to construct a
   * non-illustrative Citation at all) back when nothing but fixtures could
   * produce one; now `boolean` so a real backend response (see
   * MIZAN_BACKEND_URL in api/chat/route.ts) can set it false. The UI still
   * shows a blanket "Demo data" watermark regardless of this flag — that
   * hasn't been revisited yet because no real backend call has happened
   * outside this machine.
   */
  is_illustrative: boolean;
}

export interface GoldSetEntry {
  id: string;
  practice_area: string;
  entry_type: EntryType;
  question: string;
  answer: string;
  expected_output?: string | null;
  citations: Citation[];
  authored_by: string;
  reviewed_by: string;
  status: EntryStatus;
  difficulty: Difficulty;
  review_model: ReviewModel;
  notes?: string | null;
}
