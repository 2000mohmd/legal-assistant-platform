import { diffWords } from "diff";
import { useTranslations } from "next-intl";

export function DiffView({ before, after }: { before: string; after: string }) {
  const t = useTranslations("review");
  const parts = diffWords(before, after);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted">{t("diffTitle")}</p>
      <p className="rounded-lg border border-line bg-white p-3 text-sm leading-relaxed">
        {parts.map((part, i) => {
          if (part.added) {
            return (
              <span key={i} className="rounded bg-primary-tint px-0.5 text-primary">
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span key={i} className="text-muted line-through decoration-muted/60">
                {part.value}
              </span>
            );
          }
          return <span key={i}>{part.value}</span>;
        })}
      </p>
    </div>
  );
}
