import type { Database } from "../db/database";

export interface UserRow { id: number; name: string; email: string; role: "student" | "teacher"; password_hash: string }

export function createUserRepository(db: Database) {
  const byEmail = db.prepare("SELECT id, name, email, role, password_hash FROM users WHERE email = ?");
  const byId = db.prepare("SELECT id, name, email, role, password_hash FROM users WHERE id = ?");
  const insert = db.prepare("INSERT INTO users (name, email, role, password_hash, created_at) VALUES (?, ?, 'student', ?, ?)");
  const progress = db.prepare(`
    SELECT u.id, u.name, u.email,
      COALESCE(SUM(CASE WHEN a.correct = 1 THEN a.points_earned END), 0) AS points,
      COUNT(DISTINCT CASE WHEN a.correct = 1 THEN a.challenge_id END) AS solved,
      COUNT(a.id) AS attempts
    FROM users u LEFT JOIN attempts a ON a.user_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id ORDER BY points DESC, u.name`);
  return {
    findByEmail: (email: string) => byEmail.get(email) as UserRow | undefined,
    findById: (id: number) => byId.get(id) as UserRow | undefined,
    insertStudent: (name: string, email: string, passwordHash: string) =>
      Number(insert.run(name, email, passwordHash, new Date().toISOString()).lastInsertRowid),
    studentProgress: () => progress.all() as { id: number; name: string; email: string; points: number; solved: number; attempts: number }[],
  };
}
export type UserRepository = ReturnType<typeof createUserRepository>;
