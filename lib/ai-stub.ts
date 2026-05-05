// V2 placeholder generator. V3 replaces the body of `generateStub` with a real
// Anthropic API call using the same `prompt` argument (see web/lib/ai-prompts.ts).

import type { AssembledPrompt } from "@/lib/ai-prompts";

export type StubMeta = {
  applicantName?: string;
  company?: string;
  role?: string;
  resumeChars?: number;
  writingSampleCount?: number;
  calibrationFilled?: number;
};

export function generateStub(
  promptName: string,
  prompt: AssembledPrompt,
  meta: StubMeta = {},
): string {
  // V2: log assembled prompt so it can be reviewed (Vercel Function logs, local dev,
  // or pasted into the free claude.ai web UI for prompt validation before paying for tokens).
  // Set LOG_AI_PROMPTS="false" to silence. V3 will gate this on a debug flag.
  if (process.env.LOG_AI_PROMPTS !== "false") {
    console.log(
      `[ai-stub] ${promptName} prompt assembled (system ${prompt.system.length} chars, user ${prompt.user.length} chars)`,
    );
    console.log("--- system ---");
    console.log(prompt.system);
    console.log("--- user ---");
    console.log(prompt.user);
    console.log("--- end prompt ---");
  }

  const lines = [
    `[V2 placeholder draft — ${promptName}]`,
    "",
    "V3 will replace this text with a real Claude generation. The full prompt that",
    "would be sent to the model has been logged to the server console for review.",
    "",
    "Context the model would receive:",
    meta.applicantName ? `  • Applicant: ${meta.applicantName}` : null,
    meta.company || meta.role
      ? `  • Job: ${[meta.company, meta.role].filter(Boolean).join(" · ")}`
      : null,
    typeof meta.resumeChars === "number"
      ? `  • Resume length: ${meta.resumeChars.toLocaleString()} chars`
      : null,
    typeof meta.writingSampleCount === "number"
      ? `  • Writing samples on file: ${meta.writingSampleCount}`
      : null,
    typeof meta.calibrationFilled === "number"
      ? `  • Calibration questions answered: ${meta.calibrationFilled}/3`
      : null,
    "",
    "Edit this text freely — your edits save to the database. Once an Anthropic",
    "API key is configured in V3, this same button will return a tailored draft",
    "in your voice based on the inputs above.",
  ].filter((l): l is string => l !== null);

  return lines.join("\n");
}
