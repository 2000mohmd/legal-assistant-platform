import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AuditEvent } from "@/types/review";

export function AuditTrail({ events }: { events: AuditEvent[] }) {
  const t = useTranslations("review");

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
        <History size={13} aria-hidden />
        {t("auditTitle")}
      </p>
      <ul className="space-y-2">
        {events.map((event, i) => (
          <li key={i} className="rounded-lg border border-line bg-white p-2.5 text-xs text-muted">
            <span className="font-medium text-ink">{event.reviewer}</span> — {event.action}{" "}
            <bdi dir="ltr">{new Date(event.timestamp).toLocaleString()}</bdi>
            {event.note && <p className="mt-1">{event.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
