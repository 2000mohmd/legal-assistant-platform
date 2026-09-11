import type { ChatAnswerFixture } from "@/types/chat";
import type { Citation } from "@/types/gold-set";

// IMPORTANT — anti-fabrication rule (root + frontend CLAUDE.md): none of this
// is real Saudi statutory text. The source name, article numbers, and quoted
// text below are all invented for demo purposes only.
function demoCitation(article: string, quote: string): Citation {
  return {
    source_document: "Family Relations Statute (Demo Corpus)",
    article_or_madda: article,
    quoted_text: `[Illustrative sample — not real statutory language] ${quote}`,
    is_illustrative: true,
  };
}

export const chatAnswers: ChatAnswerFixture[] = [
  {
    matchKeywords: ["مهر", "مهور", "dowry", "mahr"],
    message: {
      id: "demo-answer-mahr",
      role: "assistant",
      text:
        "بشكل عام، يوثَّق المهر في عقد الزواج كأحد الشروط الأساسية، ويمكن الاتفاق على دفعه معجلاً أو مؤجلاً أو جزءاً من كل. ننصح بتوثيق أي اتفاق حول المهر كتابةً ضمن العقد قبل توقيعه عبر منصة ناجز.\n\nGenerally, the dowry (mahr) is recorded as a core condition of the marriage contract, and the parties may agree it is paid upfront, deferred, or split. We recommend documenting any mahr agreement in writing within the contract before it is signed via the Najiz platform.",
      citations: [
        demoCitation("Art. 9 (sample)", "the dowry shall be recorded within the marriage contract by written agreement of both parties."),
        demoCitation("Art. 11 (sample)", "a deferred dowry remains an enforceable obligation upon dissolution of the marriage."),
      ],
      verification: "verified",
      difficulty: "routine",
    },
  },
  {
    matchKeywords: ["حضانة", "custody", "أطفال", "children"],
    message: {
      id: "demo-answer-custody",
      role: "assistant",
      text:
        "مسائل الحضانة تُعد من أكثر الشروط تأثيراً على الأطراف، ولذلك من الأفضل أن يُراجعها محامٍ بشكل مباشر قبل اعتمادها. تم تصنيف هذا السؤال كسؤال عالي الأهمية وتمت مطابقته عبر أكثر من نموذج ذكاء اصطناعي (وضع المجلس) لإبراز أي تعارض في الإجابات بدلاً من اختيار إجابة واحدة بصمت.\n\nCustody terms are among the highest-impact conditions in a marriage contract, so we strongly recommend direct lawyer review before relying on them. This question was routed through council mode — checked against multiple frontier models — because it carries real custodial consequence.",
      citations: [
        demoCitation("Art. 22 (sample)", "custody arrangements agreed within the contract are subject to review by the competent court."),
      ],
      verification: "flagged",
      difficulty: "high_stakes",
      councilNote:
        "Two of three demo models agreed on the framing below; one flagged a nuance around post-custody visitation that a lawyer should confirm before this is shown to a client.",
    },
  },
];

export const defaultChatAnswer: ChatAnswerFixture["message"] = {
  id: "demo-answer-default",
  role: "assistant",
  text:
    "هذا مثال توضيحي لإجابة المساعد. في النسخة الحقيقية، سيتم استرجاع النصوص ذات الصلة والتحقق من كل استشهاد آلياً قبل عرضه.\n\nThis is an illustrative assistant answer. In the real system, relevant source text is retrieved and every citation is mechanically verified before being shown.",
  citations: [demoCitation("Art. 4 (sample)", "illustrative placeholder clause used for demonstration only.")],
  verification: "verified",
  difficulty: "routine",
};
