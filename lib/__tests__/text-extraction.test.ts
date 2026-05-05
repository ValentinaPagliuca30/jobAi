import { describe, expect, it } from "vitest";
import { extractTextFromBuffer } from "@/lib/text-extraction";

describe("extractTextFromBuffer", () => {
  it("extracts text from a text/plain buffer", async () => {
    const buf = Buffer.from("Hello\nworld.\n", "utf8");
    const result = await extractTextFromBuffer(buf, "text/plain", "note.txt");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.text).toContain("Hello");
      expect(result.text).toContain("world.");
    }
  });

  it("normalizes whitespace and collapses repeated blank lines", async () => {
    const buf = Buffer.from("Line\t1\n\n\n\nLine 2", "utf8");
    const result = await extractTextFromBuffer(buf, "text/plain");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.text).toBe("Line 1\n\nLine 2");
    }
  });

  it("returns failure for unsupported mime types", async () => {
    const buf = Buffer.from([0x00, 0x01, 0x02]);
    const result = await extractTextFromBuffer(
      buf,
      "application/octet-stream",
      "blob.bin",
    );
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toMatch(/Unsupported/i);
    }
  });

  it("returns failure when the extracted text is empty", async () => {
    const buf = Buffer.from("   \n\n\t  \n", "utf8");
    const result = await extractTextFromBuffer(buf, "text/plain");
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toMatch(/no readable text/i);
    }
  });

  it("falls back to filename extension when mime type is missing", async () => {
    const buf = Buffer.from("Hello from a markdown file", "utf8");
    const result = await extractTextFromBuffer(buf, null, "notes.md");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.text).toContain("Hello from a markdown file");
    }
  });

  it("rejects when both mime type and extension are unknown", async () => {
    const buf = Buffer.from("anything", "utf8");
    const result = await extractTextFromBuffer(buf, null, "file.xyz");
    expect(result.status).toBe("failed");
  });
});
