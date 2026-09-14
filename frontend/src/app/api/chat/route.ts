import { chatAnswers, defaultChatAnswer } from "@/mocks/fixtures/chat-answers";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types/chat";

// Set to call the real Python backend (src/mizan/api) instead of the
// fixture lookup below — see ../../../../README.md's ingestion section for
// how a real corpus gets there. Left unset by default on purpose: even
// once a real corpus exists, root CLAUDE.md's "How to work in this repo"
// gate says no retrieval/generation code runs for a practice area until
// that area's gold set is reviewed — this flag is the literal on/off
// switch for that gate at the frontend boundary, same pattern as
// DOCUMENT_GENERATION_ENABLED in the backend.
const MIZAN_BACKEND_URL = process.env.MIZAN_BACKEND_URL;
// Required once MIZAN_BACKEND_URL is set — the backend fails closed
// without a matching key (see src/mizan/api/security.py), since CORS
// alone doesn't stop a direct server-to-server call once that service is
// reachable at all.
const MIZAN_BACKEND_API_KEY = process.env.MIZAN_BACKEND_API_KEY;

type ResolvedAnswer = Omit<ChatMessage, "role">;

interface RealBackendCitation {
  source_document: string;
  article_or_madda: string;
  quoted_text: string | null;
  result: "passed" | "flagged";
  note: string;
}

interface RealBackendResponse {
  text: string;
  citations: RealBackendCitation[];
  verification: "verified" | "flagged";
  grounded: boolean;
  council_note: string | null;
}

// Demo mode is the ONLY state in which fixture answers are allowed to
// reach a user. Once a real backend is configured, that flag means a real
// corpus and a reviewed gold set exist and the user is being answered for
// real — so a backend failure has to surface as a failure. See the
// comment on resolveViaRealBackend for why falling back was unsafe.
const DEMO_MODE = !MIZAN_BACKEND_URL;

async function resolveViaRealBackend(message: string): Promise<ResolvedAnswer | null> {
  try {
    const res = await fetch(`${MIZAN_BACKEND_URL}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(MIZAN_BACKEND_API_KEY ? { "x-internal-api-key": MIZAN_BACKEND_API_KEY } : {}),
      },
      body: JSON.stringify({ practice_area: "marriage_family", question: message }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as RealBackendResponse;
    return {
      id: `real-${Date.now()}`,
      text: data.text,
      citations: data.citations.map((c) => ({
        source_document: c.source_document,
        article_or_madda: c.article_or_madda,
        quoted_text: c.quoted_text,
        is_illustrative: false,
      })),
      verification: data.verification,
      // Not classified yet, and deliberately not guessed. Which questions
      // are "high-stakes" enough for council mode is a lawyer's call per
      // practice area (root CLAUDE.md, technique #5), not something to
      // infer from keywords here. The backend already accepts a
      // high_stakes flag; this is the seam that will set it once the
      // partner defines the criteria. council_note coming back non-null
      // does mean council mode actually ran, so that much is honest.
      difficulty: data.council_note ? "high_stakes" : "routine",
      councilNote: data.council_note ?? undefined,
    };
  } catch (err) {
    // Returns null so the caller can fail the request. It must NOT fall
    // back to fixtures: those are fabricated illustrative legal content,
    // and this path only runs when a real corpus is configured, so a
    // fallback would render demo text to a real user under a "Citations
    // verified" badge. The backend goes to real trouble to refuse to
    // answer ungrounded questions (see api/routes/chat.py's 503 and its
    // NOT_ENOUGH_CONTEXT refusal); silently substituting fixtures for that
    // refusal threw away the entire guarantee.
    console.error("Real backend call failed:", err);
    return null;
  }
}

function resolveViaFixtures(message: string): ResolvedAnswer {
  const normalized = message.toLowerCase();
  const found = chatAnswers.find((entry) =>
    entry.matchKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );
  const { role: _role, ...answer } = found?.message ?? defaultChatAnswer;
  return answer;
}

// Streams the answer text word-by-word (mock UX preview), then appends a
// metadata sentinel with citations/verification/council-mode info. The
// exchange is persisted for real against the signed-in user
// (chat_sessions/chat_messages, RLS-scoped to auth.uid()) regardless of
// which path produced the answer.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { message } = (await req.json()) as { message: string };

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "empty_message" }, { status: 400 });
  }

  const answer = DEMO_MODE ? resolveViaFixtures(message) : await resolveViaRealBackend(message);

  // Live mode, backend unreachable or erroring. Answer with nothing rather
  // than with something fabricated, and persist nothing — a stored
  // exchange the user never actually received would corrupt their history
  // and any audit trail built on it.
  if (!answer) {
    return Response.json({ error: "assistant_unavailable" }, { status: 503 });
  }

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
        // Lets the UI label demo answers as demo and stop labelling real
        // ones that way. The watermark used to be hardcoded into the page,
        // which is safe today and becomes a lie the moment real answers
        // ship underneath it.
        demo: DEMO_MODE,
      });
      controller.enqueue(encoder.encode(`\n@@META@@${meta}`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
