import { describe, it, expect } from "vitest";
import { parseJobPostingUrl } from "@/lib/job-url";

describe("parseJobPostingUrl — Greenhouse", () => {
  it("returns null roleTitle for new job-boards numeric ID URLs", () => {
    const result = parseJobPostingUrl(
      "https://job-boards.greenhouse.io/anthropic/jobs/5023394008",
    );
    expect(result.atsType).toBe("greenhouse");
    expect(result.companyName).toBe("Anthropic");
    expect(result.roleTitle).toBeNull();
    expect(result.supported).toBe(true);
  });

  it("slug-ifies a real role slug", () => {
    const result = parseJobPostingUrl(
      "https://boards.greenhouse.io/anthropic/jobs/staff-software-engineer",
    );
    expect(result.atsType).toBe("greenhouse");
    expect(result.companyName).toBe("Anthropic");
    expect(result.roleTitle).toBe("Staff Software Engineer");
  });
});

describe("parseJobPostingUrl — Lever", () => {
  it("extracts company and role from Lever URL", () => {
    const result = parseJobPostingUrl(
      "https://jobs.lever.co/example/swe-intern",
    );
    expect(result.atsType).toBe("lever");
    expect(result.companyName).toBe("Example");
    expect(result.roleTitle).toBe("Swe Intern");
  });
});
