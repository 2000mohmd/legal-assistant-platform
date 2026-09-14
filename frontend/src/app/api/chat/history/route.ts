import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types/chat";

// See the note in api/review/queue/route.ts: Next.js caches GET fetches
// by default and supabase-js reads through that same global fetch, so
// without this the route serves a stale snapshot. Every route that
// returns per-user, RLS-scoped data needs it — a user seeing a cached
// version of their own case status is a correctness bug here, not a
// performance trade-off.
export const dynamic = "force-dynamic";


// Loads the signed-in user's prior conversation. These rows were being
// written since the Supabase migration but never read back, so every
// refresh silently threw the conversation away while the database
// quietly kept it. RLS ("chat_messages: owner read", via the session's
// user_id) scopes this to the caller.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("practice_area", "marriage_family")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ messages: [] });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, body, citations, verification, difficulty, council_note")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages: ChatMessage[] = data.map((row) => ({
    id: row.id,
    role: row.role,
    text: row.body,
    citations: row.citations ?? [],
    verification: row.verification ?? undefined,
    difficulty: row.difficulty ?? undefined,
    councilNote: row.council_note ?? undefined,
  }));

  return NextResponse.json({ messages });
}
