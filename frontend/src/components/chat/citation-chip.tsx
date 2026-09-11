"use client";

import { BookMarked } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Citation } from "@/types/gold-set";

export function CitationChip({ citation }: { citation: Citation }) {
  const t = useTranslations("chat");
  const common = useTranslations("common");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-tint px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <BookMarked size={12} aria-hidden />
          <bdi dir="ltr">{citation.article_or_madda}</bdi>
          <span>· {citation.source_document}</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-serif text-lg text-ink">
          <bdi dir="ltr">{citation.article_or_madda}</bdi> — {citation.source_document}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="mt-3 space-y-3 text-sm text-body">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("expandSource")}</p>
            <p className="rounded-lg bg-primary-tint/60 p-3 text-body">{citation.quoted_text}</p>
            <p className="demo-watermark">{common("demoWatermark")}</p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
