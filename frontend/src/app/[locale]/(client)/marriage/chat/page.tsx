"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import type { ChatMessage } from "@/types/chat";

const META_SENTINEL = "\n@@META@@";

export default function MarriageChatPage() {
  const t = useTranslations("chat");
  const common = useTranslations("common");
  const sampleQuestions = t.raw("sampleQuestions") as string[];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Whether the answers on screen are fixture content. Driven by the
  // server's meta rather than hardcoded, so the "demo data" watermark
  // disappears on its own once real answers are being served — a
  // hardcoded one would go from reassuring to actively misleading.
  const [isDemo, setIsDemo] = useState(true);
  const idRef = useRef(0);

  // The conversation was already being persisted; it just was never read
  // back, so a refresh looked like it had been thrown away.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat/history")
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data: { messages: ChatMessage[] }) => {
        if (!cancelled && data.messages.length > 0) setMessages(data.messages);
      })
      .catch(() => {
        // History is an enhancement, not a prerequisite for chatting —
        // a failure here must not block the input.
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Every failure path here removes the empty assistant bubble and shows a
   * plain-language reason instead. Previously a non-OK response either
   * left a permanently blank bubble or — for a 401, whose body is the
   * literal text "Unauthorized" — streamed that word into the chat as if
   * the assistant had said it.
   */
  function failWith(assistantId: string, reason: string) {
    setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    setError(reason);
  }

  async function sendMessage(text: string) {
    const userId = `u-${idRef.current++}`;
    const assistantId = `a-${idRef.current++}`;
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: assistantId, role: "assistant", text: "" },
    ]);
    setStreamingId(assistantId);

    // finally, not a trailing call: an exception anywhere below used to
    // leave streamingId set forever, which disables the input — a thrown
    // JSON.parse on a truncated stream locked the user out of their own
    // conversation with no way back except a reload.
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        failWith(
          assistantId,
          res.status === 401 ? t("errorSignedOut") : t("errorUnavailable")
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const metaIndex = buffer.indexOf(META_SENTINEL);
        const visibleText = metaIndex === -1 ? buffer : buffer.slice(0, metaIndex);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: visibleText } : m))
        );
      }

      const metaIndex = buffer.indexOf(META_SENTINEL);
      if (metaIndex === -1) {
        // The stream ended without its metadata sentinel, so the answer is
        // truncated and its citations never arrived. Showing partial legal
        // guidance stripped of the sources it depends on is worse than
        // showing nothing.
        failWith(assistantId, t("errorUnavailable"));
        return;
      }

      const meta = JSON.parse(buffer.slice(metaIndex + META_SENTINEL.length));
      setIsDemo(Boolean(meta.demo));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: buffer.slice(0, metaIndex),
                citations: meta.citations,
                verification: meta.verification,
                difficulty: meta.difficulty,
                councilNote: meta.councilNote,
              }
            : m
        )
      );
    } catch {
      failWith(assistantId, t("errorUnavailable"));
    } finally {
      setStreamingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="min-h-[20rem] space-y-5 rounded-card border border-line bg-primary-tint/20 p-5">
        {/* Held back until history resolves, so a returning user doesn't
            see starter prompts flash before their own conversation. */}
        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs text-body hover:bg-primary-tint"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <ChatMessageBubble key={m.id} message={m} streaming={m.id === streamingId} />
        ))}

        {/* Gold, not red — the project's convention throughout: a caution
            state in a legal product shouldn't read as alarm. */}
        {error && (
          <p
            role="status"
            className="rounded-card border border-accent/40 bg-accent-tint px-4 py-3 text-sm text-body"
          >
            {error}
          </p>
        )}
      </div>

      <div className="mt-4">
        <ChatInput onSend={sendMessage} disabled={Boolean(streamingId)} />
      </div>

      {isDemo && (
        <p className="mt-4">
          <span className="demo-watermark">{common("demoWatermark")}</span>
        </p>
      )}
    </div>
  );
}
