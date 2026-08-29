import { env } from "../config/env.js";
import { AppError } from "../utils/http.js";

export interface LinkedInFetchResult {
  body: string;
  status: number;
  contentType: string;
}

export interface LinkedInFetchResult {
  body: string;
  status: number;
  contentType: string;
}

type ProfileSection = "experience" | "education" | "skills";

export class LinkedInRepository {
  async fetchProfileByVanityName(vanityName: string): Promise<LinkedInFetchResult> {
    return this.fetchSection(vanityName);
  }

  async fetchProfileSections(vanityName: string): Promise<LinkedInFetchResult[]> {
    const sections: Array<ProfileSection | undefined> = [
      undefined,
      "experience",
      "education",
    ];

    return Promise.all(sections.map((section) => this.fetchSection(vanityName, section)));
  }

  private async fetchSection(
    vanityName: string,
    section?: ProfileSection,
  ): Promise<LinkedInFetchResult> {
    const cookie = this.buildCookieHeader();
    const csrfToken = this.getCsrfToken();

    if (!cookie || !csrfToken) {
      throw new AppError(
        500,
        "LinkedIn credentials are not configured. Set LINKEDIN_COOKIE or LINKEDIN_LI_AT + LINKEDIN_JSESSIONID.",
      );
    }

    const path = section
      ? `/flagship-web/in/${encodeURIComponent(vanityName)}/details/${section}/`
      : `/flagship-web/in/${encodeURIComponent(vanityName)}/`;

    const response = await fetch(`https://www.linkedin.com${path}`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        cookie,
        "csrf-token": csrfToken,
        origin: "https://www.linkedin.com",
        referer: `https://www.linkedin.com/in/${vanityName}/`,
        "user-agent": env.linkedin.userAgent,
        "x-li-prefetch": "true",
        "x-li-rsc-stream": "true",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({
        requestedArguments: {
          payload: {
            vanityName,
            isVanityNameResolved: true,
          },
          states: [],
          requestMetadata: {
            $type: "proto.sdui.common.RequestMetadata",
          },
          screenId: "",
          knownTemplateIds: [],
        },
        isPrefetch: true,
      }),
    });

    const body = await response.text();

    if (!response.ok) {
      throw new AppError(
        response.status,
        `LinkedIn request failed with status ${response.status}`,
      );
    }

    return {
      body,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "text/plain",
    };
  }

  private buildCookieHeader(): string {
    if (env.linkedin.cookie) {
      return env.linkedin.cookie;
    }

    const parts: string[] = [];

    if (env.linkedin.jsessionId) {
      parts.push(`JSESSIONID="${env.linkedin.jsessionId.replace(/^"|"$/g, "")}"`);
    }

    if (env.linkedin.liAt) {
      parts.push(`li_at=${env.linkedin.liAt}`);
    }

    if (env.linkedin.bscookie) {
      parts.push(`bscookie="${env.linkedin.bscookie}"`);
    }

    if (env.linkedin.liTheme) {
      parts.push(`li_theme=${env.linkedin.liTheme}`);
    }

    return parts.join("; ");
  }

  private getCsrfToken(): string {
    if (env.linkedin.csrfToken) {
      return env.linkedin.csrfToken.replace(/^"|"$/g, "");
    }

    if (env.linkedin.jsessionId) {
      return env.linkedin.jsessionId.replace(/^"|"$/g, "");
    }

    const jsessionMatch = env.linkedin.cookie.match(/JSESSIONID="([^"]+)"/);

    if (jsessionMatch?.[1]) {
      return jsessionMatch[1];
    }

    return "";
  }
}
