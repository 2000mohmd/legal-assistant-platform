import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapReviewItemRow } from "@/lib/api/review-mapper";

// RLS (review_items: lawyer read) enforces access — a non-lawyer or
// signed-out request simply gets an empty list back, not a 403.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("review_items")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data.map((row) => mapReviewItemRow(row)) });
}
