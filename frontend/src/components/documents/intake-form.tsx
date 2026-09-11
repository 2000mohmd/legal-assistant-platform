"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { IntakeRequest } from "@/types/documents";

export function IntakeForm({ onSubmit, submitting }: { onSubmit: (data: IntakeRequest) => void; submitting?: boolean }) {
  const t = useTranslations("documents");
  const [form, setForm] = useState<IntakeRequest>({ situation: "", desiredConditions: "", relevantFacts: "" });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="intake-situation" className="mb-1.5 block text-sm font-medium text-ink">
          {t("situationLabel")}
        </label>
        <Textarea
          id="intake-situation"
          value={form.situation}
          onChange={(e) => setForm((f) => ({ ...f, situation: e.target.value }))}
          placeholder={t("situationPlaceholder")}
          rows={3}
          required
        />
      </div>
      <div>
        <label htmlFor="intake-conditions" className="mb-1.5 block text-sm font-medium text-ink">
          {t("conditionsLabel")}
        </label>
        <Textarea
          id="intake-conditions"
          value={form.desiredConditions}
          onChange={(e) => setForm((f) => ({ ...f, desiredConditions: e.target.value }))}
          placeholder={t("conditionsPlaceholder")}
          rows={3}
          required
        />
      </div>
      <div>
        <label htmlFor="intake-facts" className="mb-1.5 block text-sm font-medium text-ink">
          {t("factsLabel")}
        </label>
        <Textarea
          id="intake-facts"
          value={form.relevantFacts}
          onChange={(e) => setForm((f) => ({ ...f, relevantFacts: e.target.value }))}
          placeholder={t("factsPlaceholder")}
          rows={2}
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
