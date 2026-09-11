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

  let { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("practice_area", "marriage_family")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, practice_area: "marriage_family" })
      .select("id")
      .single();
    session = newSession;
  }

  if (session) {
    await supabase.from("chat_messages").insert([
      { session_id: session.id, role: "user", body: message },
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
