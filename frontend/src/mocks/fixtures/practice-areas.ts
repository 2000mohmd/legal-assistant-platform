import type { PracticeArea } from "@/types/practice-area";

// Placeholder list — the partner's full "everything I do as a lawyer" list
// has not been confirmed yet (see root CLAUDE.md Phase 0 DoD). Marriage &
// family law is the only track with a real flow behind it; the rest are
// deliberately generic and locked.
export const practiceAreas: PracticeArea[] = [
  {
    slug: "marriage-family",
    name_ar: "الأحوال الشخصية والزواج",
    name_en: "Marriage & Family Law",
    description_ar: "استشارات وإعداد مستندات لعقود الزواج والأحوال الشخصية.",
    description_en: "Guidance and document assistance for marriage contracts and family matters.",
    status: "live",
    href: "/marriage/chat",
  },
  {
    slug: "commercial-corporate",
    name_ar: "الشركات والأعمال التجارية",
    name_en: "Commercial & Corporate",
    description_ar: "قريباً — قيد التحقق من دقة الإجابات مع المحامين.",
    description_en: "Coming soon — accuracy review with our lawyers is still underway.",
    status: "coming_soon",
  },
  {
    slug: "real-estate",
    name_ar: "العقارات",
    name_en: "Real Estate",
    description_ar: "قريباً — قيد التحقق من دقة الإجابات مع المحامين.",
    description_en: "Coming soon — accuracy review with our lawyers is still underway.",
    status: "coming_soon",
  },
  {
    slug: "labor-employment",
    name_ar: "العمل والعمال",
    name_en: "Labor & Employment",
    description_ar: "قريباً — قيد التحقق من دقة الإجابات مع المحامين.",
    description_en: "Coming soon — accuracy review with our lawyers is still underway.",
    status: "coming_soon",
  },
  {
    slug: "inheritance",
    name_ar: "المواريث",
    name_en: "Inheritance",
    description_ar: "قريباً — قيد التحقق من دقة الإجابات مع المحامين.",
    description_en: "Coming soon — accuracy review with our lawyers is still underway.",
    status: "coming_soon",
  },
];
