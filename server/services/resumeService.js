const pdfParse = require("pdf-parse");

const DEFAULT_RESUME_URL =
  "https://drive.google.com/file/d/1h3f0GoBVo8ag_i18pCyXQG8w3fOqqIdU/preview";
const SECTION_HEADINGS = [
  "SUMMARY",
  "EXPERIENCE",
  "SKILLS",
  "EDUCATION",
  "CERTIFICATIONS",
  "PROJECTS"
];
const MONTH_PATTERN =
  "(Jan\\.?|Feb\\.?|Mar\\.?|Apr\\.?|May|Jun\\.?|Jul\\.?|Aug\\.?|Sep\\.?|Oct\\.?|Nov\\.?|Dec\\.?)";

let cachedResume = null;
let cachedAt = 0;

function getResumeUrl() {
  return process.env.RESUME_SOURCE_URL || DEFAULT_RESUME_URL;
}

function getResumeCacheTtlMs() {
  return Number(process.env.RESUME_CACHE_TTL_MS || 300000);
}

function normalizeResumeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\u00A0/g, " ")
    .replace(/[•●]/g, "\n• ")
    .replace(/[–—]/g, " - ")
    .replace(/Phone-Alt|Envelope|GLOBE|LINKEDIN|LinkedIn|Map-marker-alt/g, " ")
    .replace(/\|/g, " | ")
    .replace(/([A-Za-z\)])(Jan\.?|Feb\.?|Mar\.?|Apr\.?|May|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Oct\.?|Nov\.?|Dec\.?)/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d%)([A-Za-z])/g, "$1 $2")
    .replace(/•\s*\n\s*/g, "• ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractGoogleDriveFileId(url) {
  const directMatch = String(url || "").match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (directMatch) {
    return directMatch[1];
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("id") || "";
  } catch (error) {
    return "";
  }
}

function toDownloadUrl(url) {
  const fileId = extractGoogleDriveFileId(url);

  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url;
}

