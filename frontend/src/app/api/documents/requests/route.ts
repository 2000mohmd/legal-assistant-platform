import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DocumentRequestSummary } from "@/types/documents";

// A client's own submitted requests and what happened to them. Without
// this the intake form was a dead end: submit, see one draft, and never
// be able to look at it again. RLS ("document_requests: owner read")
// scopes this to the signed-in user; the lawyer's decision reaches here
// via the sync trigger in migration 0002, so no lawyer-only table is
// read from the client side.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("document_requests")
    .select(
      "id, situation, desired_conditions, review_status, review_state, delivered_text, conditions, generated_at, reviewed_at"
    )
    .order("generated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests: DocumentRequestSummary[] = data.map((row) => ({
    id: row.id,
    situation: row.situation,
    desiredConditions: row.desired_conditions,
    reviewStatus: row.review_status,
    reviewState: row.review_state,
    deliveredText: row.delivered_text,
    conditions: row.conditions,
    generatedAt: row.generated_at,
    reviewedAt: row.reviewed_at,
  }));

  return NextResponse.json({ requests });
}
