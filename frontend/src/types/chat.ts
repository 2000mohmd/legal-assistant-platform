import type { Citation, Difficulty } from "./gold-set";

export type VerificationState = "verified" | "flagged";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  citations?: Citation[];
  verification?: VerificationState;
  difficulty?: Difficulty;
  councilNote?: string;
}

export interface ChatAnswerFixture {
  matchKeywords: string[];
  message: ChatMessage;
}
