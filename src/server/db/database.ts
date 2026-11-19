// Abre la base SQLite, crea las tablas y carga los datos iniciales.
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { hashPasswordSync } from "../services/password";
import { flagFor, sha256Hex } from "../flags";
import { CHALLENGES } from "./challenges.data";

// Se carga con require porque Vitest (Vite) todavía no reconoce el módulo "node:sqlite".
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

export type Database = DatabaseSyncType;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER NOT NULL CHECK (points > 0),
  mission TEXT NOT NULL,
  flag_hash TEXT NOT NULL,
  explanation TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS hints (
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  position INTEGER NOT NULL,
  text TEXT NOT NULL,
  penalty INTEGER NOT NULL CHECK (penalty >= 0),
  PRIMARY KEY (challenge_id, position)
);
CREATE TABLE IF NOT EXISTS hint_unlocks (
  user_id INTEGER NOT NULL REFERENCES users(id),
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  position INTEGER NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, challenge_id, position)
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  correct INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_challenge ON attempts (user_id, challenge_id, correct);
`;

export interface SeedOptions {
  /** Crea los usuarios de demostración (desactivar en producción). */
  demoUsers?: boolean;
  /** Docente inicial, por ejemplo desde variables de entorno. */
  teacher?: { name: string; email: string; password: string };
}

export function openDatabase(file = ":memory:", options: SeedOptions = { demoUsers: true }): Database {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  const initialized = db.prepare("SELECT 1 FROM settings WHERE key = 'flag_secret'").get();
  if (!initialized) inTransaction(db, () => seed(db, options));
  return db;
}

function inTransaction(db: Database, work: () => void): void {
  db.exec("BEGIN");
  try {
    work();
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function seed(db: Database, options: SeedOptions): void {
  const secret = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO settings (key, value) VALUES ('flag_secret', ?)").run(secret);

  const addChallenge = db.prepare("INSERT INTO challenges (id, title, category, difficulty, points, mission, flag_hash, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const addHint = db.prepare("INSERT INTO hints (challenge_id, position, text, penalty) VALUES (?, ?, ?, ?)");
  for (const c of CHALLENGES) {
    addChallenge.run(c.id, c.title, c.category, c.difficulty, c.points, c.mission, sha256Hex(flagFor(secret, c.id)), c.explanation);
    c.hints.forEach((h, i) => addHint.run(c.id, i + 1, h.text, h.penalty));
  }

  const now = new Date().toISOString();
  const addUser = db.prepare("INSERT INTO users (name, email, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)");
  if (options.teacher) {
    addUser.run(options.teacher.name, options.teacher.email.toLowerCase(), "teacher", hashPasswordSync(options.teacher.password), now);
  }
  if (options.demoUsers) {
    // Usuarios de demostración, documentados en el README. No usar en producción.
    if (!options.teacher) addUser.run("Docente Demo", "docente@attacklab.test", "teacher", hashPasswordSync("Docente#2026"), now);
    addUser.run("Moises Martinez", "moises@attacklab.test", "student", hashPasswordSync("Alumno#2026"), now);
    addUser.run("Ana Gomez", "ana@attacklab.test", "student", hashPasswordSync("Alumna#2026"), now);
  }
}
