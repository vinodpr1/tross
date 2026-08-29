import { extractLinkedInProfile } from "../extractors/linkedin-profile.extractor.js";
import type { LinkedInRepository } from "../repositories/linkedin.repository.js";
import type { LinkedInProfile } from "../types/linkedin.js";
import { AppError } from "../utils/http.js";
import { parseLinkedInProfileUrl } from "../utils/linkedin-url.js";

export class LinkedInService {
  constructor(private readonly linkedInRepository: LinkedInRepository) {}

  async getProfileByUrl(profileUrl: string): Promise<LinkedInProfile> {
    const vanityName = parseLinkedInProfileUrl(profileUrl);
    return this.getProfileByVanityName(vanityName);
  }

  async getProfileByVanityName(vanityName: string): Promise<LinkedInProfile> {
    const normalizedVanityName = vanityName.trim().toLowerCase();

    if (!normalizedVanityName) {
      throw new AppError(400, "LinkedIn profile URL is required");
    }

    if (!/^[a-z0-9-]+$/i.test(normalizedVanityName)) {
      throw new AppError(400, "LinkedIn profile URL contains an invalid username");
    }

    const responses =
      await this.linkedInRepository.fetchProfileSections(normalizedVanityName);

    const combinedBody = responses.map((response) => response.body).join("\n");

    if (!combinedBody.trim()) {
      throw new AppError(502, "LinkedIn returned an empty response");
    }

    const profile = extractLinkedInProfile(combinedBody, normalizedVanityName);

    if (!profile.name && !profile.headline && !profile.experience.length) {
      throw new AppError(502, "Unable to extract profile data from LinkedIn response");
    }

    return profile;
  }
}
