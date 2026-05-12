// Structural rubric scorer for JobPilot cover letters and answers.
// Runs deterministically without any API call — used in CI (vitest) and locally.
// Layer 1 of the eval system per advisor feedback (2026-05-12).

export type RubricFinding = {
  rule: string;
  passed: boolean;
  /** Short human-readable reason, present when passed === false. */
  detail?: string;
};

export type RubricResult = {
  passed: boolean;
  findings: RubricFinding[];
  score: number;
  total: number;
};

const BANNED_OPENINGS = [
  "i am writing to express",
  "i am excited to apply",
  "i am thrilled",
  "i would like to be considered",
  "my name is",
];

const BANNED_WORDS = [
  "passionate",
  "passionately",
  "synergy",
];

const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m, // heading
  /^\s*[-*]\s/m, // bullet
  /\*\*[^*]+\*\*/, // bold
  /^\s*\d+\.\s/m, // numbered list
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function paragraphCount(text: string): number {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

export type CoverLetterRubricInput = {
  output: string;
  /** Texts that should be treated as ground truth for grounding checks
   *  (resume, profile reusable answers, job description, calibration answers).
   *  Any proper noun in the output that does NOT appear in this corpus is
   *  flagged as a potential hallucination. */
  groundingCorpus: string[];
  /** Optional company name — must appear at least once if provided. */
  expectedCompany?: string;
};

/** Tokenise a string into ASCII alphanumeric tokens for grounding lookup. */
function tokenize(s: string): Set<string> {
  const tokens = new Set<string>();
  for (const m of s.matchAll(/[A-Za-z][A-Za-z0-9'_-]{1,}/g)) {
    tokens.add(m[0].toLowerCase());
  }
  return tokens;
}

// Words that look like proper nouns but are too common to be useful as
// hallucination signals. Pulled from observation of false positives.
const PROPER_NOUN_STOPLIST = new Set([
  "i",
  "my",
  "we",
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "your",
  "their",
  "your",
  "company",
  "team",
  "role",
  "position",
  "internship",
  "engineer",
  "software",
  "spring",
  "summer",
  "fall",
  "winter",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "us",
  "usa",
]);

function extractCandidateProperNouns(output: string): string[] {
  const out: string[] = [];
  for (const m of output.matchAll(/\b([A-Z][a-zA-Z]{2,})\b/g)) {
    const word = m[1];
    const lower = word.toLowerCase();
    if (PROPER_NOUN_STOPLIST.has(lower)) continue;
    // Skip sentence-initial words: very common to capitalise without being proper nouns.
    const idx = m.index ?? 0;
    const prev = idx === 0 ? "" : output.slice(Math.max(0, idx - 2), idx);
    if (prev === "" || /\.\s$|^\s*$|^\n$|\n\s*$/.test(prev) || idx === 0) continue;
    out.push(word);
  }
  return out;
}

export function scoreCoverLetter(input: CoverLetterRubricInput): RubricResult {
  const { output } = input;
  const findings: RubricFinding[] = [];
  const lower = normalize(output);

  // 1. Word count band (Booth 3-paragraph format target: ~250 words, accept 180-320)
  const wc = wordCount(output);
  findings.push({
    rule: "word_count_180_320",
    passed: wc >= 180 && wc <= 320,
    detail: wc < 180 ? `too short (${wc} words)` : wc > 320 ? `too long (${wc} words)` : undefined,
  });

  // 2. Paragraph count (Booth: exactly 3)
  const pc = paragraphCount(output);
  findings.push({
    rule: "exactly_3_paragraphs",
    passed: pc === 3,
    detail: pc !== 3 ? `${pc} paragraph(s) — expected 3` : undefined,
  });

  // 3. No banned openings
  const firstChunk = lower.slice(0, 200);
  const offendingOpening = BANNED_OPENINGS.find((b) => firstChunk.includes(b));
  findings.push({
    rule: "no_banned_openings",
    passed: !offendingOpening,
    detail: offendingOpening ? `opens with "${offendingOpening}"` : undefined,
  });

  // 4. No banned words anywhere
  const offendingWord = BANNED_WORDS.find((w) =>
    new RegExp(`\\b${w}\\b`, "i").test(output),
  );
  findings.push({
    rule: "no_banned_words",
    passed: !offendingWord,
    detail: offendingWord ? `contains "${offendingWord}"` : undefined,
  });

  // 5. No markdown
  const md = MARKDOWN_PATTERNS.find((p) => p.test(output));
  findings.push({
    rule: "no_markdown",
    passed: !md,
    detail: md ? `contains markdown (${md.source})` : undefined,
  });

  // 6. No greeting / sign-off
  const hasGreeting = /^\s*(dear|hello|hi)\b/i.test(output);
  const hasSignoff = /\b(sincerely|best regards|kind regards|best,|regards,)/i.test(output);
  findings.push({
    rule: "no_greeting",
    passed: !hasGreeting,
    detail: hasGreeting ? "starts with a greeting line" : undefined,
  });
  findings.push({
    rule: "no_signoff",
    passed: !hasSignoff,
    detail: hasSignoff ? "ends with a sign-off" : undefined,
  });

  // 7. Mentions expected company (if provided)
  if (input.expectedCompany) {
    const ok = new RegExp(`\\b${input.expectedCompany}\\b`, "i").test(output);
    findings.push({
      rule: "mentions_company",
      passed: ok,
      detail: ok ? undefined : `never mentions "${input.expectedCompany}"`,
    });
  }

  // 8. Grounding — every proper noun in the output should appear in the corpus.
  // Heuristic: capitalized words not in the stoplist not at sentence start.
  const corpusTokens = new Set<string>();
  for (const text of input.groundingCorpus) {
    for (const t of tokenize(text)) corpusTokens.add(t);
  }
  if (input.expectedCompany) {
    for (const t of tokenize(input.expectedCompany)) corpusTokens.add(t);
  }
  const candidates = extractCandidateProperNouns(output);
  const ungrounded = candidates.filter((w) => !corpusTokens.has(w.toLowerCase()));
  findings.push({
    rule: "no_ungrounded_proper_nouns",
    passed: ungrounded.length === 0,
    detail:
      ungrounded.length > 0
        ? `not in grounding corpus: ${[...new Set(ungrounded)].slice(0, 5).join(", ")}`
        : undefined,
  });

  const score = findings.filter((f) => f.passed).length;
  return {
    passed: score === findings.length,
    findings,
    score,
    total: findings.length,
  };
}

export type AnswerRubricInput = {
  output: string;
  groundingCorpus: string[];
  /** The original question — output must not just restate it. */
  question: string;
};

export function scoreAnswer(input: AnswerRubricInput): RubricResult {
  const { output } = input;
  const findings: RubricFinding[] = [];
  const lower = normalize(output);

  // 1. Word count band 60-220 (slightly wider than system prompt's 80-180)
  const wc = wordCount(output);
  findings.push({
    rule: "word_count_60_220",
    passed: wc >= 60 && wc <= 220,
    detail: wc < 60 ? `too short (${wc} words)` : wc > 220 ? `too long (${wc} words)` : undefined,
  });

  // 2. Paragraph count 1-3
  const pc = paragraphCount(output);
  findings.push({
    rule: "1_to_3_paragraphs",
    passed: pc >= 1 && pc <= 3,
    detail: pc < 1 || pc > 3 ? `${pc} paragraph(s) — expected 1-3` : undefined,
  });

  // 3. Banned openings
  const offendingOpening = BANNED_OPENINGS.find((b) => lower.slice(0, 200).includes(b));
  findings.push({
    rule: "no_banned_openings",
    passed: !offendingOpening,
    detail: offendingOpening ? `opens with "${offendingOpening}"` : undefined,
  });

  // 4. Banned words
  const offendingWord = BANNED_WORDS.find((w) => new RegExp(`\\b${w}\\b`, "i").test(output));
  findings.push({
    rule: "no_banned_words",
    passed: !offendingWord,
    detail: offendingWord ? `contains "${offendingWord}"` : undefined,
  });

  // 5. No markdown
  const md = MARKDOWN_PATTERNS.find((p) => p.test(output));
  findings.push({
    rule: "no_markdown",
    passed: !md,
    detail: md ? `contains markdown` : undefined,
  });

  // 6. Doesn't just restate the question
  const restated = output.trim().toLowerCase().startsWith(input.question.trim().toLowerCase().slice(0, 30));
  findings.push({
    rule: "does_not_restate_question",
    passed: !restated,
    detail: restated ? "output begins by echoing the question" : undefined,
  });

  // 7. Grounding (same logic as cover letter)
  const corpusTokens = new Set<string>();
  for (const text of input.groundingCorpus) {
    for (const t of tokenize(text)) corpusTokens.add(t);
  }
  const candidates = extractCandidateProperNouns(output);
  const ungrounded = candidates.filter((w) => !corpusTokens.has(w.toLowerCase()));
  findings.push({
    rule: "no_ungrounded_proper_nouns",
    passed: ungrounded.length === 0,
    detail:
      ungrounded.length > 0
        ? `not in grounding corpus: ${[...new Set(ungrounded)].slice(0, 5).join(", ")}`
        : undefined,
  });

  const score = findings.filter((f) => f.passed).length;
  return {
    passed: score === findings.length,
    findings,
    score,
    total: findings.length,
  };
}