async function downloadResumeBuffer() {
  const response = await fetch(toDownloadUrl(getResumeUrl()), {
    headers: {
      "User-Agent": "portfolio-resume-service/1.0",
      "Cache-Control": "no-cache"
    }
  });

  if (!response.ok) {
    throw new Error(`Resume download failed with status ${response.status}.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function splitLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanInlineText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function uniqueList(values) {
  return values.filter((value, index, array) => {
    return value && array.indexOf(value) === index;
  });
}

function extractSection(text, sectionName) {
  const nextHeadings = SECTION_HEADINGS.filter((heading) => heading !== sectionName);
  const pattern = new RegExp(
    `\\b${sectionName}\\b\\s*([\\s\\S]*?)(?=\\n(?:${nextHeadings.join("|")})\\b|$)`,
    "i"
  );
  const match = String(text || "").match(pattern);
  return match ? match[1].trim() : "";
}

function extractEmail(text) {
  const match = String(text || "")
    .replace(/\s+/g, " ")
    .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return match ? match[0] : "";
}

function extractPhoneNumbers(text) {
  const matches =
    String(text || "")
      .replace(/\s+/g, " ")
      .match(/(?:\+?\d[\d(). -]{7,}\d)/g) || [];

  return uniqueList(
    matches.map((value) => {
      return cleanInlineText(value).replace(/^0+/, "");
    })
  );
}

function extractTrailingLocation(text) {
  const normalizedText = cleanInlineText(text);
  const remoteMatch = normalizedText.match(/(Remote\s*\([^)]+\))$/i);

  if (remoteMatch) {
    return cleanInlineText(remoteMatch[1]);
  }

  const cityStateMatch = normalizedText.match(
    /([A-Za-z.'-]+(?:\s+[A-Za-z.'-]+){0,1},\s*[A-Z]{2,})$/i
  );

  if (cityStateMatch) {
    return cleanInlineText(cityStateMatch[1]);
  }

  const internationalMatch = normalizedText.match(
    /(Hyderabad,\s*INDIA)$/i
  );

  return internationalMatch ? cleanInlineText(internationalMatch[1]) : "";
}

function extractHeaderBlock(text) {
  const summaryIndex = String(text || "").search(/\nSUMMARY\b/i);
  return summaryIndex === -1 ? String(text || "") : String(text || "").slice(0, summaryIndex);
}

function parseHeader(text) {
  const headerBlock = extractHeaderBlock(text);
  const lines = splitLines(headerBlock);
  const name = lines[0] || "Siva Uruturi";
  const role = lines[1] || "";
  const email = extractEmail(headerBlock);
  const phones = extractPhoneNumbers(headerBlock);
  const location = extractTrailingLocation(headerBlock);

  return {
    profile: {
      name,
      role,
      summary: "",
      location
    },
    contact: {
      email,
      phonePrimary: phones[0] || "",
      phoneSecondary: phones[1] || ""
    }
  };
}

function parseSummary(summaryText) {
  return cleanInlineText(String(summaryText || "").replace(/\n/g, " "));
}

function splitCommaSeparatedList(value) {
  return uniqueList(
    cleanInlineText(String(value || "").replace(/\n/g, " "))
      .split(",")
      .map((item) => cleanInlineText(item))
      .filter(Boolean)
  );
}

function extractLabeledSection(text, label, nextLabels) {
  const lookahead = nextLabels.length
    ? `(?=(?:${nextLabels.join("|")})\\s*:|$)`
    : "$";
  const pattern = new RegExp(`${label}\\s*:\\s*([\\s\\S]*?)${lookahead}`, "i");
  const match = String(text || "").match(pattern);
  return match ? cleanInlineText(match[1]) : "";
}

function parseSkills(skillsText) {
  const normalizedSkillsText = String(skillsText || "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const design = splitCommaSeparatedList(
    extractLabeledSection(normalizedSkillsText, "Design Skills", [
      "Tools",
      "Technical Skills"
    ])
  );
  const tools = splitCommaSeparatedList(
    extractLabeledSection(normalizedSkillsText, "Tools", [
      "Design Skills",
      "Technical Skills"
    ])
  );
  const technical = splitCommaSeparatedList(
    extractLabeledSection(normalizedSkillsText, "Technical Skills", [
      "Design Skills",
      "Tools"
    ])
  );

  return {
    tools,
    design,
    technical
  };
}

function looksLikeExperienceHeader(line) {
  const pattern = new RegExp(
    `^.+?\\s+${MONTH_PATTERN}\\s+\\d{4}\\s*-\\s*(Present|${MONTH_PATTERN}\\s+\\d{4})$`,
    "i"
  );
  return pattern.test(cleanInlineText(line));
}

function parseExperienceHeader(line) {
  const normalizedLine = cleanInlineText(line);
  const pattern = new RegExp(
    `^(.*?)\\s+(${MONTH_PATTERN}\\s+\\d{4}\\s*-\\s*(Present|${MONTH_PATTERN}\\s+\\d{4}))$`,
    "i"
  );
  const match = normalizedLine.match(pattern);

  return {
    company: match ? cleanInlineText(match[1]) : normalizedLine,
    period: match ? cleanInlineText(match[2]) : ""
  };
}

function parseRoleAndLocation(line) {
  const normalizedLine = cleanInlineText(line);
  const location = extractTrailingLocation(normalizedLine);

  return {
    role: cleanInlineText(
      normalizedLine.replace(location, "")
    ),
    location
  };
}

function parseExperience(experienceText) {
  const lines = splitLines(
    String(experienceText || "").replace(/•\s*\n\s*/g, "• ")
  );
  const experiences = [];
  let current = null;

  lines.forEach((line) => {
    const normalizedLine = cleanInlineText(line);

    if (looksLikeExperienceHeader(normalizedLine)) {
      if (current) {
        experiences.push(current);
      }

      const parsedHeader = parseExperienceHeader(normalizedLine);
      current = {
        company: parsedHeader.company,
        role: "",
        period: parsedHeader.period,
        location: "",
        highlights: []
      };
      return;
    }

    if (!current) {
      return;
    }

    if (normalizedLine.startsWith("•")) {
      const bulletText = cleanInlineText(normalizedLine.replace(/^•\s*/, ""));
      if (bulletText) {
        current.highlights.push(bulletText);
      }
      return;
    }

    if (!current.role) {
      const roleAndLocation = parseRoleAndLocation(normalizedLine);
      current.role = roleAndLocation.role;
      current.location = roleAndLocation.location;
      return;
    }

    if (current.highlights.length > 0) {
      current.highlights[current.highlights.length - 1] = cleanInlineText(
        current.highlights[current.highlights.length - 1] + " " + normalizedLine
      );
    }
  });

  if (current) {
    experiences.push(current);
  }

  return experiences;
}

function parseEducation(educationText, preferredLocation) {
  const lines = splitLines(String(educationText || "").replace(/•\s*\n\s*/g, "• "));

  if (!lines.length) {
    return {
      education: null,
      certifications: []
    };
  }

  const schoolLine = cleanInlineText(lines[0] || "");
  const degreeLine = cleanInlineText(lines[1] || "");
  const periodMatch = schoolLine.match(
    new RegExp(`${MONTH_PATTERN}\\s+\\d{4}\\s*-\\s*${MONTH_PATTERN}\\s+\\d{4}`, "i")
  );
  const school = cleanInlineText(
    schoolLine.replace(periodMatch ? periodMatch[0] : "", "")
  );
  const location =
    preferredLocation && degreeLine.indexOf(preferredLocation) !== -1
      ? preferredLocation
      : extractTrailingLocation(degreeLine);
  const degree = cleanInlineText(
    degreeLine.replace(location, "")
  );
  const certifications = lines
    .slice(2)
    .map((line) => cleanInlineText(line.replace(/^•\s*/, "")))
    .filter(Boolean);

  return {
    education: {
      degree,
      school,
      period: periodMatch ? cleanInlineText(periodMatch[0]) : "",
      location
    },
    certifications: uniqueList(certifications)
  };
}

function parseProjects(projectsText) {
  return uniqueList(
    splitLines(String(projectsText || "").replace(/^•\s*/gm, ""))
      .map((line) => cleanInlineText(line))
      .filter(Boolean)
  );
}

function parseAchievements(experiences) {
  const achievements = [];

  experiences.forEach((item) => {
    item.highlights.forEach((highlight) => {
      if (/\d+%/.test(highlight)) {
        achievements.push(cleanInlineText(highlight));
      }
    });
  });

  return uniqueList(achievements);
}

function buildResumePayload(parsedText) {
  const header = parseHeader(parsedText);
  const summary = parseSummary(extractSection(parsedText, "SUMMARY"));
  const experience = parseExperience(extractSection(parsedText, "EXPERIENCE"));
  const parsedSkills = parseSkills(extractSection(parsedText, "SKILLS"));
  const parsedEducation = parseEducation(
    extractSection(parsedText, "EDUCATION"),
    header.profile.location
  );
  const projects = parseProjects(extractSection(parsedText, "PROJECTS"));

  return {
    updatedAt: new Date().toISOString(),
    sourceUrl: getResumeUrl(),
    rawText: parsedText,
    profile: {
      ...header.profile,
      summary
    },
    contact: header.contact,
    experience,
    skills: uniqueList([
      ...parsedSkills.tools,
      ...parsedSkills.design,
      ...parsedSkills.technical
    ]),
    skillsByCategory: parsedSkills,
    education: parsedEducation.education,
    certifications: parsedEducation.certifications,
    achievements: parseAchievements(experience),
    projects
  };
}

async function fetchResumeData(forceRefresh) {
  const now = Date.now();
  const ttl = getResumeCacheTtlMs();

  if (!forceRefresh && cachedResume && now - cachedAt < ttl) {
    return cachedResume;
  }

  const buffer = await downloadResumeBuffer();
  const parsed = await pdfParse(buffer);
  const payload = buildResumePayload(normalizeResumeText(parsed.text));

  cachedResume = payload;
  cachedAt = now;
  return payload;
}

module.exports = {
  fetchResumeData,
  getResumeUrl,
  toDownloadUrl
};
