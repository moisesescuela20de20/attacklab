import path from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app";
import { openDatabase } from "./db/database";

const env = process.env;
const PORT = Number(env.PORT) || 3000;
const HOST = env.HOST ?? "127.0.0.1";
const DB_FILE = env.ATTACKLAB_DB ?? path.resolve("data", "attacklab.db");
const production = env.NODE_ENV === "production";

const teacher = env.ATTACKLAB_TEACHER_EMAIL && env.ATTACKLAB_TEACHER_PASSWORD
  ? { name: env.ATTACKLAB_TEACHER_NAME ?? "Docente", email: env.ATTACKLAB_TEACHER_EMAIL, password: env.ATTACKLAB_TEACHER_PASSWORD }
  : undefined;
const demoUsers = env.ATTACKLAB_DEMO_USERS ? env.ATTACKLAB_DEMO_USERS === "true" : !production;

mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = openDatabase(DB_FILE, { demoUsers, teacher });

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dist/web");
const { app, auth } = createApp({ db, courseCode: env.ATTACKLAB_COURSE_CODE ?? "ET20-6-4", webDir });

setInterval(() => auth.pruneExpiredSessions(), 10 * 60_000).unref();

app.listen(PORT, HOST, () => {
  console.log(`AttackLab en http://${HOST}:${PORT}  (base: ${DB_FILE}${demoUsers ? ", con usuarios demo" : ""})`);
});
