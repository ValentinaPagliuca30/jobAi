// Eval fixtures for JobPilot AI generation.
// Each fixture is a hand-authored persona: a complete PromptContext plus a
// human-curated "ideal" cover letter that follows the Booth 3-paragraph spec.
//
// Used by:
//   - lib/__tests__/ai-eval.test.ts        — structural rubric on stub output
//   - scripts/eval-ai.ts                   — real Claude generation + LLM-as-judge
//
// Adding a fixture: copy an existing one, change profile/resume/job, and write
// a 250-word ideal letter that you'd accept as a final draft.

import {
  emptyApplicationAnswerValues,
  emptyBasicProfileValues,
  emptyIdentityProfileValues,
  type PersistedProfilePayload,
} from "@/lib/profile";
import type { JobApplicationRecord } from "@/lib/job-applications";
import type { ApplicationAnswerRecord } from "@/lib/application-answers";
import type { PromptContext } from "@/lib/ai-prompts";

export type CoverLetterFixture = {
  id: string;
  description: string;
  context: PromptContext;
  idealCoverLetter: string;
};

function ts(): string {
  return "2026-05-12T00:00:00Z";
}

function makeCalibration(values: {
  why: string;
  experience: string;
  tone: string;
}): ApplicationAnswerRecord[] {
  const base = {
    applicationId: "app",
    clerkUserId: "user_test",
    questionText: null,
    answerDraft: null,
    answerGeneratedAt: null,
    createdAt: ts(),
    updatedAt: ts(),
    content: "",
  };
  return [
    {
      ...base,
      id: "c1",
      questionKey: "calibration_why_company",
      content: values.why,
    },
    {
      ...base,
      id: "c2",
      questionKey: "calibration_relevant_experience",
      content: values.experience,
    },
    {
      ...base,
      id: "c3",
      questionKey: "calibration_tone",
      content: values.tone,
    },
  ];
}

function makeProfile(overrides: Partial<PersistedProfilePayload["basicInfo"]>): PersistedProfilePayload {
  return {
    basicInfo: { ...emptyBasicProfileValues, ...overrides },
    identityInfo: emptyIdentityProfileValues,
    applicationAnswers: { ...emptyApplicationAnswerValues },
  };
}

