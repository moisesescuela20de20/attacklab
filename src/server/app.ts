// Conecta las capas: routes -> controllers -> services -> repositories -> SQLite.
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { openDatabase, type Database } from "./db/database";
import { createUserRepository } from "./repositories/user.repository";
import { createChallengeRepository } from "./repositories/challenge.repository";
import { createAttemptRepository } from "./repositories/attempt.repository";
import { createAuthService, type AuthService } from "./services/auth.service";
import { createChallengeService } from "./services/challenge.service";
import { createLabsService } from "./labs/labs.service";
import { getFlagSecret } from "./flags";
import { createRoutes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";
import { securityHeaders } from "./middlewares/common";

export interface AppOptions {
  db?: Database;
  now?: () => Date;
  courseCode?: string;
  /** Carpeta con el frontend compilado (opcional). */
  webDir?: string;
}

export function createApp(options: AppOptions = {}) {
  const db = options.db ?? openDatabase();
  const now = options.now ?? (() => new Date());
  const users = createUserRepository(db);
  const auth: AuthService = createAuthService(users, { courseCode: options.courseCode ?? "ET20-6-4", now });
  const challenges = createChallengeService(createChallengeRepository(db), createAttemptRepository(db), now);
  const secret = getFlagSecret(db);
  const labs = createLabsService(() => secret);

  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(express.json({ limit: "10kb" }));
  app.use("/api", createRoutes({ auth, challenges, labs, users }));
  app.use("/api", (req, res) => { res.status(404).json({ error: { code: "ROUTE_NOT_FOUND", message: `No existe ${req.method} /api${req.path}.` } }); });

  if (options.webDir && existsSync(options.webDir)) {
    app.use(express.static(options.webDir, { index: "index.html", maxAge: "1h" }));
    app.get("*", (_req, res) => { res.sendFile(path.join(options.webDir!, "index.html")); });
  }
  app.use(errorHandler);
  return { app, auth };
}
