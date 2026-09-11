import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CitationChip } from "./citation-chip";
import { VerificationBadge } from "./verification-badge";
import { HighStakesBanner } from "./high-stakes-banner";
import type { ChatMessage as ChatMessageT } from "@/types/chat";

export function ChatMessageBubble({ message, streaming }: { message: ChatMessageT; streaming?: boolean }) {
  const t = useTranslations("chat");
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] space-y-2.5 sm:max-w-[70%]", isUser && "items-end")}>
        <span className="text-xs font-medium text-muted">{isUser ? t("you") : t("assistant")}</span>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
            isUser ? "bg-primary text-white" : "border border-line bg-white text-body"
          )}
        >
          {message.text}
          {streaming && <span className="ms-1 inline-block animate-pulse">▍</span>}
        </div>

        {!isUser && !streaming && message.difficulty === "high_stakes" && (
          <HighStakesBanner councilNote={message.councilNote} />
        )}

        {!isUser && !streaming && message.verification && (
          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge state={message.verification} />
          </div>
        )}

        {!isUser && !streaming && message.citations && message.citations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted">{t("citationsLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, i) => (
                <CitationChip key={i} citation={citation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
