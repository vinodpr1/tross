import { Router } from "express";
import { linkedInController } from "../container.js";
import { createLinkedInRoutes } from "./linkedin.routes.js";

export function createApiRouter(): Router {
  const router = Router();
  router.use(createLinkedInRoutes(linkedInController));
  return router;
}
