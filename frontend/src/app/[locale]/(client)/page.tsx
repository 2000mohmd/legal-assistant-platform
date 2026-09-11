"use client";

import { useTranslations } from "next-intl";
import { ServiceTile } from "@/components/brand/service-tile";
import { usePracticeAreas } from "@/lib/api/queries";

export default function HomePage() {
  const t = useTranslations("home");
  const common = useTranslations("common");
  const { data, isLoading } = usePracticeAreas();

  return (
    <div className="container-page py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-serif text-3xl text-ink">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-card border border-line bg-line/20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.practiceAreas.map((area) => (
            <ServiceTile key={area.slug} area={area} />
          ))}
        </div>
      )}

      <p className="mt-10">
        <span className="demo-watermark">{common("demoWatermark")}</span>
      </p>
    </div>
  );
}
