import { Router } from "express";
import type { AuthService } from "../services/auth.service";
import type { ChallengeService } from "../services/challenge.service";
import type { LabsService } from "../labs/labs.service";
import type { UserRepository } from "../repositories/user.repository";
import { createAuthController } from "../controllers/auth.controller";
import { createChallengeController } from "../controllers/challenge.controller";
import { createLabsController } from "../controllers/labs.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler as h, rateLimit } from "../middlewares/common";
import { createRateLimiter } from "../services/rate-limiter";

export interface RouteDeps { auth: AuthService; challenges: ChallengeService; labs: LabsService; users: UserRepository }

export function createRoutes({ auth, challenges, labs, users }: RouteDeps): Router {
  const router = Router();
  const authCtl = createAuthController(auth);
  const chCtl = createChallengeController(challenges);
  const labsCtl = createLabsController(labs);
  const logged = requireAuth(auth);
  const registerLimit = rateLimit(createRateLimiter(10, 60 * 60_000));
  const labLimit = rateLimit(createRateLimiter(120, 60_000));

  router.get("/health", (_req, res) => { res.json({ status: "ok" }); });

  router.post("/auth/register", registerLimit, h(authCtl.register));
  router.post("/auth/login", h(authCtl.login));
  router.post("/auth/logout", logged, h(authCtl.logout));
  router.get("/auth/me", logged, h(authCtl.me));

  router.get("/challenges", logged, h(chCtl.list));
  router.get("/challenges/:id", logged, h(chCtl.detail));
  router.post("/challenges/:id/hints", logged, h(chCtl.revealHint));
  router.post("/challenges/:id/submissions", logged, labLimit, h(chCtl.submit));
  router.get("/ranking", logged, h(chCtl.ranking));

  // Laboratorios: apps vulnerables SIMULADAS y aisladas.
  router.post("/labs/sqli-login/login", logged, labLimit, h(labsCtl.sqliLogin));
  router.get("/labs/xss-search/search", logged, labLimit, h(labsCtl.xssSearch));
  router.post("/labs/weak-password/login", logged, labLimit, h(labsCtl.weakPassword));
  router.get("/labs/idor-profile/profiles/:id", logged, labLimit, h(labsCtl.idorProfile));

  router.get("/teacher/progress", logged, requireRole("teacher"), h(async (_req, res) => { res.json(users.studentProgress()); }));
  return router;
}
