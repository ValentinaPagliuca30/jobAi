import { parseJobPostingUrl } from "@/lib/job-url";

export type ScrapedQuestion = {
  sourceQuestionId: string | null;
  position: number;
  questionText: string;
  questionType: string | null;
  required: boolean;
  options: ReadonlyArray<{ label: string; value: string | number }> | null;
  atsMetadata: Record<string, unknown> | null;
};

export type ScrapedPosting = {
  title: string | null;
  companyName: string | null;
  location: string | null;
  content: string;
  questions: ScrapedQuestion[];
};

type GreenhouseField = {
  name: string;
  type: string;
  values?: ReadonlyArray<{ label: string; value: string | number }>;
};

type GreenhouseQuestion = {
  label: string;
  required?: boolean;
  fields?: ReadonlyArray<GreenhouseField>;
};

type GreenhouseJobPayload = {
  title?: string;
  content?: string;
  location?: { name?: string };
  questions?: ReadonlyArray<GreenhouseQuestion>;
  compliance?: ReadonlyArray<{ questions?: ReadonlyArray<GreenhouseQuestion> }>;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    );
}

function htmlToText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

function flattenGreenhouseQuestions(
  payload: GreenhouseJobPayload,
): GreenhouseQuestion[] {
  const all: GreenhouseQuestion[] = [];
  for (const q of payload.questions ?? []) {
    all.push(q);
  }
  for (const block of payload.compliance ?? []) {
    for (const q of block.questions ?? []) {
      all.push(q);
    }
  }
  return all;
}

function mapGreenhouseQuestion(
  question: GreenhouseQuestion,
  index: number,
): ScrapedQuestion {
  const firstField = question.fields?.[0];
  return {
    sourceQuestionId: firstField?.name ?? null,
    position: index,
    questionText: question.label,
    questionType: firstField?.type ?? null,
    required: Boolean(question.required),
    options: firstField?.values
      ? firstField.values.map((v) => ({ label: v.label, value: v.value }))
      : null,
    atsMetadata: { fields: question.fields ?? [] },
  };
}

export async function fetchGreenhousePosting(input: {
  companyToken: string;
  jobId: string;
}): Promise<ScrapedPosting> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    input.companyToken,
  )}/jobs/${encodeURIComponent(input.jobId)}?questions=true`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "JobPilot/0.1 (+demo intake)",
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Greenhouse boards-api returned ${response.status} for ${input.companyToken}/${input.jobId}.`,
    );
  }

  const payload = (await response.json()) as GreenhouseJobPayload;
  const questions = flattenGreenhouseQuestions(payload).map((q, i) =>
    mapGreenhouseQuestion(q, i),
  );

  return {
    title: payload.title ?? null,
    companyName: null,
    location: payload.location?.name ?? null,
    content: payload.content ? htmlToText(payload.content) : "",
    questions,
  };
}

export async function fetchPostingFromUrl(
  jobUrl: string,
): Promise<ScrapedPosting | null> {
  const parsed = parseJobPostingUrl(jobUrl);

  if (parsed.atsType === "greenhouse") {
    try {
      const url = new URL(parsed.normalizedUrl);
      const segments = url.pathname.split("/").filter(Boolean);
      const companyToken =
        segments[0] === "boards" ? segments[1] : segments[0];
      const jobsIndex = segments.indexOf("jobs");
      const jobId = jobsIndex >= 0 ? segments[jobsIndex + 1] : segments.at(-1);

      if (!companyToken || !jobId) return null;

      return await fetchGreenhousePosting({ companyToken, jobId });
    } catch {
      return null;
    }
  }

  return null;
}
