import type {
  LinkedInEducation,
  LinkedInProfile,
  LinkedInProfileAnalytics,
  LinkedInProfileExperience,
} from "../types/linkedin.js";

const UI_NOISE = new Set([
  "Add to profile",
  "Why am I seeing this ad?",
  "About this member",
  "How it works",
  "Create your profile in another language",
  "Edit intro",
  "Feed",
  "Profile photo",
  "Contact info",
  "Grow",
  "Jobs",
  "Cover photo",
  "Add a role to your profile",
  "Add career break",
  "Edit role",
  "Add role",
  "Experience",
  "Settings & Privacy",
  "Help",
  "Language",
  "Posts & Activity",
  "Job Posting Account",
  "Sign out",
  "Account",
  "Manage",
  "Suggested for you",
  "Send profile in a message",
  "Save to PDF",
  "Saved items",
  "Activity",
  "Public profile & URL",
  "About",
  "Edit cover image",
  "Unfollow",
  "Follow",
  "Follow back",
  "Connect",
  "Message",
  "Pending",
  "More",
  "Share",
]);

const NON_NAME_VOCAB = new Set([
  "talent",
  "solutions",
  "community",
  "guidelines",
  "marketing",
  "choices",
  "sales",
  "small",
  "business",
  "safety",
  "center",
  "apps",
  "manage",
  "billing",
  "insights",
  "services",
  "marketplace",
  "privacy",
  "policy",
  "user",
  "agreement",
  "pages",
  "terms",
  "cookie",
  "copyright",
  "admin",
  "posting",
  "account",
  "software",
  "engineer",
  "frontend",
  "developer",
  "information",
  "technology",
  "trainee",
  "unfollow",
  "follow",
  "connect",
  "message",
  "pending",
  "share",
  "save",
  "edit",
  "show",
  "dismiss",
  "open",
  "close",
  "home",
  "notifications",
  "network",
  "messaging",
  "footer",
  "aside",
  "linkedin",
  "premium",
  "analytics",
  "experiences",
  "background",
  "cover",
  "language",
  "public",
  "profile",
  "url",
  "photo",
  "image",
  "logo",
  "slideshow",
  "employers",
  "recruiters",
  "volunteer",
  "hiring",
  "providing",
  "finding",
  "someone",
]);

const OPEN_TO_OPTIONS = [
  "Finding a new job",
  "Hiring",
  "Providing services",
  "Finding volunteer opportunities",
] as const;

const COMPANY_LINE_RE = /^(.+?) · (.+)$/;
const DATE_LINE_RE =
  /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4})(?:\s*[-–]\s*(Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}))?(?:\s*·\s*(.+))?$/;
const YEAR_DATE_LINE_RE = /^(\d{4})\s*[-–]\s*(Present|\d{4})$/;
const SHORT_DATE_LINE_RE =
  /^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4})\s*·\s*(.+)$/;
const EDUCATION_KEYWORDS =
  /university|college|institute|school|academy|polytechnic|iit|nit|iim/i;

function extractChildrenTexts(raw: string): string[] {
  const matches = raw.matchAll(/"children"\s*:\s*\[\s*"([^"$][^"]*)"\s*\]/g);
  const texts: string[] = [];

  for (const match of matches) {
    const value = match[1]?.trim();

    if (!value || value.startsWith("$L") || UI_NOISE.has(value)) {
      continue;
    }

    texts.push(value);
  }

  return texts;
}

function buildImageUrl(rootUrl: string, suffixUrl: string): string {
  return `${rootUrl}${suffixUrl}`;
}

