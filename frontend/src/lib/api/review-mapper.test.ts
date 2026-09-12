import { describe, expect, it } from "vitest";
import { mapReviewItemRow } from "./review-mapper";

const BASE_ROW = {
  id: "rev-001",
  practice_area: "Marriage & Family Law",
  entry_type: "qa",
  submitted_at: "2026-01-01T10:00:00.000Z",
  difficulty: "routine",
  status: "pending",
  question: "TEST question?",
  ai_draft: "TEST draft answer.",
  edited_draft: null,
  citation_checks: [
    {
      citation: {
        source_document: "TEST-STATUTE",
        article_or_madda: "TEST-ART-1",
        quoted_text: "TEST quote",
        is_illustrative: true as const,
      },
      result: "passed" as const,
      note: "TEST note",
    },
  ],
};

describe("mapReviewItemRow", () => {
  it("maps snake_case DB columns to the camelCase ReviewItem shape", () => {
    const item = mapReviewItemRow(BASE_ROW);

    expect(item).toMatchObject({
      id: "rev-001",
      practiceArea: "Marriage & Family Law",
      entryType: "qa",
      submittedAt: "2026-01-01T10:00:00.000Z",
      aiDraft: "TEST draft answer.",
    });
  });

  it("converts a null edited_draft to undefined", () => {
    expect(mapReviewItemRow(BASE_ROW).editedDraft).toBeUndefined();
  });

  it("preserves a non-null edited_draft", () => {
    const item = mapReviewItemRow({ ...BASE_ROW, edited_draft: "TEST edited text" });
    expect(item.editedDraft).toBe("TEST edited text");
  });

  it("defaults audit to an empty array when omitted", () => {
    expect(mapReviewItemRow(BASE_ROW).audit).toEqual([]);
  });

  it("sorts audit events chronologically regardless of input order", () => {
    const item = mapReviewItemRow(BASE_ROW, [
      { reviewer: "b", action: "approved", occurred_at: "2026-01-02T00:00:00.000Z", note: null },
      { reviewer: "a", action: "submitted", occurred_at: "2026-01-01T00:00:00.000Z", note: null },
    ]);

    expect(item.audit.map((event) => event.reviewer)).toEqual(["a", "b"]);
  });

  it("converts a null audit note to undefined but keeps a real note", () => {
    const item = mapReviewItemRow(BASE_ROW, [
      { reviewer: "a", action: "submitted", occurred_at: "2026-01-01T00:00:00.000Z", note: null },
      {
        reviewer: "b",
        action: "edited_approve",
        occurred_at: "2026-01-02T00:00:00.000Z",
        note: "Draft edited before approval.",
      },
    ]);

    expect(item.audit[0].note).toBeUndefined();
    expect(item.audit[1].note).toBe("Draft edited before approval.");
  });

  it("does not mutate the array passed in for audit events", () => {
    const audit = [
      { reviewer: "b", action: "approved", occurred_at: "2026-01-02T00:00:00.000Z", note: null },
      { reviewer: "a", action: "submitted", occurred_at: "2026-01-01T00:00:00.000Z", note: null },
    ];
    const original = [...audit];

    mapReviewItemRow(BASE_ROW, audit);

    expect(audit).toEqual(original);
  });
});
