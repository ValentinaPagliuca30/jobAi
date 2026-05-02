// Extracts plain text from uploaded resume / writing sample buffers.
// Used by the upload pipeline so V3's AI calls have real input to feed the model.

const MAX_TEXT_LENGTH = 50_000;

export type ExtractionResult =
  | { status: "ok"; text: string }
  | { status: "failed"; reason: string };

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string | null,
  filename?: string,
): Promise<ExtractionResult> {
  const kind = detectKind(mimeType, filename);

  try {
    let text: string;
    switch (kind) {
      case "pdf":
        text = await extractPdf(buffer);
        break;
      case "docx":
        text = await extractDocx(buffer);
        break;
      case "text":
        text = buffer.toString("utf8");
        break;
      default:
        return {
          status: "failed",
          reason: `Unsupported file type${mimeType ? `: ${mimeType}` : ""}.`,
        };
    }

    const cleaned = normalize(text);
    if (cleaned.length === 0) {
      return { status: "failed", reason: "No readable text found." };
    }
    return { status: "ok", text: cleaned.slice(0, MAX_TEXT_LENGTH) };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Extraction failed.",
    };
  }
}

function detectKind(
  mimeType: string | null,
  filename?: string,
): "pdf" | "docx" | "text" | "unknown" {
  const mt = mimeType?.toLowerCase() ?? "";
  if (mt === "application/pdf") return "pdf";
  if (
    mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (mt.startsWith("text/")) return "text";

  const ext = filename?.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt" || ext === "md") return "text";
  return "unknown";
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const mod = (await import("pdf-parse")) as
    | { default: (data: Buffer) => Promise<{ text: string }> }
    | ((data: Buffer) => Promise<{ text: string }>);
  const parse = typeof mod === "function" ? mod : mod.default;
  const result = await parse(buffer);
  return result.text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")) as {
    extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
  };
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function normalize(text: string): string {
  let out = text.replace(/\r\n/g, "\n");
  out = out.replace(/[\t\f\v]+/g, " ");
  out = out.replace(/[ ]{2,}/g, " ");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}