function makeJob(overrides: Partial<JobApplicationRecord>): JobApplicationRecord {
  return {
    id: "app",
    clerkUserId: "user_test",
    companyName: "",
    jobTitle: "",
    jobUrl: "",
    atsType: "greenhouse",
    jobDescription: "",
    location: null,
    status: "draft",
    appliedAt: null,
    selectedResumeId: null,
    coverLetterDraft: null,
    coverLetterEdited: null,
    coverLetterGeneratedAt: null,
    matchRationaleDraft: null,
    matchRationaleGeneratedAt: null,
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixture 1 — Booth-style: strong CS student, applying to Anthropic Fellows
// ---------------------------------------------------------------------------

const fixtureBoothStyleAnthropic: CoverLetterFixture = {
  id: "booth-anthropic-fellows",
  description:
    "Strong UChicago MPCS student applying to Anthropic Fellows Program. " +
    "Calibration is filled in, tone is sincere-technical. The ideal letter " +
    "follows the Booth 3-paragraph format and grounds every claim in the resume.",
  context: {
    profile: makeProfile({
      fullName: "Valentina Pagliuca",
      school: "University of Chicago",
      degree: "Master's",
      program: "MPCS",
      graduationDate: "June 2026",
      location: "Chicago, IL",
      linkedinUrl: "https://linkedin.com/in/valepagliu",
      githubUrl: "https://github.com/valepagliu",
      workAuthorization: "Authorized to work in the US",
    }),
    resumeText: `Valentina Pagliuca
University of Chicago, Master of Science in Computer Science (MPCS), expected June 2026.
Université Bocconi, BSc Economics & Management, 2024.

Experience:
- SWE Intern, Verifica Labs, summer 2025. Built an evaluation harness in Python that ran 12,000 LLM generations per day across 4 model families, persisted results to Postgres, and surfaced a regression dashboard to the research team in Streamlit. Reduced eval turnaround from 2 days to 4 hours.
- Research Assistant, Bocconi AI Safety reading group, 2023-2024. Maintained a weekly reading list and ran 8 sessions on alignment papers.

Projects:
- JobPilot (current). Next.js 16 + Supabase + Clerk app that helps CS students apply to internships. Extracts resume text (pdf-parse, mammoth), assembles structured Claude prompts, and persists per-application drafts.
- Distributed key-value store in Go (course project). Implemented Raft consensus across 5 nodes with leader election and log replication.

Skills: Python, TypeScript, Go, PostgreSQL, Next.js, Anthropic API.`,
    writingSampleTexts: [
      "I wrote about the AI safety reading group at Bocconi for the student newspaper. The piece argued that alignment work is most useful when it's specific — concrete behaviors in concrete systems — and least useful when it stays at the level of general dispositions. I tried to make that point without sounding like I'd read a single paper, which I think is the right register for an undergrad student newspaper.",
    ],
    jobApplication: makeJob({
      companyName: "Anthropic",
      jobTitle: "Anthropic Fellows Program",
      jobUrl: "https://job-boards.greenhouse.io/anthropic/jobs/5023394008",
      jobDescription: `The Anthropic Fellows Program is a 6-month full-time research program for engineers and researchers who want to contribute to AI safety. Fellows work alongside Anthropic researchers on alignment, interpretability, and evaluations.

What you'll do:
- Run experiments on frontier models, including evals and red-teaming.
- Contribute to research artefacts — papers, model cards, internal write-ups.
- Pair with Anthropic researchers on open problems in alignment.

We're looking for:
- Strong software engineering skills, especially in Python.
- Experience running model evaluations or building infrastructure for ML experiments.
- Genuine interest in AI safety — not as a brand, as a problem.

The Fellowship is based in San Francisco or remote. Fellows are paid.`,
      location: "San Francisco, CA (or remote)",
    }),
    calibrationAnswers: makeCalibration({
      why:
        "I want to work on AI safety at a frontier lab. Anthropic's evals and interpretability work is the work I'd be doing anyway in a research direction, and the Fellows Program is the most direct path I've found into that work as an MS student.",
      experience:
        "At Verifica Labs I built an eval harness that ran 12,000 LLM generations a day. The work was technically Python infrastructure but the actual job was figuring out what 'good' meant for each eval — and what to do when the answer was unclear.",
      tone: "Concise, sincere, slightly technical. No hype.",
    }),
  },
  idealCoverLetter:
    "Anthropic's evals and interpretability work is the work I'd be doing anyway, just on smaller models and with worse tooling. The Fellows Program is the most direct path into doing it well, and that's the reason I'm applying.\n\n" +
    "Last summer at Verifica Labs I built an eval harness that ran 12,000 LLM generations a day across four model families. The technical work was Python and Postgres, but the actual job was deciding what 'good' meant for each eval and what to do when the answer wasn't obvious — when a generation was technically correct but unhelpful, or when two graders disagreed for legible reasons. That's the part I want to do at scale: figuring out what we're measuring, not just measuring it. I've also worked through the Raft paper as a course project, which left me less afraid of infrastructure code than I used to be.\n\n" +
    "I'd bring a working eval harness mental model, a willingness to write the boring instrumentation, and the conviction that alignment work is most useful when it's specific. I'd welcome the chance to talk about the experiments I'd most want to run.",
};

// ---------------------------------------------------------------------------
// Fixture 2 — Generic startup intern application, calibration partly filled
// ---------------------------------------------------------------------------

const fixtureStartupBackend: CoverLetterFixture = {
  id: "startup-backend",
  description:
    "Generic backend SWE intern at a Series A fintech. Calibration is partly filled (only 'why company' + 'tone'). Tests that the prompt doesn't invent metrics when the resume is bare.",
  context: {
    profile: makeProfile({
      fullName: "Marco Bianchi",
      school: "Politecnico di Milano",
      degree: "MS",
      program: "Computer Science",
      graduationDate: "December 2026",
      location: "Milan, Italy",
    }),
    resumeText: `Marco Bianchi
Politecnico di Milano, MS Computer Science, expected December 2026.

Experience:
- Teaching Assistant, Algorithms II, fall 2025. Graded weekly problem sets for 40 students.
- Backend intern, small Italian e-commerce startup, summer 2024. Worked on the order-pipeline service in Python and PostgreSQL.

Projects:
- Personal finance tracker in Go (side project). CSV import, double-entry ledger, REST API.

Skills: Python, Go, PostgreSQL, REST APIs.`,
    writingSampleTexts: [],
    jobApplication: makeJob({
      companyName: "Ramp",
      jobTitle: "Backend Software Engineering Intern",
      jobDescription: `Ramp builds spend management software for finance teams. We're hiring backend SWE interns for summer 2026 in NYC or remote.

You'll:
- Ship backend changes to production weekly.
- Work in Python and PostgreSQL on a service-oriented monolith.
- Pair with a senior engineer who'll act as your intern manager.

We don't care about prestige or pedigree. We care that you've built something hard, and that you can talk about it.`,
      location: "New York, NY",
    }),
    calibrationAnswers: makeCalibration({
      why:
        "Ramp is one of the few US fintech companies whose engineering blog I actually read. I want to be at a place where the work is concrete and ships often.",
      experience: "",
      tone: "Direct, no fluff.",
    }),
  },
  idealCoverLetter:
    "I read the Ramp engineering blog for the same reason I picked Politecnico over a more abstract program: I wanted to be near work that ships. Backend, Python, PostgreSQL, weekly cadence — that's the loop I want to be in for a summer, and the posting reads like it was written by the team that would be running it.\n\n" +
    "Last summer I worked on the order-pipeline service at a small Italian e-commerce startup, in Python and PostgreSQL. The team was four engineers, the codebase was a service-oriented monolith, and I shipped real changes weekly — not a side project, real production. On the side I built a personal finance tracker in Go with double-entry accounting and a small REST API, which is the closest I've come to thinking about money problems at the data-model level. Neither of these is glamorous, but both are the kind of work that translates — and the double-entry piece is the part I'd want to ask about first.\n\n" +
    "I'd bring a backend that already knows PostgreSQL, the habit of treating shipping cadence as a feature, and a willingness to ask the basic questions out loud rather than guess. I'd welcome the chance to talk about the order-pipeline service in more detail.",
};

// ---------------------------------------------------------------------------
// Fixture 3 — Role mismatch (frontend role, backend-leaning resume)
// ---------------------------------------------------------------------------

const fixtureRoleMismatch: CoverLetterFixture = {
  id: "role-mismatch-frontend",
  description:
    "Frontend role posted, but applicant's resume is mostly backend. Tests that the prompt finds the real bridge (one Next.js project) rather than fabricating UI experience.",
  context: {
    profile: makeProfile({
      fullName: "Sofia Romano",
      school: "University of Bologna",
      degree: "BS",
      program: "Computer Science",
      graduationDate: "July 2026",
    }),
    resumeText: `Sofia Romano
University of Bologna, BS Computer Science, expected July 2026.

Experience:
- Backend intern, Italian SaaS company, summer 2025. Built a webhook ingestion service in Go that handled ~50k events/day.

Projects:
- Personal site, built in Next.js and Tailwind. Three pages. First time I shipped frontend code I wasn't embarrassed by.
- Implemented a B-tree from scratch in Rust as a university project.

Skills: Go, Rust, SQL, some React/Next.js.`,
    writingSampleTexts: [],
    jobApplication: makeJob({
      companyName: "Linear",
      jobTitle: "Frontend Engineering Intern",
      jobDescription: `Linear is hiring a frontend engineering intern for summer 2026. You'll work on the issue-tracking UI in React and TypeScript.

You'll:
- Implement designs from Figma in React + TypeScript.
- Care about animation and microinteractions.
- Profile and fix UI performance regressions.

We expect you to have shipped at least one real frontend project, and to be able to talk about a UI decision you've made and why.`,
    }),
    calibrationAnswers: makeCalibration({
      why:
        "Linear is the most-loved tool in every engineering team I've talked to. I want to learn what 'feels good' actually means at the implementation level.",
      experience: "My personal site is the only frontend project I'd want to talk about — the rest of my resume is backend.",
      tone: "Honest. Don't oversell.",
    }),
  },
  idealCoverLetter:
    "Linear is the tool that every engineering team I've talked to actually likes, and I want to learn what 'feels good' means at the implementation level. I'm applying knowing my resume is mostly backend — and writing this to make the case anyway.\n\n" +
    "The frontend work I'd want to talk about is my personal site, which I rebuilt in Next.js and Tailwind earlier this year. It's three pages, which sounds small, but it's the first time I've shipped frontend code I wasn't embarrassed by — I cared about line-height, about how the typography held up at small sizes, about a hover state taking 150ms instead of 120. The rest of my work has been backend: at an Italian SaaS company last summer I built a webhook ingestion service in Go handling about 50,000 events a day, and a B-tree in Rust as a course project. Both of those teach you what 'fast' actually means, which is what I'd want to bring to the UI performance work in the posting.\n\n" +
    "I'd bring a backend's intuition for what's expensive and a designer's-eye-in-training for what's worth the cost. I'd welcome a conversation about the project.",
};

// ---------------------------------------------------------------------------
// Fixture 4 — Sparse resume + no calibration (hardest case for grounding)
// ---------------------------------------------------------------------------

const fixtureSparseResume: CoverLetterFixture = {
  id: "sparse-resume-no-calibration",
  description:
    "Bare-minimum resume, NO calibration filled in. Tests that the prompt produces something passable instead of fabricating projects or metrics.",
  context: {
    profile: makeProfile({
      fullName: "Alex Chen",
      school: "UIC",
      degree: "BS",
      program: "Computer Science",
      graduationDate: "May 2026",
    }),
    resumeText: `Alex Chen
University of Illinois Chicago, BS Computer Science, expected May 2026.

Coursework: Data Structures, Algorithms, Operating Systems, Databases.

Projects:
- Inventory tracker (course project). Python + SQLite. CSV import, basic queries.

Skills: Python, SQL.`,
    writingSampleTexts: [],
    jobApplication: makeJob({
      companyName: "Klaviyo",
      jobTitle: "Software Engineering Intern",
      jobDescription: `Klaviyo is hiring SWE interns for summer 2026 in Boston or remote. You'll work on a team that ships marketing automation infrastructure used by 100k+ businesses.

Expectations:
- Comfortable with Python or another backend language.
- Have built something end-to-end, even if small.
- Curious about systems at scale.`,
    }),
    calibrationAnswers: [], // intentionally empty
  },
  idealCoverLetter:
    "Klaviyo is the kind of place I'd want to do my first real software job: a backend team shipping infrastructure used by a lot of businesses at once. The posting asks for someone who's built something end-to-end and is curious about scale — both of which are honest to where I am right now.\n\n" +
    "The end-to-end project I have is an inventory tracker I wrote for a Databases course at UIC. It's small: Python and SQLite, CSV import, a few queries. It's also the first time I owned a piece of software from schema to query, and the part I learned the most from was deciding what to denormalise and what to leave alone — the moment where the abstract Databases material started touching real decisions. I'd want to bring that same instinct to a bigger codebase: read carefully, ask why, and write the version that doesn't need to be rewritten in three months.\n\n" +
    "I'd bring solid fundamentals in Python and SQL, a willingness to learn the parts I don't know yet, and a Databases professor I could ask for a reference. Happy to talk about the project.",
};

export const COVER_LETTER_FIXTURES: CoverLetterFixture[] = [
  fixtureBoothStyleAnthropic,
  fixtureStartupBackend,
  fixtureRoleMismatch,
  fixtureSparseResume,
];

/** Build the grounding corpus (texts the output must stay anchored in) for a fixture. */
export function buildGroundingCorpus(fixture: CoverLetterFixture): string[] {
  const corpus: string[] = [];
  const p = fixture.context.profile;
  corpus.push(p.basicInfo.fullName || "");
  corpus.push(p.basicInfo.school || "");
  corpus.push(p.basicInfo.program || "");
  corpus.push(p.basicInfo.degree || "");
  for (const [k, v] of Object.entries(p.applicationAnswers)) {
    if (v) corpus.push(`${k} ${v}`);
  }
  if (fixture.context.resumeText) corpus.push(fixture.context.resumeText);
  for (const t of fixture.context.writingSampleTexts) corpus.push(t);
  corpus.push(fixture.context.jobApplication.companyName || "");
  corpus.push(fixture.context.jobApplication.jobTitle || "");
  corpus.push(fixture.context.jobApplication.jobDescription || "");
  for (const c of fixture.context.calibrationAnswers) corpus.push(c.content);
  return corpus.filter(Boolean);
}
