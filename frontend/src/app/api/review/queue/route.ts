import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapReviewItemRow } from "@/lib/api/review-mapper";

// REQUIRED, not defensive. Next.js patches global fetch and caches GET
// requests by default in the App Router, and supabase-js issues its
// PostgREST reads through that same global fetch — so this route was
// serving a cached snapshot of the queue. Caught live: the queue showed
// rows frozen ~65s in the past and simply omitted every request submitted
// since, which for this route means a lawyer never sees a client's
// submission. The client->lawyer->client loop silently disconnecting is
// the exact failure migration 0002 and review-loop.spec.ts exist to
// prevent, and caching reintroduced it one layer up.
export const dynamic = "force-dynamic";

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
