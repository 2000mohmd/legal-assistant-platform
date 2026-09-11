import { NextResponse } from "next/server";
import { sampleDraftedConditions } from "@/mocks/fixtures/document-conditions";
import type { DraftedDocument } from "@/types/documents";

// Regulatory gate (root CLAUDE.md): document generation is disabled-by-default
// for unreviewed public delivery until the partner's licensing confirmation
// lands. This mock always returns "pending_lawyer_review" as the real
// default; "template_approved" only exists as an explicitly-labeled demo
// preview state toggled client-side, never returned by this endpoint.
export async function POST() {
  const draft: DraftedDocument = {
    id: `demo-draft-${Date.now()}`,
    reviewState: "pending_lawyer_review",
    reviewModel: "per_instance",
    conditions: sampleDraftedConditions,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ draft });
}
