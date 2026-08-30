import { Router } from "express";
import { createLinkedInRoutes } from "./linkedin.routes.js";

export function createApiRouter(): Router {
  const router = Router();
  router.use(createLinkedInRoutes());
  return router;
}
