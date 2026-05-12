import { describe, expect, it } from "vitest";
import {
  assembleAnswerPrompt,
  assembleCoverLetterPrompt,
  type PromptContext,
} from "@/lib/ai-prompts";
import {
  emptyApplicationAnswerValues,
  emptyBasicProfileValues,
  emptyIdentityProfileValues,
  type PersistedProfilePayload,
} from "@/lib/profile";
import type { JobApplicationRecord } from "@/lib/job-applications";
import type { ApplicationAnswerRecord } from "@/lib/application-answers";

function makeProfile(
  overrides: Partial<PersistedProfilePayload["basicInfo"]> = {},
): PersistedProfilePayload {
  return {
    basicInfo: {
      ...emptyBasicProfileValues,
      fullName: "Valentina Pagliuca",
      school: "University of Chicago",
      degree: "Master's",
      program: "MPCS",
      graduationDate: "June 2026",
      location: "Chicago, IL",
      linkedinUrl: "https://linkedin.com/in/vp",
      githubUrl: "https://github.com/vp",
      workAuthorization: "Authorized to work in the US",
      ...overrides,
    },
    identityInfo: emptyIdentityProfileValues,
    applicationAnswers: {
      ...emptyApplicationAnswerValues,
      "Tell us about yourself": "Career-changer into SWE.",
    },
  };
}

function makeJob(
  overrides: Partial<JobApplicationRecord> = {},
): JobApplicationRecord {
  return {
    id: "app-1",
    clerkUserId: "user_test",
    companyName: "Stripe",
    jobTitle: "Software Engineer Intern",
    jobUrl: "https://boards.greenhouse.io/stripe/jobs/12345",
    atsType: "greenhouse",
    jobDescription:
      "Stripe is looking for an SWE intern to work on Payments infrastructure in Go and TypeScript.",
    location: "South San Francisco, CA",
    status: "draft",
    appliedAt: null,
    selectedResumeId: null,
    coverLetterDraft: null,
    coverLetterEdited: null,
    coverLetterGeneratedAt: null,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeCalibration(): ApplicationAnswerRecord[] {
  const base = {
    id: "ans",
    applicationId: "app-1",
    clerkUserId: "user_test",
    questionText: null,
    answerDraft: null,
    answerGeneratedAt: null,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
  };
  return [
    {
      ...base,
      id: "a1",
      questionKey: "calibration_why_company",
      content: "I want to work on global payment infra at scale.",
    },
    {
      ...base,
      id: "a2",
      questionKey: "calibration_relevant_experience",
      content: "Built a checkout integration during my internship at Acme.",
    },
    {
      ...base,
      id: "a3",
      questionKey: "calibration_tone",
      content: "Concise, grounded, slightly technical.",
    },
  ];
}

const baseCtx: PromptContext = {
  profile: makeProfile(),
  resumeText:
    "Valentina Pagliuca — MS Computer Science. Built X, Y, Z. Internship at Acme as a SWE.",
  writingSampleTexts: ["Sample writing — short essay about distributed systems."],
  jobApplication: makeJob(),
  calibrationAnswers: makeCalibration(),
};

function fullUser(p: { userStable: string; userVolatile: string }): string {
  return `${p.userStable}\n${p.userVolatile}`;
}

describe("assembleCoverLetterPrompt", () => {
  it("returns the cover-letter system prompt", () => {
    const out = assembleCoverLetterPrompt(baseCtx);
    expect(out.system).toContain("editorial assistant");
    expect(out.system).toContain("3-paragraph cover letter");
  });

  it("puts applicant + resume + writing samples in the stable (cacheable) block", () => {
    const out = assembleCoverLetterPrompt(baseCtx);
    expect(out.userStable).toContain("Valentina Pagliuca");
    expect(out.userStable).toContain("MPCS");
    expect(out.userStable).toContain("Internship at Acme");
    expect(out.userStable).toContain("--- Sample 1 ---");
    expect(out.userStable).toContain("distributed systems");
  });

  it("puts job + calibration + task in the volatile block", () => {
    const out = assembleCoverLetterPrompt(baseCtx);
    expect(out.userVolatile).toContain("Stripe");
    expect(out.userVolatile).toContain("Software Engineer Intern");
    expect(out.userVolatile).toContain("Payments infrastructure");
    expect(out.userVolatile).toContain("global payment infra");
    expect(out.userVolatile).toContain("checkout integration");
    expect(out.userVolatile).toContain("Concise, grounded");
  });

  it("includes the resume text section header", () => {
    const out = assembleCoverLetterPrompt(baseCtx);
    expect(out.userStable).toContain("## Resume (extracted text)");
  });

  it("falls back to a placeholder when resume is missing", () => {
    const out = assembleCoverLetterPrompt({ ...baseCtx, resumeText: null });
    expect(out.userStable).toContain("(no resume on file)");
  });

  it("falls back to a placeholder when no writing samples", () => {
    const out = assembleCoverLetterPrompt({ ...baseCtx, writingSampleTexts: [] });
    expect(out.userStable).toContain("(no writing samples on file)");
  });

  it("volatile block ends with the task line", () => {
    const out = assembleCoverLetterPrompt(baseCtx);
    expect(
      out.userVolatile
        .trimEnd()
        .endsWith(
          "Draft a 3-paragraph cover letter (~250 words) for this role, following the structure in the system prompt. Plain text, no markdown, no greeting, no sign-off.",
        ),
    ).toBe(true);
  });
});

describe("assembleAnswerPrompt", () => {
  const question = {
    key: "why_internship",
    text: "Why are you interested in this internship at Stripe?",
  };

  it("returns the answer system prompt", () => {
    const out = assembleAnswerPrompt({ ...baseCtx, question });
    expect(out.system).toContain("short-answer response");
    expect(out.system).toContain("80-180 words");
  });

  it("puts the question in the volatile block", () => {
    const out = assembleAnswerPrompt({ ...baseCtx, question });
    expect(out.userVolatile).toContain("## The question to answer");
    expect(out.userVolatile).toContain(question.text);
  });

  it("includes resume + calibration + job context across the two blocks", () => {
    const out = assembleAnswerPrompt({ ...baseCtx, question });
    const combined = fullUser(out);
    expect(combined).toContain("Internship at Acme");
    expect(combined).toContain("global payment infra");
    expect(combined).toContain("Stripe");
    expect(combined).toContain("Payments infrastructure");
  });
});
