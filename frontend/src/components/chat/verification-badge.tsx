import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { VerificationState } from "@/types/chat";

export function VerificationBadge({ state }: { state: VerificationState }) {
  const t = useTranslations("chat");

  if (state === "flagged") {
    return (
      <Badge variant="flagged">
        <AlertTriangle size={12} aria-hidden />
        {t("flagged")}
      </Badge>
    );
  }

  return (
    <Badge variant="verified">
      <CheckCircle2 size={12} aria-hidden />
      {t("verified")}
    </Badge>
  );
}
