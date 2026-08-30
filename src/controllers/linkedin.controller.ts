import type { Request, Response } from "express";
import { getProfileByUrl } from "../services/linkedin.service.js";
import { sendError } from "../utils/http.js";

function readProfileUrl(req: Request): string | undefined {
  if (typeof req.body?.url === "string" && req.body.url.trim()) {
    return req.body.url;
  }
  return undefined;
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const profileUrl = readProfileUrl(req);

    if (!profileUrl) {
      res.status(400).json({
        error:
          'LinkedIn profile URL is required. Pass it as ?url=... or in the JSON body as { "url": "..." }.',
      });
      return;
    }

    const result = await getProfileByUrl(profileUrl);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}
