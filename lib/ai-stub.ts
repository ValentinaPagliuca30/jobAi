// Fallback generator used when ANTHROPIC_API_KEY is not configured, or when a
// real Claude call fails. V3 prefers web/lib/ai-client.ts when the key is set.

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
  const fullUser = `${prompt.userStable}\n${prompt.userVolatile}`;
  if (process.env.LOG_AI_PROMPTS !== "false") {
    console.log(
      `[ai-stub] ${promptName} prompt assembled (system ${prompt.system.length} chars, user ${fullUser.length} chars)`,
    );
    console.log("--- system ---");
    console.log(prompt.system);
    console.log("--- user ---");
    console.log(fullUser);
    console.log("--- end prompt ---");
  }

  const lines = [
    `[placeholder draft — ${promptName}]`,
    "",
    "ANTHROPIC_API_KEY is not configured (or the API call failed). The full prompt",
    "that would be sent to the model has been logged to the server console for review.",
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
    "API key is configured (ANTHROPIC_API_KEY in .env.local), this same button will",
    "return a tailored draft in your voice based on the inputs above.",
  ].filter((l): l is string => l !== null);

  return lines.join("\n");
}
