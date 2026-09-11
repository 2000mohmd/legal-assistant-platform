import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapReviewItemRow } from "@/lib/api/review-mapper";

export async function GET(_req: Request, { params }: { params: { itemId: string } }) {
  const supabase = await createClient();

  const [{ data: item, error: itemError }, { data: audit, error: auditError }] = await Promise.all([
    supabase.from("review_items").select("*").eq("id", params.itemId).single(),
    supabase
      .from("audit_events")
      .select("reviewer, action, occurred_at, note")
      .eq("review_item_id", params.itemId),
  ]);

  if (itemError || !item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  return NextResponse.json({ item: mapReviewItemRow(item, audit ?? []) });
}

const STATUS_BY_ACTION = {
  approved: "approved",
  edited_approve: "edited_approved",
  rejected: "rejected",
} as const;

export async function POST(req: Request, { params }: { params: { itemId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "lawyer") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    action: "approved" | "edited_approve" | "rejected";
    editedDraft?: string;
  };

  const { error: updateError } = await supabase
    .from("review_items")
    .update({
      status: STATUS_BY_ACTION[body.action],
      ...(body.editedDraft ? { edited_draft: body.editedDraft } : {}),
    })
    .eq("id", params.itemId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: auditInsertError } = await supabase.from("audit_events").insert({
    review_item_id: params.itemId,
    reviewer: user.email ?? user.id,
    action: body.action,
    note: body.action === "edited_approve" ? "Draft edited before approval." : null,
  });

  if (auditInsertError) {
    return NextResponse.json({ error: auditInsertError.message }, { status: 500 });
  }

  const [{ data: item }, { data: audit }] = await Promise.all([
    supabase.from("review_items").select("*").eq("id", params.itemId).single(),
    supabase
      .from("audit_events")
      .select("reviewer, action, occurred_at, note")
      .eq("review_item_id", params.itemId),
  ]);

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ item: mapReviewItemRow(item, audit ?? []) });
}
