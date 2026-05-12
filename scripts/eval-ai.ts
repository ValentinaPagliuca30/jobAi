// Eval layer 2 — golden + LLM-as-judge.
//
// For each fixture in lib/ai-eval/fixtures.ts:
//   1. Assemble the cover-letter prompt
//   2. Call the real Claude API (sonnet-4-6, adaptive thinking, prompt caching)
//   3. Score the output with the structural rubric (layer 1)
//   4. Ask Claude as a JUDGE to compare output vs the hand-authored ideal letter
//      on 4 dimensions: tone match, specificity, grounding, structure (1-5 each)
//   5. Print a scoreboard
//
// Run with:
//   ANTHROPIC_API_KEY=sk-ant-... npm run eval
//
// Cost: ~4 fixtures × (1 cover-letter call + 1 judge call) = ~8 messages.
// At sonnet-4-6 prices, expect well under $0.10 per full run.

import { config as loadDotenv } from "dotenv";
// Load Next.js-style env files: .env.local wins, then .env. The plain
// "dotenv/config" import only reads .env, which is empty in this project.
loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });
import Anthropic from "@anthropic-ai/sdk";
import { assembleCoverLetterPrompt } from "@/lib/ai-prompts";
import {
  COVER_LETTER_FIXTURES,
  buildGroundingCorpus,
  type CoverLetterFixture,
} from "@/lib/ai-eval/fixtures";
import { scoreCoverLetter, type RubricResult } from "@/lib/ai-eval/rubric";

const MODEL = "claude-sonnet-4-6";

type JudgeScore = {
  tone_match: number;
  specificity: number;
  grounding: number;
  structure: number;
  comment: string;
};

type FixtureResult = {
  fixture: CoverLetterFixture;
  generated: string;
  rubric: RubricResult;
  judge: JudgeScore;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
};

function makeClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error(
      "ANTHROPIC_API_KEY is not set. Add it to web/.env.local and re-run.",
    );
    process.exit(1);
  }
  return new Anthropic({ apiKey: key });
}

async function generateCoverLetter(
  client: Anthropic,
  fixture: CoverLetterFixture,
): Promise<{ text: string; usage: FixtureResult["usage"] }> {
  const prompt = assembleCoverLetterPrompt(fixture.context);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: prompt.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt.userStable,
            cache_control: { type: "ephemeral" },
          },
          { type: "text", text: prompt.userVolatile },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return {
    text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
    },
  };
}

const JUDGE_SYSTEM = `You are a strict editorial reviewer. You will see (a) a "candidate" cover letter, (b) a hand-authored "ideal" cover letter for the same applicant + job, and (c) the job description and applicant context.

Rate the candidate on 4 dimensions, integer 1-5:
- tone_match: how well does the candidate match the tone of the ideal? (5 = same register and voice; 1 = totally different)
- specificity: does the candidate use specific, verifiable details from the resume rather than generic claims? (5 = specific concrete examples; 1 = fully generic)
- grounding: are all claims anchored in the applicant's actual resume / profile / job description? (5 = nothing invented; 1 = significant hallucination)
- structure: does it follow the Booth 3-paragraph format described in the system prompt? (5 = clean 3 paragraphs, ~250 words, no greeting or sign-off; 1 = wrong structure)

Output STRICT JSON only — no markdown, no preamble — matching this schema:
{"tone_match": 1-5, "specificity": 1-5, "grounding": 1-5, "structure": 1-5, "comment": "one sentence explaining the lowest score"}`;

