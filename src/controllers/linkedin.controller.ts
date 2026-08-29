import type { Request, Response } from "express";
import { sendError } from "../utils/http.js";
import type { LinkedInService } from "../services/linkedin.service.js";

function readProfileUrl(req: Request): string | undefined {
  if (typeof req.body?.url === "string" && req.body.url.trim()) {
    return req.body.url;
  }

  const queryUrl = req.query.url;

  if (typeof queryUrl === "string" && queryUrl.trim()) {
    return queryUrl;
  }

  if (Array.isArray(queryUrl) && typeof queryUrl[0] === "string" && queryUrl[0].trim()) {
    return queryUrl[0];
  }

  return undefined;
}

export class LinkedInController {
  constructor(private readonly linkedInService: LinkedInService) {}

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profileUrl = readProfileUrl(req);

      if (!profileUrl) {
        res.status(400).json({
          error:
            "LinkedIn profile URL is required. Pass it as ?url=... or in the JSON body as { \"url\": \"...\" }.",
        });
        return;
      }

      const result = await this.linkedInService.getProfileByUrl(profileUrl);
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  };
}
