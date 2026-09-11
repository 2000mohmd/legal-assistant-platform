import { chatAnswers, defaultChatAnswer } from "@/mocks/fixtures/chat-answers";

// Mock streaming endpoint: streams the answer text word-by-word with a small
// delay to preview the real streaming UX, then appends a metadata sentinel
// carrying citations/verification/council-mode info for the client to parse.
export async function POST(req: Request) {
  const { message } = (await req.json()) as { message: string };
  const normalized = message.toLowerCase();

  const found = chatAnswers.find((entry) =>
    entry.matchKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );
  const answer = found?.message ?? defaultChatAnswer;

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
