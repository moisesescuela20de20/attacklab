import type { Database } from "../db/database";
import type { Challenge, Hint } from "../../challenges/types";

interface ChallengeRow { id: string; title: string; category: string; difficulty: string; points: number; mission: string; flag_hash: string; explanation: string; active: number }
export type ChallengeRecord = Challenge & { category: string; difficulty: string; mission: string; explanation: string };

export function createChallengeRepository(db: Database) {
  const all = db.prepare("SELECT * FROM challenges WHERE active = 1 ORDER BY points");
  const one = db.prepare("SELECT * FROM challenges WHERE id = ?");
  const hintsOf = db.prepare("SELECT position, text, penalty FROM hints WHERE challenge_id = ? ORDER BY position");

  const toChallenge = (row: ChallengeRow): ChallengeRecord => ({
    id: row.id, title: row.title, category: row.category, difficulty: row.difficulty, mission: row.mission,
    points: row.points, flagHash: row.flag_hash, explanation: row.explanation, active: row.active === 1,
    hints: (hintsOf.all(row.id) as { position: number; text: string; penalty: number }[])
      .map((h): Hint => ({ order: h.position, text: h.text, penalty: h.penalty })),
  });

  return {
    findActive: () => (all.all() as unknown as ChallengeRow[]).map(toChallenge),
    findById: (id: string) => {
      const row = one.get(id) as ChallengeRow | undefined;
      return row ? toChallenge(row) : undefined;
    },
  };
}
export type ChallengeRepository = ReturnType<typeof createChallengeRepository>;