function extractProfileImage(raw: string, profileName?: string): string | undefined {
  if (profileName) {
    const escapedName = profileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nearName = raw.match(
      new RegExp(
        `"aria-label":"${escapedName}"[\\s\\S]{0,30000}?"rootUrl":"(https:\\/\\/media\\.licdn\\.com\\/[^"]*profile-displayphoto[^"]*)"[\\s\\S]{0,1500}?"suffixUrl":"([^"]*scale_400_400[^"]*)"`,
      ),
    );

    if (nearName?.[1] && nearName[2]) {
      return buildImageUrl(nearName[1], nearName[2]);
    }
  }

  const topCard = raw.match(
    /"shape":"circle"[\s\S]{0,300}?"height":"4x"[\s\S]{0,300}?"width":"4x"[\s\S]{0,3000}?"rootUrl":"(https:\/\/media\.licdn\.com\/[^"]*profile-displayphoto[^"]*)"[\s\S]{0,1500}?"suffixUrl":"([^"]*scale_400_400[^"]*)"/,
  );

  if (topCard?.[1] && topCard[2]) {
    return buildImageUrl(topCard[1], topCard[2]);
  }

  const coverIdx = raw.indexOf("profile-displaybackgroundimage-shrink_350_1400");

  if (coverIdx >= 0) {
    const nearCover = raw
      .slice(Math.max(0, coverIdx - 25000), coverIdx + 5000)
      .match(
        /"rootUrl":"(https:\/\/media\.licdn\.com\/[^"]*profile-displayphoto[^"]*)"[\s\S]{0,1500}?"suffixUrl":"([^"]*scale_400_400[^"]*)"/,
      );

    if (nearCover?.[1] && nearCover[2]) {
      return buildImageUrl(nearCover[1], nearCover[2]);
    }
  }

  return undefined;
}

function extractCoverImage(raw: string): string | undefined {
  const match = raw.match(
    /"rootUrl":"(https:\/\/media\.licdn\.com\/[^"]*profile-displaybackgroundimage[^"]*)"[\s\S]{0,2000}?"suffixUrl":"([^"]*350_1400[^"]*)"/,
  );

  if (match?.[1] && match[2]) {
    return buildImageUrl(match[1], match[2]);
  }

  return undefined;
}

