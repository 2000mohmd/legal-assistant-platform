"use client";

import { useState, type FormEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatInput({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const t = useTranslations("chat");
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("inputPlaceholder")}
        rows={2}
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            handleSubmit(e);
          }
        }}
      />
      <Button type="submit" disabled={disabled || !value.trim()} aria-label={t("send")}>
        <SendHorizontal size={16} aria-hidden />
      </Button>
    </form>
  );
}
