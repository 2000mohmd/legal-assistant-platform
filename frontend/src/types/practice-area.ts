export interface PracticeArea {
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  /** Only "live" areas have cleared their own gold set and are clickable. */
  status: "live" | "coming_soon";
  href?: string;
}
