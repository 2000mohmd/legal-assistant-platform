import { chatAnswers, defaultChatAnswer } from "@/mocks/fixtures/chat-answers";
import { createClient } from "@/lib/supabase/server";

// Streams the answer text word-by-word (mock UX preview), then appends a
// metadata sentinel with citations/verification/council-mode info. The
// answer *content* is still fixture-based — no real retrieval/generation
// yet — but the exchange is now persisted for real against the signed-in
// user (chat_sessions/chat_messages, RLS-scoped to auth.uid()).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { message } = (await req.json()) as { message: string };
  const normalized = message.toLowerCase();

  const found = chatAnswers.find((entry) =>
    entry.matchKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );
  const answer = found?.message ?? defaultChatAnswer;

  let { data: session, error: sessionSelectError } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("practice_area", "marriage_family")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionSelectError) console.error("chat_sessions select error:", sessionSelectError);

  if (!session) {
    const { data: newSession, error: sessionInsertError } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, practice_area: "marriage_family" })
      .select("id")
      .single();
    if (sessionInsertError) console.error("chat_sessions insert error:", sessionInsertError);
    session = newSession;
  }

  if (session) {
    const { error: messagesInsertError } = await supabase.from("chat_messages").insert([
      // PostgREST bulk-insert sends an explicit NULL for any key missing
      // from a given row object (rather than deferring to the column
      // default) once the batch's rows have inconsistent keys — citations
      // must be spelled out here too, not omitted, or this row alone
      // violates chat_messages.citations' NOT NULL constraint.
      { session_id: session.id, role: "user", body: message, citations: [] },
      {
        session_id: session.id,
        role: "assistant",
        body: answer.text,
        citations: answer.citations ?? [],
        verification: answer.verification ?? "verified",
        difficulty: answer.difficulty ?? "routine",
        council_note: answer.councilNote ?? null,
      },
    ]);
    if (messagesInsertError) console.error("chat_messages insert error:", messagesInsertError);
  }

  const encoder = new TextEncoder();
  const words = answer.text.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(`${word} `));
        await new Promise((resolve) => setTimeout(resolve, 28));
      }

      const meta = JSON.stringify({
        id: answer.id,
        citations: answer.citations ?? [],
        verification: answer.verification ?? "verified",
        difficulty: answer.difficulty ?? "routine",
        councilNote: answer.councilNote ?? null,
      });
      controller.enqueue(encoder.encode(`\n@@META@@${meta}`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