async function judgeCandidate(
  client: Anthropic,
  fixture: CoverLetterFixture,
  candidate: string,
): Promise<JudgeScore> {
  const judgeUser = [
    "## Applicant context",
    `Full name: ${fixture.context.profile.basicInfo.fullName}`,
    `School: ${fixture.context.profile.basicInfo.school}, ${fixture.context.profile.basicInfo.program}`,
    "",
    "## Resume",
    fixture.context.resumeText ?? "(none)",
    "",
    "## Job description",
    fixture.context.jobApplication.jobDescription,
    "",
    "## Calibration",
    fixture.context.calibrationAnswers.map((c) => `- ${c.questionKey}: ${c.content}`).join("\n") ||
      "(none provided)",
    "",
    "## IDEAL letter (hand-authored reference)",
    fixture.idealCoverLetter,
    "",
    "## CANDIDATE letter (output of the system under test)",
    candidate,
    "",
    "Rate the candidate. Output JSON only.",
  ].join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content: judgeUser }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // The judge sometimes wraps JSON in code fences despite instructions. Strip them.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as JudgeScore;
    return parsed;
  } catch {
    return {
      tone_match: 0,
      specificity: 0,
      grounding: 0,
      structure: 0,
      comment: `JUDGE_PARSE_FAIL: ${cleaned.slice(0, 200)}`,
    };
  }
}

function printScoreboard(results: FixtureResult[]) {
  console.log("\n=== JobPilot AI Eval — Scoreboard ===\n");
  const header = [
    "fixture".padEnd(36),
    "rubric".padEnd(10),
    "tone",
    "spec",
    "grnd",
    "strc",
    "tokens(in/out/cache_r)",
  ].join(" | ");
  console.log(header);
  console.log("-".repeat(header.length));

  let totalIn = 0;
  let totalOut = 0;
  let totalCache = 0;
  let totalRubric = 0;
  let totalJudge = 0;
  let count = 0;

  for (const r of results) {
    const rubricStr = `${r.rubric.score}/${r.rubric.total}`;
    console.log(
      [
        r.fixture.id.padEnd(36),
        rubricStr.padEnd(10),
        String(r.judge.tone_match),
        String(r.judge.specificity),
        String(r.judge.grounding),
        String(r.judge.structure),
        `${r.usage.inputTokens}/${r.usage.outputTokens}/${r.usage.cacheReadInputTokens}`,
      ].join(" | "),
    );
    totalIn += r.usage.inputTokens + r.usage.cacheCreationInputTokens + r.usage.cacheReadInputTokens;
    totalOut += r.usage.outputTokens;
    totalCache += r.usage.cacheReadInputTokens;
    totalRubric += r.rubric.score / r.rubric.total;
    totalJudge +=
      (r.judge.tone_match + r.judge.specificity + r.judge.grounding + r.judge.structure) / 4;
    count++;
  }

  console.log("");
  console.log(`Average rubric pass rate: ${((totalRubric / count) * 100).toFixed(0)}%`);
  console.log(`Average judge score:      ${(totalJudge / count).toFixed(2)} / 5`);
  console.log(
    `Total tokens:             in=${totalIn} out=${totalOut} cache_hits=${totalCache}`,
  );

  console.log("\n=== Per-fixture findings ===\n");
  for (const r of results) {
    console.log(`--- ${r.fixture.id} ---`);
    const failedRubric = r.rubric.findings.filter((f) => !f.passed);
    if (failedRubric.length > 0) {
      console.log("  Rubric failures:");
      for (const f of failedRubric) console.log(`    - ${f.rule}: ${f.detail}`);
    } else {
      console.log("  Rubric: PASS");
    }
    console.log(`  Judge comment: ${r.judge.comment}`);
    console.log("");
  }
}

async function main() {
  const client = makeClient();
  const results: FixtureResult[] = [];

  for (const fixture of COVER_LETTER_FIXTURES) {
    console.log(`[${fixture.id}] generating...`);
    const { text: generated, usage } = await generateCoverLetter(client, fixture);

    const rubric = scoreCoverLetter({
      output: generated,
      groundingCorpus: buildGroundingCorpus(fixture),
      expectedCompany: fixture.context.jobApplication.companyName || undefined,
    });

    console.log(`[${fixture.id}] judging...`);
    const judge = await judgeCandidate(client, fixture, generated);

    results.push({ fixture, generated, rubric, judge, usage });
  }

  printScoreboard(results);

  if (process.env.EVAL_PRINT_GENERATED === "1") {
    console.log("\n=== Generated outputs ===\n");
    for (const r of results) {
      console.log(`--- ${r.fixture.id} ---\n${r.generated}\n`);
    }
  }
}

main().catch((err) => {
  console.error("eval-ai failed:", err);
  process.exit(1);
});
