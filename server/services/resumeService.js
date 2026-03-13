const pdfParse = require("pdf-parse");

const DEFAULT_RESUME_URL =
  "https://drive.google.com/file/d/1h3f0GoBVo8ag_i18pCyXQG8w3fOqqIdU/preview";

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
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/[•●]/g, "• ")
    .replace(/[–—]/g, " - ")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractGoogleDriveFileId(url) {
  const directMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

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
  const response = await fetch(toDownloadUrl(getResumeUrl()));

  if (!response.ok) {
    throw new Error(`Resume download failed with status ${response.status}.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function splitSection(text, sectionName, nextSectionNames) {
  const nextPattern = nextSectionNames.join("|");
  const matcher = new RegExp(
    `${sectionName}\\s*([\\s\\S]*?)(?:${nextPattern}|$)`,
    "i"
  );
  const match = text.match(matcher);
  return match ? match[1].trim() : "";
}

function splitLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractEmail(text) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
}

function extractPhoneNumbers(text) {
  const matches = text.match(/(?:\+?\d[\d(). -]{7,}\d)/g) || [];
  return matches.map((value) => value.replace(/\s+/g, " ").trim());
}

function parseHeader(lines, rawText) {
  const name = lines[0] || "Siva Uruturi";
  const role = lines[1] || "UI/UX Designer";
  const email = extractEmail(rawText);
  const phones = extractPhoneNumbers(rawText);
  const locationLine = lines.find((line) => /Valparaiso|Boston|India|IN|MA/i.test(line)) || "";
  const locationMatch = locationLine.match(/Valparaiso,\s*IN|Boston,\s*MA|Hyderabad,\s*INDIA/i);

  return {
    profile: {
      name,
      role,
      summary: "",
      location: locationMatch ? locationMatch[0] : "Valparaiso, IN"
    },
    contact: {
      email,
      phonePrimary: phones[0] || "",
      phoneSecondary: phones[1] || ""
    }
  };
}

function parseSkills(skillsText) {
  const toolsMatch = skillsText.match(/Tools\s*:\s*([\s\S]*?)Design Skills\s*:/i);
  const designMatch = skillsText.match(/Design Skills\s*:\s*([\s\S]*?)Technical Skills\s*:/i);
  const technicalMatch = skillsText.match(/Technical Skills\s*:\s*([\s\S]*)/i);

  const toList = (value) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    tools: toList(toolsMatch ? toolsMatch[1] : ""),
    design: toList(designMatch ? designMatch[1] : ""),
    technical: toList(technicalMatch ? technicalMatch[1] : "")
  };
}

function parseEducation(educationText) {
  const lines = splitLines(educationText);

  if (lines.length === 0) {
    return null;
  }

  const schoolLine = lines[0] || "";
  const degreeLine = lines[1] || "";
  const certificationLine = lines.find((line) => /Foundations of User Experience/i.test(line)) || "";
  const schoolMatch = schoolLine.match(/^(.*?)(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)/);
  const periodMatch = schoolLine.match(/(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+\d{4}\s*-\s*(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+\d{4}/);
  const locationMatch = degreeLine.match(/([A-Za-z ]+,\s*[A-Z]{2,})$/);

  return {
    education: {
      degree: degreeLine.replace(locationMatch ? locationMatch[0] : "", "").trim(),
      school: schoolMatch ? schoolMatch[1].trim() : schoolLine,
      period: periodMatch ? periodMatch[0] : "",
      location: locationMatch ? locationMatch[0] : ""
    },
    certifications: certificationLine ? [certificationLine.replace(/^•\s*/, "").trim()] : []
  };
}

function parseExperience(experienceText) {
  const lines = splitLines(experienceText);
  const experiences = [];
  let current = null;

  lines.forEach((line) => {
    if (/^[A-Za-z].*(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+\d{4}\s*-\s*(Present|(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+\d{4})/i.test(line)) {
      if (current) {
        experiences.push(current);
      }

      const companyMatch = line.match(/^(.*?)(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)/);
      const periodMatch = line.match(/(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+\d{4}\s*-\s*(Present|(Jan\.|Feb\.|Mar\.|Apr\.|May|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+\d{4})/i);

      current = {
        company: companyMatch ? companyMatch[1].trim() : line.trim(),
        role: "",
        period: periodMatch ? periodMatch[0] : "",
        location: "",
        highlights: []
      };
      return;
    }

    if (current && !current.role && !line.startsWith("•")) {
      const locationMatch = line.match(/([A-Za-z ]+,\s*[A-Z]{2,}|Hyderabad,\s*INDIA)$/i);
      current.location = locationMatch ? locationMatch[0].trim() : "";
      current.role = line.replace(locationMatch ? locationMatch[0] : "", "").trim();
      return;
    }

    if (current && line.startsWith("•")) {
      current.highlights.push(line.replace(/^•\s*/, "").trim());
    }
  });

  if (current) {
    experiences.push(current);
  }

  return experiences;
}

function parseAchievements(experiences) {
  const achievementMatches = [];
  const pattern = /(\d+%[^.,;]*)/gi;

  experiences.forEach((item) => {
    item.highlights.forEach((highlight) => {
      const matches = highlight.match(pattern) || [];
      matches.forEach((value) => {
        achievementMatches.push(highlight.includes(value) ? highlight : value);
      });
    });
  });

  return [...new Set(achievementMatches)];
}

function buildResumePayload(parsedText) {
  const lines = splitLines(parsedText);
  const header = parseHeader(lines, parsedText);
  const summary = splitSection(parsedText, "SUMMARY", ["EXPERIENCE"]);
  const experienceText = splitSection(parsedText, "EXPERIENCE", ["SKILLS"]);
  const skillsText = splitSection(parsedText, "SKILLS", ["EDUCATION"]);
  const educationText = splitSection(parsedText, "EDUCATION", ["$"]);
  const experiences = parseExperience(experienceText);
  const parsedSkills = parseSkills(skillsText);
  const parsedEducation = parseEducation(educationText) || {
    education: null,
    certifications: []
  };

  return {
    sourceUrl: getResumeUrl(),
    updatedAt: new Date().toISOString(),
    rawText: parsedText,
    profile: {
      ...header.profile,
      summary
    },
    contact: header.contact,
    experience: experiences,
    skills: [
      ...parsedSkills.tools,
      ...parsedSkills.design,
      ...parsedSkills.technical
    ],
    skillsByCategory: parsedSkills,
    education: parsedEducation.education,
    certifications: parsedEducation.certifications,
    achievements: parseAchievements(experiences)
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
  fetchResumeData
};
