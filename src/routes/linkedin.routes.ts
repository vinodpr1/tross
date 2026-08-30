import { Router } from "express";
import { getProfile } from "../controllers/linkedin.controller.js";

export function createLinkedInRoutes(): Router {
  const router = Router();
  router.post("/linkedin/profile", getProfile);
  return router;
}
