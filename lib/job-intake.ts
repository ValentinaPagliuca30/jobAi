import { parseJobPostingUrl } from "@/lib/job-url";

type JobPostingSnapshot = {
  atsType: "greenhouse" | "lever";
  normalizedUrl: string;
  companyName: string;
  roleTitle: string;
  description: string;
  location: string | null;
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

function cleanText(value: string) {
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

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}…`;
}

function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+property=["']${key}["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+name=["']${key}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return null;
}

function extractTitle(html: string) {
  const ogTitle = extractMetaContent(html, "og:title");

  if (ogTitle) {
    return ogTitle;
  }

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);

  if (titleMatch?.[1]) {
    return cleanText(titleMatch[1]);
  }

  return null;
}

function extractJsonObjects(html: string) {
  const matches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  const objects: Record<string, unknown>[] = [];

  for (const match of matches) {
    const raw = match[1]?.trim();

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            objects.push(item as Record<string, unknown>);
          }
        }
      } else if (parsed && typeof parsed === "object") {
        objects.push(parsed as Record<string, unknown>);
      }
    } catch {
      continue;
    }
  }

  return objects;
}

function extractDescription(html: string) {
  const metaDescription =
    extractMetaContent(html, "description") ??
    extractMetaContent(html, "og:description");

  if (metaDescription && metaDescription.length > 120) {
    return clipText(metaDescription, 1400);
  }

  for (const object of extractJsonObjects(html)) {
    const description = object.description;

    if (typeof description === "string" && description.trim().length > 120) {
      return clipText(cleanText(description), 1400);
    }
  }

  const blockPatterns = [
    /<div[^>]+class=["'][^"']*(?:posting|content|description|section-wrapper)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*>([\s\S]*?)<\/section>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  for (const pattern of blockPatterns) {
    const match = html.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const text = cleanText(match[1]);

    if (text.length > 200) {
      return clipText(text, 1400);
    }
  }

  return "Description not extracted yet. The parser recognized the posting, but this page needs a stronger HTML scraper.";
}

function extractLocation(html: string) {
  for (const object of extractJsonObjects(html)) {
    const rawLocation = object.jobLocation;

    if (rawLocation && typeof rawLocation === "object" && !Array.isArray(rawLocation)) {
      const address = (rawLocation as { address?: { addressLocality?: string } }).address;

      if (address?.addressLocality) {
        return address.addressLocality;
      }
    }
  }

  const locationMatch = html.match(/"location"\s*:\s*"([^"]+)"/i);

  if (locationMatch?.[1]) {
    return cleanText(locationMatch[1]);
  }

  return null;
}

function parseGreenhouseTitle(title: string | null) {
  if (!title) return null;
  const match = title.match(/^\s*Job Application for\s+(.+?)\s+at\s+(.+?)\s*$/i);
  if (!match) return null;
  return { role: match[1].trim(), company: match[2].trim() };
}

function normalizeCompanyName(value: string | null, title: string | null) {
  if (value) {
    return value;
  }

  if (!title) {
    return "Unknown company";
  }

  const greenhouse = parseGreenhouseTitle(title);
  if (greenhouse?.company) {
    return greenhouse.company;
  }

  const byAt = title.match(/ at ([^-|]+)/i);

  if (byAt?.[1]) {
    return cleanText(byAt[1]);
  }

  const byPipe = title.split("|").map((part) => part.trim()).filter(Boolean);

  if (byPipe.length > 1) {
    return byPipe[1] ?? "Unknown company";
  }

  return "Unknown company";
}

function normalizeRoleTitle(value: string | null, title: string | null) {
  if (value) {
    return value;
  }

  if (!title) {
    return "Unknown role";
  }

  const greenhouse = parseGreenhouseTitle(title);
  if (greenhouse?.role) {
    return greenhouse.role;
  }

  const firstSegment = title.split("|")[0]?.split("-")[0]?.trim();

  return firstSegment || "Unknown role";
}

export async function fetchJobPostingSnapshot(
  input: string,
): Promise<JobPostingSnapshot> {
  const parsed = parseJobPostingUrl(input);

  if (!parsed.supported || parsed.atsType === "unknown") {
    throw new Error("Only supported Greenhouse and Lever posting URLs can be fetched.");
  }

  const response = await fetch(parsed.normalizedUrl, {
    cache: "no-store",
    headers: {
      "user-agent": "JobPilot demo intake bot/0.1",
    },
  });

  if (!response.ok) {
    throw new Error(`The job posting returned ${response.status}.`);
  }

  const html = await response.text();
  const title = extractTitle(html);

  return {
    atsType: parsed.atsType,
    normalizedUrl: parsed.normalizedUrl,
    companyName: normalizeCompanyName(parsed.companyName, title),
    roleTitle: normalizeRoleTitle(parsed.roleTitle, title),
    description: extractDescription(html),
    location: extractLocation(html),
  };
}
