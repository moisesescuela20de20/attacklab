// Registro, inicio de sesión y sesiones.
import { randomBytes } from "node:crypto";
import type { UserRepository } from "../repositories/user.repository";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";
import { createRateLimiter } from "./rate-limiter";
import { conflict, tooManyRequests, unauthorized, validationError } from "../errors";

const SESSION_HOURS = 8;
export const MAX_FAILED_LOGINS = 5;
const LOCK_WINDOW_MS = 15 * 60_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SessionUser { id: number; name: string; role: "student" | "teacher" }
export interface AuthOptions { courseCode: string; now?: () => Date }

export function createAuthService(users: UserRepository, options: AuthOptions) {
  const now = options.now ?? (() => new Date());
  const sessions = new Map<string, { userId: number; expiresAt: number }>();
  const failedLogins = createRateLimiter(MAX_FAILED_LOGINS, LOCK_WINDOW_MS, () => now().getTime());

  const toSession = (u: { id: number; name: string; role: "student" | "teacher" }): SessionUser => ({ id: u.id, name: u.name, role: u.role });

  function createSession(userId: number): string {
    const token = randomBytes(32).toString("hex");
    sessions.set(token, { userId, expiresAt: now().getTime() + SESSION_HOURS * 3600_000 });
    return token;
  }

  return {
    async register(input: { name?: unknown; email?: unknown; password?: unknown; courseCode?: unknown }) {
      const errors: { field: string; message: string }[] = [];
      const name = typeof input.name === "string" ? input.name.trim() : "";
      const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
      const password = typeof input.password === "string" ? input.password : "";
      if (name.length < 2 || name.length > 60) errors.push({ field: "name", message: "El nombre debe tener entre 2 y 60 caracteres." });
      if (!EMAIL_RE.test(email) || email.length > 120) errors.push({ field: "email", message: "El correo no es válido." });
      if (password.length < 8 || password.length > 128) errors.push({ field: "password", message: "La contraseña debe tener entre 8 y 128 caracteres." });
      if (input.courseCode !== options.courseCode) errors.push({ field: "courseCode", message: "El código de curso no es correcto. Pedíselo a tu docente." });
      if (errors.length) throw validationError(errors);
      if (users.findByEmail(email)) throw conflict("Ya existe una cuenta con ese correo.");
      const id = users.insertStudent(name, email, await hashPassword(password));
      return { token: createSession(id), user: toSession({ id, name, role: "student" }) };
    },

    async login(email: unknown, password: unknown): Promise<{ token: string; user: SessionUser }> {
      if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password || password.length > 128) {
        throw validationError([{ field: "credentials", message: "Correo y contraseña son obligatorios." }]);
      }
      const key = email.trim().toLowerCase();
      const wait = failedLogins.retryAfter(key);
      if (wait > 0) throw tooManyRequests(wait);

      const user = users.findByEmail(key);
      // Siempre se calcula un hash, exista o no el correo: el tiempo de respuesta no revela cuáles existen.
      const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
      if (!user || !valid) {
        failedLogins.record(key);
        throw unauthorized("Correo o contraseña incorrectos.");
      }
      failedLogins.reset(key);
      return { token: createSession(user.id), user: toSession(user) };
    },

    authenticate(token: string): SessionUser {
      const session = sessions.get(token);
      if (!session || session.expiresAt < now().getTime()) {
        sessions.delete(token);
        throw unauthorized("La sesión no es válida o venció.");
      }
      const user = users.findById(session.userId);
      if (!user) throw unauthorized();
      return toSession(user);
    },

    logout(token: string): void {
      sessions.delete(token);
    },

    /** Borra las sesiones vencidas (se llama periódicamente). */
    pruneExpiredSessions(): number {
      let removed = 0;
      for (const [token, s] of sessions) {
        if (s.expiresAt < now().getTime()) { sessions.delete(token); removed++; }
      }
      return removed;
    },
  };
}
export type AuthService = ReturnType<typeof createAuthService>;
