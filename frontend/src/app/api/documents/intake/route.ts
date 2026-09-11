import { NextResponse } from "next/server";
import { sampleDraftedConditions } from "@/mocks/fixtures/document-conditions";
import { createClient } from "@/lib/supabase/server";
import type { DraftedDocument, IntakeRequest } from "@/types/documents";

// Regulatory gate (root CLAUDE.md): document generation is disabled-by-default
// for unreviewed public delivery until the partner's licensing confirmation
// lands. This always persists + returns "pending_lawyer_review" as the real
// default; "template_approved" only exists as an explicitly-labeled demo
// preview state toggled client-side, never returned by this endpoint. The
// drafted *content* is still fixture-based — only the intake request and
// its draft are now really persisted, per the signed-in user.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const intake = (await req.json()) as IntakeRequest;

  const { data: row, error } = await supabase
    .from("document_requests")
    .insert({
      user_id: user.id,
      situation: intake.situation,
      desired_conditions: intake.desiredConditions,
      relevant_facts: intake.relevantFacts ?? null,
      review_state: "pending_lawyer_review",
      review_model: "per_instance",
      conditions: sampleDraftedConditions,
    })
    .select("id, review_state, review_model, conditions, generated_at")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  }

  const draft: DraftedDocument = {
    id: row.id,
    reviewState: row.review_state,
    reviewModel: row.review_model,
    conditions: row.conditions,
    generatedAt: row.generated_at,
  };

  return NextResponse.json({ draft });
}
