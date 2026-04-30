import type { ApplicationAnswerValues, AnswerBlockKey } from "@/lib/profile";

const rules: Array<{
  block: AnswerBlockKey;
  match: (lower: string) => boolean;
}> = [
  {
    block: "Tell us about yourself",
    match: (q) =>
      /tell us about yourself/.test(q) ||
      /(introduce|introduction).*yourself/.test(q) ||
      /your background/.test(q),
  },
  {
    block: "Why this role?",
    match: (q) =>
      /why.*(this role|this position|this opportunity|interested in this)/.test(
        q,
      ) ||
      /(motivat|excite).*(this role|this position)/.test(q),
  },
  {
    block: "Why this company?",
    match: (q) =>
      /why.*(this company|us|our team|our mission|our product)/.test(q) ||
      /(interested in|drew you to).*(company|team|mission)/.test(q),
  },
  {
    block: "Short intro for applications",
    match: (q) => /short intro|brief intro|elevator pitch/.test(q),
  },
  {
    block: "Behavioral story bank",
    match: (q) =>
      /(challenge|conflict|failure|difficult|describe a time|tell.*about a time|proud of)/.test(
        q,
      ),
  },
  {
    block: "Anything else you want recruiters to know",
    match: (q) =>
      /anything else|additional (info|comments)|is there anything|other things you/.test(
        q,
      ),
  },
];

export function matchProfileAnswer(
  questionText: string,
  applicationAnswers: ApplicationAnswerValues,
): { block: AnswerBlockKey; suggestion: string } | null {
  const lower = questionText.toLowerCase();

  for (const rule of rules) {
    if (!rule.match(lower)) continue;
    const suggestion = applicationAnswers[rule.block]?.trim();
    if (suggestion && suggestion.length > 0) {
      return { block: rule.block, suggestion };
    }
  }

  return null;
}
