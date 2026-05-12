import Anthropic from "@anthropic-ai/sdk";
import type { AssembledPrompt } from "@/lib/ai-prompts";

export class AnthropicNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
    this.name = "AnthropicNotConfiguredError";
  }
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AnthropicNotConfiguredError();
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

export type GenerateOptions = {
  maxTokens?: number;
};

export type GenerateResult = {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
};

const MODEL = "claude-sonnet-4-6";

export async function generateWithClaude(
  promptName: string,
  prompt: AssembledPrompt,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  const client = getClient();
  const maxTokens = opts.maxTokens ?? 1024;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
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

  if (process.env.LOG_AI_PROMPTS !== "false") {
    console.log(
      `[ai-client] ${promptName} usage: input=${response.usage.input_tokens} output=${response.usage.output_tokens} cache_read=${response.usage.cache_read_input_tokens ?? 0} cache_write=${response.usage.cache_creation_input_tokens ?? 0}`,
    );
  }

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
