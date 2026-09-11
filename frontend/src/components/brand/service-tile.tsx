import { Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeArea } from "@/types/practice-area";

export function ServiceTile({ area }: { area: PracticeArea }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const name = locale === "ar" ? area.name_ar : area.name_en;
  const description = locale === "ar" ? area.description_ar : area.description_en;
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  const body = (
    <Card
      className={
        area.status === "live"
          ? "h-full transition-shadow hover:shadow-md"
          : "h-full opacity-80"
      }
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle>{name}</CardTitle>
        {area.status === "coming_soon" && (
          <Badge variant="locked">
            <Lock size={12} aria-hidden />
            {t("comingSoon")}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted">{description}</p>
        {area.status === "live" ? (
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            {t("openService")}
            <ArrowIcon size={15} aria-hidden />
          </span>
        ) : (
          <p className="mt-4 text-xs text-muted">{t("comingSoonNote")}</p>
        )}
      </CardContent>
    </Card>
  );

  if (area.status !== "live" || !area.href) {
    return <div aria-disabled="true">{body}</div>;
  }

  return (
    <Link href={area.href} className="block h-full">
      {body}
    </Link>
  );
}
