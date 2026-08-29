import { AppError } from "./http.js";

const LINKEDIN_PROFILE_PATH = /^\/in\/([^/]+)\/?/i;

export function parseLinkedInProfileUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new AppError(400, "LinkedIn profile URL is required");
  }

  let url: URL;

  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new AppError(400, "Invalid LinkedIn profile URL");
  }

  const host = url.hostname.replace(/^www\./i, "");

  if (host !== "linkedin.com") {
    throw new AppError(400, "URL must be a linkedin.com profile link");
  }

  const match = url.pathname.match(LINKEDIN_PROFILE_PATH);

  if (!match?.[1]) {
    throw new AppError(
      400,
      "URL must point to a LinkedIn profile (e.g. https://www.linkedin.com/in/username/)",
    );
  }

  const vanityName = decodeURIComponent(match[1]).toLowerCase();

  if (!/^[a-z0-9-]+$/i.test(vanityName)) {
    throw new AppError(400, "LinkedIn profile URL contains an invalid username");
  }

  return vanityName;
}
