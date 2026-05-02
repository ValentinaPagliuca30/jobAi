// Pure prompt-assembly functions. V2 feeds the assembled prompts into a stub
// generator (web/lib/ai-stub.ts). V3 will swap the stub for a real Anthropic
// call with the same prompt objects — no contract change required.

import type { ApplicationAnswerRecord } from "@/lib/application-answers";
import type { JobApplicationRecord } from "@/lib/job-applications";
import type { PersistedProfilePayload } from "@/lib/profile";

export type AssembledPrompt = {
  system: string;
  user: string;
};

export type PromptContext = {
  profile: PersistedProfilePayload;
  resumeText: string | null;
  writingSampleTexts: string[];
  jobApplication: JobApplicationRecord;
  calibrationAnswers: ApplicationAnswerRecord[];
};

const COVER_LETTER_SYSTEM = `You are JobPilot, an editorial assistant for software engineering students applying to internships and new-grad roles.

Your job is to draft a tailored, ~250-word cover letter that:
- Sounds like the applicant, anchored on their resume and prior writing samples.
- References one or two concrete details from the job description.
- Avoids generic AI phrasing ("I am writing to express my strong interest in...").
- Stays grounded — no invented projects, titles, or metrics.
- Leaves the closing intentionally light so the user can sign off.

Output: plain text. No markdown, no preamble, no bullet points. The user will edit before sending.`;

const ANSWER_SYSTEM = `You are JobPilot, drafting a single short-answer response for a software engineering job application.

Your job is to write 1-3 short paragraphs (target 80-180 words unless the question implies a longer answer) that:
- Directly answer the question being asked.
- Pull specific details from the applicant's resume and reusable profile answers when relevant.
- Use the tone the applicant requested in their calibration answers.
- Avoid invented facts.

Output: plain text only. No markdown headings, no preamble.`;

function joinNonEmpty(lines: ReadonlyArray<string | null | undefined>): string {
  return lines.filter((l): l is string => Boolean(l && l.trim())).join("\n");
}

function profileSummary(profile: PersistedProfilePayload): string {
  const b = profile.basicInfo;
  return joinNonEmpty([
    b.fullName ? `Name: ${b.fullName}` : null,
    b.school || b.program || b.degree
      ? `Education: ${[b.degree, b.program, b.school].filter(Boolean).join(", ")}`
      : null,
    b.graduationDate ? `Graduation: ${b.graduationDate}` : null,
    b.location ? `Location: ${b.location}` : null,
    b.workAuthorization ? `Work auth: ${b.workAuthorization}` : null,
    b.linkedinUrl ? `LinkedIn: ${b.linkedinUrl}` : null,
    b.githubUrl ? `GitHub: ${b.githubUrl}` : null,
    b.portfolioUrl ? `Portfolio: ${b.portfolioUrl}` : null,
  ]);
}

function reusableAnswers(profile: PersistedProfilePayload): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(profile.applicationAnswers)) {
    if (value && value.trim()) {
      lines.push(`### ${key}\n${value.trim()}`);
    }
  }
  return lines.join("\n\n");
}

function calibrationBlock(answers: ApplicationAnswerRecord[]): string {
  const labelByKey: Record<string, string> = {
    calibration_why_company: "Why this company matters to me",
    calibration_relevant_experience: "Most relevant experience for this role",
    calibration_tone: "Tone the draft should lean toward",
  };
  const filled = answers
    .filter(
      (a) => a.questionKey.startsWith("calibration_") && a.content.trim() !== "",
    )
    .map(
      (a) =>
        `### ${labelByKey[a.questionKey] ?? a.questionKey}\n${a.content.trim()}`,
    );
  if (filled.length === 0) {
    return "(none provided — keep the draft general but grounded in the resume)";
  }
  return filled.join("\n\n");
}

function writingSamplesBlock(texts: string[]): string {
  if (texts.length === 0) return "(no writing samples on file)";
  return texts
    .map((text, i) => `--- Sample ${i + 1} ---\n${truncate(text, 4000)}`)
    .join("\n\n");
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n[…truncated]`;
}

function jobBlock(job: JobApplicationRecord): string {
  return joinNonEmpty([
    `Company: ${job.companyName || "(unknown)"}`,
    `Role: ${job.jobTitle || "(unknown)"}`,
    job.location ? `Location: ${job.location}` : null,
    job.atsType ? `ATS: ${job.atsType}` : null,
    "",
    "Job description:",
    truncate(job.jobDescription || "(not captured)", 8000),
  ]);
}

export function assembleCoverLetterPrompt(ctx: PromptContext): AssembledPrompt {
  const sections = [
    "## Applicant profile",
    profileSummary(ctx.profile) || "(profile is empty)",
    "",
    "## Resume (extracted text)",
    ctx.resumeText ? truncate(ctx.resumeText, 12000) : "(no resume on file)",
    "",
    "## Reusable answers from profile",
    reusableAnswers(ctx.profile) || "(none)",
    "",
    "## Writing samples (anchor for tone)",
    writingSamplesBlock(ctx.writingSampleTexts),
    "",
    "## Calibration answers for this application",
    calibrationBlock(ctx.calibrationAnswers),
    "",
    "## The job",
    jobBlock(ctx.jobApplication),
    "",
    "## Task",
    "Draft a ~250-word cover letter for this role. Plain text. No markdown.",
  ];
  return { system: COVER_LETTER_SYSTEM, user: sections.join("\n") };
}

export function assembleAnswerPrompt(
  ctx: PromptContext & { question: { text: string; key: string } },
): AssembledPrompt {
  const sections = [
    "## Applicant profile",
    profileSummary(ctx.profile) || "(profile is empty)",
    "",
    "## Resume (extracted text)",
    ctx.resumeText ? truncate(ctx.resumeText, 12000) : "(no resume on file)",
    "",
    "## Reusable answers from profile",
    reusableAnswers(ctx.profile) || "(none)",
    "",
    "## Writing samples (anchor for tone)",
    writingSamplesBlock(ctx.writingSampleTexts),
    "",
    "## Calibration answers for this application",
    calibrationBlock(ctx.calibrationAnswers),
    "",
    "## The job",
    jobBlock(ctx.jobApplication),
    "",
    "## The question to answer",
    ctx.question.text,
    "",
    "## Task",
    "Draft a single response to the question above. Plain text. No markdown.",
  ];
  return { system: ANSWER_SYSTEM, user: sections.join("\n") };
}
