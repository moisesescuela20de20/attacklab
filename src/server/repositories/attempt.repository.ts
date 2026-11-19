import type { Database } from "../db/database";

export function createAttemptRepository(db: Database) {
  const insert = db.prepare("INSERT INTO attempts (user_id, challenge_id, correct, hints_used, points_earned, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const solved = db.prepare("SELECT 1 FROM attempts WHERE user_id = ? AND challenge_id = ? AND correct = 1 LIMIT 1");
  const solvedIds = db.prepare("SELECT DISTINCT challenge_id FROM attempts WHERE user_id = ? AND correct = 1");
  const ranking = db.prepare(`
    SELECT u.id AS userId, u.name AS name, SUM(a.points_earned) AS total
    FROM attempts a JOIN users u ON u.id = a.user_id
    WHERE a.correct = 1 AND u.role = 'student'
    GROUP BY u.id ORDER BY total DESC, u.name`);
  const countUnlocks = db.prepare("SELECT COUNT(*) AS n FROM hint_unlocks WHERE user_id = ? AND challenge_id = ?");
  const unlock = db.prepare("INSERT OR IGNORE INTO hint_unlocks (user_id, challenge_id, position, unlocked_at) VALUES (?, ?, ?, ?)");

  return {
    add: (a: { userId: number; challengeId: string; correct: boolean; hintsUsed: number; points: number; date: string }) =>
      insert.run(a.userId, a.challengeId, a.correct ? 1 : 0, a.hintsUsed, a.points, a.date),
    hasSolved: (userId: number, challengeId: string) => solved.get(userId, challengeId) !== undefined,
    solvedChallengeIds: (userId: number) => (solvedIds.all(userId) as { challenge_id: string }[]).map((r) => r.challenge_id),
    ranking: () => ranking.all() as { userId: number; name: string; total: number }[],
    hintsUnlocked: (userId: number, challengeId: string) => (countUnlocks.get(userId, challengeId) as { n: number }).n,
    unlockHint: (userId: number, challengeId: string, position: number, date: string) => unlock.run(userId, challengeId, position, date),
  };
}
export type AttemptRepository = ReturnType<typeof createAttemptRepository>;
