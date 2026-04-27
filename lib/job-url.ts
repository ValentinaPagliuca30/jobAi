export type AtsType = "greenhouse" | "lever" | "unknown";

export type ParsedJobPosting = {
  atsType: AtsType;
  normalizedUrl: string;
  companyName: string | null;
  roleTitle: string | null;
  supported: boolean;
};

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugToWords(value: string) {
  return toTitleCase(
    value
      .replace(/\+/g, " ")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function normalizeJobUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function detectAtsType(input: string): AtsType {
  const normalized = normalizeJobUrl(input);

  if (!normalized) {
    return "unknown";
  }

  try {
    const url = new URL(normalized);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

    if (hostname.includes("lever.co")) {
      return "lever";
    }

    if (hostname.includes("greenhouse.io")) {
      return "greenhouse";
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export function parseJobPostingUrl(input: string): ParsedJobPosting {
  const normalizedUrl = normalizeJobUrl(input);
  const atsType = detectAtsType(normalizedUrl);

  if (!normalizedUrl || atsType === "unknown") {
    return {
      atsType: "unknown",
      normalizedUrl,
      companyName: null,
      roleTitle: null,
      supported: false,
    };
  }

  try {
    const url = new URL(normalizedUrl);
    const segments = url.pathname.split("/").filter(Boolean);

    if (atsType === "lever") {
      const companySegment = segments[0] ?? "";
      const roleSegment = segments[1] ?? "";

      return {
        atsType,
        normalizedUrl,
        companyName: companySegment ? slugToWords(companySegment) : null,
        roleTitle: roleSegment ? slugToWords(roleSegment) : null,
        supported: Boolean(companySegment && roleSegment),
      };
    }

    if (atsType === "greenhouse") {
      const jobsIndex = segments.indexOf("jobs");
      const companySegment =
        segments[0] === "boards" ? segments[1] : segments[0] ?? "";
      const roleSegment =
        jobsIndex >= 0 ? segments[jobsIndex + 1] ?? "" : segments.at(-1) ?? "";

      return {
        atsType,
        normalizedUrl,
        companyName: companySegment ? slugToWords(companySegment) : null,
        roleTitle: roleSegment ? slugToWords(roleSegment) : null,
        supported: Boolean(companySegment && roleSegment),
      };
    }
  } catch {
    return {
      atsType: "unknown",
      normalizedUrl,
      companyName: null,
      roleTitle: null,
      supported: false,
    };
  }

  return {
    atsType,
    normalizedUrl,
    companyName: null,
    roleTitle: null,
    supported: false,
  };
}
