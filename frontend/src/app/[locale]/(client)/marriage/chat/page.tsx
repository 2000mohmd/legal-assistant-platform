"use client";

import { useRef, useState } from "react";
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
  const idRef = useRef(0);

  async function sendMessage(text: string) {
    const userId = `u-${idRef.current++}`;
    const assistantId = `a-${idRef.current++}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: assistantId, role: "assistant", text: "" },
    ]);
    setStreamingId(assistantId);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (!res.body) {
      setStreamingId(null);
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
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: visibleText } : m)));
    }

    const metaIndex = buffer.indexOf(META_SENTINEL);
    if (metaIndex !== -1) {
      const meta = JSON.parse(buffer.slice(metaIndex + META_SENTINEL.length));
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
    }
    setStreamingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="min-h-[20rem] space-y-5 rounded-card border border-line bg-primary-tint/20 p-5">
        {messages.length === 0 && (
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
      </div>

      <div className="mt-4">
        <ChatInput onSend={sendMessage} disabled={Boolean(streamingId)} />
      </div>

      <p className="mt-4">
        <span className="demo-watermark">{common("demoWatermark")}</span>
      </p>
    </div>
  );
}
