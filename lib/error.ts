export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts: string[] = [];
    if (typeof candidate.message === "string" && candidate.message.length > 0) {
      parts.push(candidate.message);
    }
    if (typeof candidate.code === "string" && candidate.code.length > 0) {
      parts.push(`(code: ${candidate.code})`);
    }
    if (typeof candidate.details === "string" && candidate.details.length > 0) {
      parts.push(`details: ${candidate.details}`);
    }
    if (typeof candidate.hint === "string" && candidate.hint.length > 0) {
      parts.push(`hint: ${candidate.hint}`);
    }
    if (parts.length > 0) return parts.join(" ");
    try {
      return JSON.stringify(error);
    } catch {
      // fall through
    }
  }
  return "Unknown error";
}
