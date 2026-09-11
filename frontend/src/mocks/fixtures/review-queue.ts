import type { ReviewItem } from "@/types/review";

// All content below is fabricated demo data — see chat-answers.ts for the
// anti-fabrication rule that applies throughout this fixtures directory.
export const reviewQueue: ReviewItem[] = [
  {
    id: "rev-001",
    practiceArea: "Marriage & Family Law",
    entryType: "qa",
    submittedAt: "2026-09-10T09:15:00.000Z",
    difficulty: "routine",
    status: "pending",
    question: "هل يجوز الاتفاق على تأجيل جزء من المهر؟ / Can part of the dowry be deferred?",
    aiDraft:
      "نعم، يجوز الاتفاق على تقسيم المهر إلى معجل ومؤجل، ويُدرج هذا الاتفاق كتابةً ضمن عقد الزواج قبل توثيقه عبر منصة ناجز. يُنصح بتحديد أجل واضح للجزء المؤجل.",
    citationChecks: [
      {
        citation: {
          source_document: "Family Relations Statute (Demo Corpus)",
          article_or_madda: "Art. 9 (sample)",
          quoted_text: "[Illustrative sample — not real statutory language] the dowry may be split between an immediate and a deferred portion by written agreement.",
          is_illustrative: true,
        },
        result: "passed",
        note: "Matches retrieved source text exactly; article exists in corpus.",
      },
    ],
    audit: [
      { reviewer: "system", action: "submitted", timestamp: "2026-09-10T09:15:00.000Z" },
    ],
  },
  {
    id: "rev-002",
    practiceArea: "Marriage & Family Law",
    entryType: "qa",
    submittedAt: "2026-09-10T11:40:00.000Z",
    difficulty: "high_stakes",
    status: "pending",
    question: "من له الحق في حضانة الأطفال بعد الطلاق؟ / Who has custody rights after divorce?",
    aiDraft:
      "تُمنح الحضانة عادة وفق تقدير المحكمة بما يحقق مصلحة الطفل الفضلى، مع مراعاة أي شروط اتُفق عليها ضمن عقد الزواج. يمكن أن تشمل الشروط ترتيبات الزيارة بعد انتهاء فترة الحضانة الأساسية.",
    citationChecks: [
      {
        citation: {
          source_document: "Family Relations Statute (Demo Corpus)",
          article_or_madda: "Art. 22 (sample)",
          quoted_text: "[Illustrative sample — not real statutory language] custody arrangements agreed within the contract are subject to review by the competent court.",
          is_illustrative: true,
        },
        result: "passed",
        note: "Article exists and matches the general framing.",
      },
      {
        citation: {
          source_document: "Family Relations Statute (Demo Corpus)",
          article_or_madda: "Art. 23 (sample)",
          quoted_text: "[Illustrative sample — not real statutory language] post-custody visitation terms follow a separate schedule set by the court.",
          is_illustrative: true,
        },
        result: "flagged",
        note: "Retrieved excerpt does not clearly support the visitation claim in the draft — needs lawyer confirmation.",
      },
    ],
    audit: [
      { reviewer: "system", action: "submitted", timestamp: "2026-09-10T11:40:00.000Z" },
    ],
  },
  {
    id: "rev-003",
    practiceArea: "Marriage & Family Law",
    entryType: "document_generation",
    submittedAt: "2026-09-11T08:05:00.000Z",
    difficulty: "high_stakes",
    status: "pending",
    question: "إعداد شروط عقد زواج مخصصة تتضمن شرط استمرار عمل الزوجة / Draft custom marriage-contract conditions including a wife's-right-to-work clause",
    aiDraft:
      "الشرط المقترح: يحق للزوجة الاستمرار في عملها الحالي بعد الزواج، ولا يجوز للزوج مطالبتها بتركه إلا باتفاق مكتوب لاحق بين الطرفين.",
    citationChecks: [
      {
        citation: {
          source_document: "Family Relations Statute (Demo Corpus)",
          article_or_madda: "Art. 14 (sample)",
          quoted_text: "[Illustrative sample — not real statutory language] any lawful condition agreed by both parties and recorded in the contract is binding.",
          is_illustrative: true,
        },
        result: "passed",
        note: "Supports enforceability of custom conditions generally.",
      },
    ],
    audit: [
      { reviewer: "system", action: "submitted", timestamp: "2026-09-11T08:05:00.000Z" },
    ],
  },
];
