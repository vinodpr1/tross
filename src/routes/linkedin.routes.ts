import { Router } from "express";
import type { LinkedInController } from "../controllers/linkedin.controller.js";

export function createLinkedInRoutes(linkedInController: LinkedInController): Router {
  const router = Router();

  router.get("/linkedin/profile", linkedInController.getProfile);
  router.post("/linkedin/profile", linkedInController.getProfile);

  return router;
}
