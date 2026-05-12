// Eval layer 1 — structural rubric tests.
// No API key needed. Runs in CI on every push.
//
// Two things this asserts:
//   1. The hand-authored "ideal" cover letters in fixtures.ts PASS the rubric.
//      If they don't, either the rubric is too strict or the fixture is broken.
//   2. Known bad outputs (banned openings, wrong paragraph count, hallucinated
//      proper nouns, markdown) FAIL the rubric. This guards against regressions
//      in the scorer.

import { describe, expect, it } from "vitest";
import {
  COVER_LETTER_FIXTURES,
  buildGroundingCorpus,
} from "@/lib/ai-eval/fixtures";
import { scoreCoverLetter, scoreAnswer } from "@/lib/ai-eval/rubric";

describe("scoreCoverLetter — golden fixtures should pass", () => {
  for (const fixture of COVER_LETTER_FIXTURES) {
    it(`fixture "${fixture.id}" ideal letter passes the rubric`, () => {
      const result = scoreCoverLetter({
        output: fixture.idealCoverLetter,
        groundingCorpus: buildGroundingCorpus(fixture),
        expectedCompany: fixture.context.jobApplication.companyName || undefined,
      });
      if (!result.passed) {
        const failed = result.findings
          .filter((f) => !f.passed)
          .map((f) => `  - ${f.rule}: ${f.detail}`)
          .join("\n");
        throw new Error(
          `Fixture "${fixture.id}" did not pass rubric (${result.score}/${result.total}):\n${failed}`,
        );
      }
      expect(result.passed).toBe(true);
    });
  }
});

describe("scoreCoverLetter — known-bad outputs should fail", () => {
  const corpus = buildGroundingCorpus(COVER_LETTER_FIXTURES[0]);
  const company = COVER_LETTER_FIXTURES[0].context.jobApplication.companyName!;

  it("rejects a letter that opens with a banned phrase", () => {
    const bad =
      "I am writing to express my strong interest in Anthropic.\n\n" +
      "Last summer at Verifica Labs I built an eval harness in Python that ran twelve thousand generations a day across multiple models, persisted results to Postgres, and surfaced a dashboard. The work was technical but the actual job was deciding what good meant for each eval and what to do when the answer wasn't obvious.\n\n" +
      "I'd bring a working mental model and a willingness to do the boring instrumentation work.";
    const result = scoreCoverLetter({ output: bad, groundingCorpus: corpus, expectedCompany: company });
    expect(result.passed).toBe(false);
    expect(result.findings.find((f) => f.rule === "no_banned_openings")?.passed).toBe(false);
  });

  it("rejects a 1-paragraph letter (must be exactly 3)", () => {
    const bad =
      "Anthropic is where I want to work and the Fellows Program is the most direct path. " +
      "Last summer at Verifica Labs I built an eval harness in Python that ran twelve thousand generations a day across multiple models. " +
      "I'd bring a working harness mental model and a willingness to write the boring instrumentation code.";
    const result = scoreCoverLetter({ output: bad, groundingCorpus: corpus, expectedCompany: company });
    expect(result.findings.find((f) => f.rule === "exactly_3_paragraphs")?.passed).toBe(false);
  });

  it("rejects a letter with markdown bullets", () => {
    const bad =
      "Anthropic is the place I want to be.\n\n" +
      "Last summer at Verifica Labs I:\n- built an eval harness in Python\n- ran twelve thousand generations a day\n- pushed results to a dashboard\n\n" +
      "I'd be glad to talk more about it.";
    const result = scoreCoverLetter({ output: bad, groundingCorpus: corpus, expectedCompany: company });
    expect(result.findings.find((f) => f.rule === "no_markdown")?.passed).toBe(false);
  });

  it("rejects a letter with a hallucinated employer", () => {
    const bad =
      "Anthropic's evals work is exactly the work I want to be doing.\n\n" +
      "Last summer at FakeMcFakerson Labs I built an eval harness in Python that ran twelve thousand generations a day across multiple model families. The work taught me to think about what we're actually measuring.\n\n" +
      "I'd bring a working harness mental model and a willingness to write the boring instrumentation.";
    const result = scoreCoverLetter({ output: bad, groundingCorpus: corpus, expectedCompany: company });
    expect(result.findings.find((f) => f.rule === "no_ungrounded_proper_nouns")?.passed).toBe(false);
  });

  it("rejects a letter that uses the banned word 'passionate'", () => {
    const bad =
      "Anthropic is the place I want to work and I am passionate about safety.\n\n" +
      "Last summer at Verifica Labs I built an eval harness in Python that ran twelve thousand generations a day across multiple model families, persisted results to Postgres, and surfaced a dashboard.\n\n" +
      "I'd bring a working harness mental model.";
    const result = scoreCoverLetter({ output: bad, groundingCorpus: corpus, expectedCompany: company });
    expect(result.findings.find((f) => f.rule === "no_banned_words")?.passed).toBe(false);
  });
});

describe("scoreAnswer — basic checks", () => {
  const corpus = ["Valentina Pagliuca", "MPCS", "Verifica Labs", "Python"];
  const question = "Why are you interested in this role?";

  it("accepts a short, grounded answer", () => {
    const ok =
      "Two reasons. The first is that I want to spend a summer doing eval infrastructure work and the team here does it at the scale where the interesting tradeoffs show up. The second is that at Verifica Labs I already built a smaller version of this kind of harness in Python — I know what I don't know about it, which is the right place to be for an intern.";
    const result = scoreAnswer({ output: ok, groundingCorpus: corpus, question });
    if (!result.passed) {
      const failed = result.findings.filter((f) => !f.passed).map((f) => `${f.rule}: ${f.detail}`).join("\n");
      throw new Error(`Expected pass:\n${failed}`);
    }
    expect(result.passed).toBe(true);
  });

  it("flags a banned opening", () => {
    const bad =
      "I am thrilled to apply for this role. I have always wanted to work in AI safety and at Verifica Labs I worked on Python.";
    const result = scoreAnswer({ output: bad, groundingCorpus: corpus, question });
    expect(result.findings.find((f) => f.rule === "no_banned_openings")?.passed).toBe(false);
  });

  it("flags restating the question", () => {
    const bad =
      "Why are you interested in this role? Because I want to do eval work at a place where the scale is interesting, and because I've built a smaller version of this harness already.";
    const result = scoreAnswer({ output: bad, groundingCorpus: corpus, question });
    expect(result.findings.find((f) => f.rule === "does_not_restate_question")?.passed).toBe(false);
  });
});