function extractCompanyLogos(raw: string): Map<string, string> {
  const logos = new Map<string, string>();
  const pattern =
    /"a11yText":"([^"]+ logo)"[\s\S]*?"rootUrl":"(https:\/\/media\.licdn\.com\/[^"]+)"[\s\S]*?"suffixUrl":"([^"]*400[^"]*)"/g;

  for (const match of raw.matchAll(pattern)) {
    const company = match[1]?.replace(/ logo$/, "");
    const url = `${match[2]}${match[3]}`;

    if (company && url) {
      logos.set(company, url);
    }
  }

  return logos;
}

function extractSkillsByAssociation(raw: string): Map<string, string[]> {
  const skills = new Map<string, string[]>();
  const associations = [
    ...raw.matchAll(/"associationTitle":"([^"]+)"/g),
  ]
    .map((match) => match[1])
    .filter((value): value is string => typeof value === "string" && value.includes(" at "));

  const skillLines = [
    ...raw.matchAll(
      /"children":\[\["\$","\$5","text-attr-0",\{"children":\["\$undefined",[\s\S]*?,\s*"([^"]+and \+\d+ skills?)"/g,
    ),
    ...raw.matchAll(
      /"children":\[\["\$","\$5","text-attr-0",\{"children":\["([^"]+and [^"]+)"/g,
    ),
    ...raw.matchAll(/"(Technical Design and Computer Science)"/g),
  ]
    .map((match) => match[1])
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        !value.startsWith("Skills for ") &&
        (value.includes("+") || value.includes(",") || value.includes("Computer Science")),
    );

  for (let index = 0; index < associations.length; index += 1) {
    const association = associations[index];
    const skillLine = skillLines[index];

    if (!association || !skillLine) {
      continue;
    }

    skills.set(association, parseSkillsText(skillLine));
  }

  return skills;
}

function parseSkillsText(value: string): string[] {
  const plusSkillMatch = value.match(/\s+and\s+(\+\d+\s+skills?)$/i);
  const base = value.replace(/\s+and\s+\+\d+\s+skills?$/i, "").trim();

  if (!base.includes(",") && base.includes(" and ") && !plusSkillMatch) {
    return base.split(" and ").map((skill) => skill.trim()).filter(Boolean);
  }

  const skills = base
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (plusSkillMatch?.[1]) {
    skills.push(plusSkillMatch[1].replace(/skills$/i, "skill"));
  }

  return skills;
}

function parseDateLine(line: string): {
  startDate?: string;
  endDate?: string;
  duration?: string;
} {
  const fullMatch = line.match(DATE_LINE_RE);

  if (fullMatch) {
    return {
      startDate: fullMatch[1],
      endDate: fullMatch[2] ?? undefined,
      duration: fullMatch[3],
    };
  }

  const yearMatch = line.match(YEAR_DATE_LINE_RE);

  if (yearMatch) {
    return {
      startDate: yearMatch[1],
      endDate: yearMatch[2] ?? undefined,
    };
  }

  const shortMatch = line.match(SHORT_DATE_LINE_RE);

  if (shortMatch) {
    return {
      startDate: shortMatch[1],
      duration: shortMatch[2],
    };
  }

  return {};
}

function parseLocationLine(line: string): {
  location?: string;
  workType?: string | null;
} {
  const match = line.match(COMPANY_LINE_RE);

  if (!match) {
    return { location: line };
  }

  return {
    location: match[1],
    workType: match[2] ?? null,
  };
}

function isDateLine(value: string): boolean {
  return (
    DATE_LINE_RE.test(value) ||
    YEAR_DATE_LINE_RE.test(value) ||
    SHORT_DATE_LINE_RE.test(value)
  );
}

function isCompanyLine(value: string): boolean {
  return COMPANY_LINE_RE.test(value) && !isDateLine(value);
}

function parseCompanyLine(line: string): { company: string; type?: string } {
  const match = line.match(COMPANY_LINE_RE);

  if (!match) {
    return { company: line };
  }

  return {
    company: match[1]!,
    type: match[2],
  };
}

function isExperienceNoise(value: string, profileName?: string): boolean {
  const text = value.trim();

  if (!text || text === "·" || UI_NOISE.has(text)) {
    return true;
  }

  if (profileName && text === profileName) {
    return true;
  }

  return (
    text.startsWith("http") ||
    text.includes("reactions") ||
    text.includes("comments") ||
    text.includes("linkedin.com") ||
    text.includes("Try Premium") ||
    text.includes("mutual group") ||
    text.includes("Followed by") ||
    text.includes("on LinkedIn") ||
    text.length > 180 ||
    /^\d+[,.]?\d*\s*(reactions|comments)/i.test(text)
  );
}

function experienceKey(entry: LinkedInProfileExperience): string {
  return `${entry.title.toLowerCase()}|${entry.company.toLowerCase()}`;
}

function experienceScore(entry: LinkedInProfileExperience): number {
  return [
    entry.startDate,
    entry.endDate,
    entry.duration,
    entry.location,
    entry.type,
    entry.workType,
    entry.companyLogo,
    entry.skills?.length ? "skills" : undefined,
  ].filter(Boolean).length;
}

function mergeExperiences(
  ...groups: LinkedInProfileExperience[][]
): LinkedInProfileExperience[] {
  const merged = new Map<string, LinkedInProfileExperience>();

  for (const group of groups) {
    for (const entry of group) {
      const key = experienceKey(entry);
      const existing = merged.get(key);

      if (!existing || experienceScore(entry) > experienceScore(existing)) {
        merged.set(key, {
          ...(existing ?? {}),
          ...entry,
          skills: entry.skills?.length ? entry.skills : existing?.skills,
          companyLogo: entry.companyLogo ?? existing?.companyLogo,
        });
      }
    }
  }

  return [...merged.values()];
}

function extractExperienceFromAssociations(
  raw: string,
  companyLogos: Map<string, string>,
  skillsByAssociation: Map<string, string[]>,
): LinkedInProfileExperience[] {
  const experience: LinkedInProfileExperience[] = [];

  for (const match of raw.matchAll(/"associationTitle":"([^"]+)"/g)) {
    const association = match[1];

    if (!association?.includes(" at ")) {
      continue;
    }

    const [title, company] = association.split(" at ");
    const window = raw.slice(match.index ?? 0, (match.index ?? 0) + 5000);
    const texts = extractChildrenTexts(window);
    const companyLine = texts.find((text) => text.startsWith(`${company} ·`));
    const dateLine = texts.find(isDateLine);
    const locationLine = texts.find(
      (text) =>
        text.includes(",") &&
        !isDateLine(text) &&
        !text.startsWith(`${company} ·`) &&
        text !== title,
    );

    const parsedCompany = companyLine ? parseCompanyLine(companyLine) : { company: company! };
    const dates = dateLine ? parseDateLine(dateLine) : {};
    const location = locationLine ? parseLocationLine(locationLine) : {};

    experience.push({
      title: title!,
      company: parsedCompany.company,
      type: parsedCompany.type,
      startDate: dates.startDate,
      endDate: dates.endDate,
      duration: dates.duration,
      location: location.location,
      workType: location.workType,
      skills: skillsByAssociation.get(association),
      companyLogo: companyLogos.get(parsedCompany.company),
    });
  }

  return experience;
}

function extractExperienceFromDateLines(
  texts: string[],
  companyLogos: Map<string, string>,
  profileName?: string,
): LinkedInProfileExperience[] {
  const experience: LinkedInProfileExperience[] = [];

  for (let index = 0; index < texts.length; index += 1) {
    const dateLine = texts[index];

    if (!dateLine || !isDateLine(dateLine)) {
      continue;
    }

    const companyLine = texts[index - 1];
    const titleLine = texts[index - 2];

    if (
      !companyLine ||
      !titleLine ||
      isExperienceNoise(titleLine, profileName) ||
      isExperienceNoise(companyLine, profileName) ||
      isDateLine(companyLine)
    ) {
      continue;
    }

    const parsedCompany = parseCompanyLine(companyLine);
    const dates = parseDateLine(dateLine);
    const locationLine = texts[index + 1];
    const location =
      locationLine &&
      !isDateLine(locationLine) &&
      !isExperienceNoise(locationLine, profileName) &&
      !isCompanyLine(locationLine) &&
      !locationLine.includes(" at ")
        ? parseLocationLine(locationLine)
        : {};

    experience.push({
      title: titleLine,
      company: parsedCompany.company,
      type: parsedCompany.type,
      startDate: dates.startDate,
      endDate: dates.endDate,
      duration: dates.duration,
      location: location.location,
      workType: location.workType,
      companyLogo: companyLogos.get(parsedCompany.company),
    });
  }

  return experience;
}

function extractExperienceFromForwardScan(
  texts: string[],
  companyLogos: Map<string, string>,
  profileName?: string,
): LinkedInProfileExperience[] {
  const experience: LinkedInProfileExperience[] = [];

  for (let index = 0; index < texts.length - 2; index += 1) {
    const titleLine = texts[index];
    const companyLine = texts[index + 1];
    const dateLine = texts[index + 2];

    if (
      !titleLine ||
      !companyLine ||
      !dateLine ||
      isExperienceNoise(titleLine, profileName) ||
      isExperienceNoise(companyLine, profileName) ||
      !isDateLine(dateLine)
    ) {
      continue;
    }

    const parsedCompany = parseCompanyLine(companyLine);
    const dates = parseDateLine(dateLine);
    const locationLine = texts[index + 3];
    const location =
      locationLine &&
      !isDateLine(locationLine) &&
      !isExperienceNoise(locationLine, profileName) &&
      !isCompanyLine(locationLine)
        ? parseLocationLine(locationLine)
        : {};

    experience.push({
      title: titleLine,
      company: parsedCompany.company,
      type: parsedCompany.type,
      startDate: dates.startDate,
      endDate: dates.endDate,
      duration: dates.duration,
      location: location.location,
      workType: location.workType,
      companyLogo: companyLogos.get(parsedCompany.company),
    });
  }

  return experience;
}

function extractExperience(
  texts: string[],
  raw: string,
  companyLogos: Map<string, string>,
  profileName?: string,
): LinkedInProfileExperience[] {
  const skillsByAssociation = extractSkillsByAssociation(raw);

  return mergeExperiences(
    extractExperienceFromAssociations(raw, companyLogos, skillsByAssociation),
    extractExperienceFromDateLines(texts, companyLogos, profileName),
    extractExperienceFromForwardScan(texts, companyLogos, profileName),
  );
}

function extractAnalytics(texts: string[]): LinkedInProfileAnalytics | undefined {
  const profileViews = texts
    .map((text) => text.match(/^(\d+) profile views?$/i)?.[1])
    .find(Boolean);

  const postImpressions = texts
    .map((text) => text.match(/^(\d+) post impressions?$/i)?.[1])
    .find(Boolean);

  const searchAppearances = texts
    .map((text) => text.match(/^(\d+) search appearances?$/i)?.[1])
    .find(Boolean);

  const postImpressionsWindow = texts.find((text) => /^Past \d+ days$/i.test(text));

  if (!profileViews && !postImpressions && !searchAppearances) {
    return undefined;
  }

  return {
    profileViews: profileViews ? Number(profileViews) : undefined,
    postImpressions: postImpressions ? Number(postImpressions) : undefined,
    postImpressionsWindow,
    searchAppearances: searchAppearances ? Number(searchAppearances) : undefined,
  };
}

function extractOpenTo(texts: string[]): string[] {
  return OPEN_TO_OPTIONS.filter((option) => texts.includes(option));
}

function extractConnections(texts: string[]): string | undefined {
  const match = texts.find((text) => /^\d+\+\s+connections$/i.test(text));
  return match?.match(/^(\d+\+)/)?.[1];
}

function extractEducation(texts: string[]): string | undefined {
  return extractEducations(texts)[0]?.school;
}

function isLikelySchool(text: string): boolean {
  if (!EDUCATION_KEYWORDS.test(text)) {
    return false;
  }

  if (
    /guidelines|opportunities|unlock|volunteer|sales|followed by|mutual group|premium|privacy|terms|cookie|copyright|admin center|talent solutions|\|/i.test(
      text,
    ) ||
    /\d+\s*million|ex-sde|google sps|founder,\s/i.test(text) ||
    /^you and\b/i.test(text)
  ) {
    return false;
  }

  if (
    /,\s*[A-Za-z ]+,\s*(United States|India|United Kingdom|Canada|Australia)/.test(text) &&
    !/(university|college|institute|school)/i.test(text)
  ) {
    return false;
  }

  return text.length >= 8 && text.length <= 120;
}

function isLikelyDegree(text: string): boolean {
  return (
    !isDateLine(text) &&
    !isExperienceNoise(text) &&
    !text.includes("connections") &&
    !text.includes("moderated") &&
    !text.includes("|") &&
    text.length < 80 &&
    !text.includes(",")
  );
}

function extractEducations(texts: string[]): LinkedInEducation[] {
  const educations: LinkedInEducation[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < texts.length; index += 1) {
    const school = texts[index];

    if (!school || !isLikelySchool(school) || school.includes("Someone at")) {
      continue;
    }

    const next = texts[index + 1];
    const afterNext = texts[index + 2];
    let degree: string | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;
    let duration: string | undefined;

    if (
      next &&
      !isLikelySchool(next) &&
      isLikelyDegree(next)
    ) {
      degree = next;
    }

    if (afterNext && isDateLine(afterNext)) {
      const dates = parseDateLine(afterNext);
      startDate = dates.startDate;
      endDate = dates.endDate;
      duration = dates.duration;
    } else if (next && isDateLine(next)) {
      const dates = parseDateLine(next);
      startDate = dates.startDate;
      endDate = dates.endDate;
      duration = dates.duration;
      degree = undefined;
    }

    const key = school.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    educations.push({
      school,
      degree,
      startDate,
      endDate,
      duration,
    });
  }

  return educations;
}

function extractAbout(texts: string[], profileName?: string): string | undefined {
  return texts.find(
    (text) =>
      text.length > 80 &&
      text.length < 500 &&
      text !== profileName &&
      !text.includes("reactions") &&
      !text.includes("http") &&
      !text.includes("|") &&
      !text.includes("on LinkedIn") &&
      !EDUCATION_KEYWORDS.test(text) &&
      /[.!?]/.test(text),
  );
}

function isActionLabel(label: string): boolean {
  const lower = label.toLowerCase().trim();

  return (
    /^(un)?follow(\s+back)?$/.test(lower) ||
    /^(connect|message|pending|more|share|save|close)$/.test(lower) ||
    lower.startsWith("edit ") ||
    lower.startsWith("show ") ||
    lower.startsWith("dismiss ") ||
    lower.startsWith("add ") ||
    lower.startsWith("open ") ||
    lower.includes("notification") ||
    lower.includes(" logo") ||
    lower.includes(" photo") ||
    lower.includes(" image") ||
    lower.includes("content") ||
    lower.includes("footer") ||
    lower.includes("aside")
  );
}

function isLikelyPersonName(text: string): boolean {
  const value = text.trim();

  if (!value || value.length < 3 || value.length > 60) {
    return false;
  }

  if (isActionLabel(value) || UI_NOISE.has(value)) {
    return false;
  }

  const words = value.split(/\s+/);

  if (words.length < 2 || words.length > 4) {
    return false;
  }

  if (!words.every((word) => /^[\p{L}'-]+$/u.test(word))) {
    return false;
  }

  if (words.some((word) => NON_NAME_VOCAB.has(word.toLowerCase()))) {
    return false;
  }

  return words.every((word) => /^[\p{Lu}][\p{L}'-]*$/u.test(word));
}

function extractNameFromTitle(raw: string): string | undefined {
  const match = raw.match(/"title",null,\{"children":"([^"|]+)\s*\|\s*LinkedIn"\}/);
  const name = match?.[1]?.trim();

  if (!name || isActionLabel(name)) {
    return undefined;
  }

  return name;
}

function extractNameFromAriaLabel(raw: string): string | undefined {
  const labels = [
    ...raw.matchAll(/"aria-label":"([^"]+)"/g),
  ]
    .map((match) => match[1]?.trim())
    .filter((label): label is string => Boolean(label));

  for (const label of labels) {
    if (isLikelyPersonName(label)) {
      return label;
    }
  }

  return undefined;
}

function extractNameFromTexts(texts: string[], preferredName?: string): string | undefined {
  if (preferredName) {
    return preferredName;
  }

  const counts = new Map<string, number>();

  for (const text of texts) {
    if (!isLikelyPersonName(text)) {
      continue;
    }

    counts.set(text, (counts.get(text) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]);

  return ranked[0]?.[0];
}

function extractName(raw: string, texts: string[]): string | undefined {
  const titleName = extractNameFromTitle(raw);

  if (titleName) {
    return titleName;
  }

  const ariaName = extractNameFromAriaLabel(raw);

  if (ariaName) {
    return ariaName;
  }

  return extractNameFromTexts(texts);
}

function extractHeadline(texts: string[], name?: string, raw?: string): string | undefined {
  if (!name) {
    return undefined;
  }

  if (raw) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const inlineHeadline = raw.match(
      new RegExp(`"children":\\["${escapedName.replace(/\s+/g, "\\s+")}","([^"]{8,180})"\\]`),
    );

    if (inlineHeadline?.[1] && !isExperienceNoise(inlineHeadline[1], name)) {
      return inlineHeadline[1];
    }
  }

  const firstNameIndex = texts.indexOf(name);

  if (firstNameIndex >= 0) {
    for (const candidate of texts.slice(firstNameIndex + 1, firstNameIndex + 6)) {
      if (
        candidate &&
        candidate !== name &&
        candidate.length >= 8 &&
        candidate.length <= 180 &&
        !isExperienceNoise(candidate, name) &&
        !isDateLine(candidate) &&
        !EDUCATION_KEYWORDS.test(candidate)
      ) {
        return candidate;
      }
    }
  }

  const candidates = texts.filter(
    (text) =>
      text !== name &&
      text.length >= 15 &&
      text.length <= 180 &&
      !isExperienceNoise(text, name) &&
      (text.includes(" at ") || text.includes("|") || /founder|ceo|engineer|developer|director/i.test(text)),
  );

  return candidates[0];
}

function extractLocation(texts: string[], profileName?: string): string | undefined {
  return texts.find(
    (text) =>
      /,\s*[A-Za-z ]+,\s*(India|United States|United Kingdom|Canada|Australia)/.test(text) &&
      !text.includes("·") &&
      !text.includes("District") &&
      !isExperienceNoise(text, profileName),
  );
}

export function extractLinkedInProfile(raw: string, vanityName: string): LinkedInProfile {
  const texts = extractChildrenTexts(raw);
  const companyLogos = extractCompanyLogos(raw);

  const name = extractName(raw, texts);
  const headline = extractHeadline(texts, name, raw);
  const educations = extractEducations(texts);
  const profileImage = extractProfileImage(raw, name);
  const coverImage = extractCoverImage(raw);

  const profileUrl =
    texts.find((text) => text.includes(`linkedin.com/in/${vanityName}`)) ??
    `www.linkedin.com/in/${vanityName}`;

  return {
    name,
    headline,
    about: extractAbout(texts, name),
    location: extractLocation(texts, name),
    education: extractEducation(texts),
    educations,
    connections: extractConnections(texts),
    profileImage,
    coverImage,
    profileUrl,
    analytics: extractAnalytics(texts),
    experience: extractExperience(texts, raw, companyLogos, name),
    profileLanguage: texts.includes("English") ? "English" : undefined,
    openTo: extractOpenTo(texts),
  };
}
