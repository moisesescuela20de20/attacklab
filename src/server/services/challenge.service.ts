// Reglas de negocio de los retos: listado, pistas, envío de bandera y ranking.
import { createHash, timingSafeEqual } from "node:crypto";
import type { ChallengeRepository } from "../repositories/challenge.repository";
import type { AttemptRepository } from "../repositories/attempt.repository";
import { calculateChallengeScore } from "../../challenges/scoring";
import { notFound, validationError } from "../errors";

export const MAX_FLAG_LENGTH = 200;

const sha256 = (text: string): Buffer => createHash("sha256").update(text).digest();

/** Compara en tiempo constante para no filtrar información por el tiempo de respuesta. */
function flagMatches(flag: string, storedHash: string): boolean {
  return timingSafeEqual(sha256(flag), Buffer.from(storedHash, "hex"));
}

export function createChallengeService(
  challenges: ChallengeRepository,
  attempts: AttemptRepository,
  now: () => Date = () => new Date(),
) {
  function getActive(id: string) {
    const challenge = challenges.findById(id);
    if (!challenge || !challenge.active) throw notFound("Reto");
    return challenge;
  }

  return {
    /** Lista para el alumno: nunca incluye la bandera ni el texto de las pistas. */
    list(userId: number) {
      const solved = new Set(attempts.solvedChallengeIds(userId));
      return challenges.findActive().map((c) => ({
        id: c.id, title: c.title, category: c.category, difficulty: c.difficulty,
        points: c.points, totalHints: c.hints.length, solved: solved.has(c.id),
      }));
    },

    /** Detalle de un reto: misión, pistas ya desbloqueadas y, si lo resolvió, la explicación. */
    detail(userId: number, challengeId: string) {
      const c = getActive(challengeId);
      const unlocked = attempts.hintsUnlocked(userId, challengeId);
      const solved = attempts.hasSolved(userId, challengeId);
      return {
        id: c.id, title: c.title, category: c.category, difficulty: c.difficulty, points: c.points, mission: c.mission,
        totalHints: c.hints.length,
        hints: c.hints.slice(0, unlocked).map((h) => ({ position: h.order, text: h.text, penalty: h.penalty })),
        nextHintPenalty: c.hints[unlocked]?.penalty ?? null,
        potentialPoints: calculateChallengeScore(c, unlocked),
        solved,
        explanation: solved ? c.explanation : null,
      };
    },

    /** Desbloquea la siguiente pista. El servidor lleva la cuenta: el cliente no la informa. */
    revealNextHint(userId: number, challengeId: string) {
      const challenge = getActive(challengeId);
      const unlocked = attempts.hintsUnlocked(userId, challengeId);
      const next = challenge.hints[unlocked];
      if (!next) throw validationError([{ field: "hints", message: "No quedan pistas en este reto." }]);
      attempts.unlockHint(userId, challengeId, next.order, now().toISOString());
      return { position: next.order, text: next.text, penalty: next.penalty, remaining: challenge.hints.length - unlocked - 1 };
    },

    submitFlag(userId: number, challengeId: string, flag: unknown) {
      const challenge = getActive(challengeId);
      if (typeof flag !== "string" || !flag.trim() || flag.length > MAX_FLAG_LENGTH) {
        throw validationError([{ field: "flag", message: `La bandera es obligatoria y admite hasta ${MAX_FLAG_LENGTH} caracteres.` }]);
      }
      const hintsUsed = attempts.hintsUnlocked(userId, challengeId);
      const date = now().toISOString();
      if (!flagMatches(flag.trim(), challenge.flagHash)) {
        attempts.add({ userId, challengeId, correct: false, hintsUsed, points: 0, date });
        return { correct: false, points: 0, message: "Bandera incorrecta." };
      }
      if (attempts.hasSolved(userId, challengeId)) {
        return { correct: true, points: 0, message: "Ya resolviste este reto." };
      }
      const points = calculateChallengeScore(challenge, hintsUsed);
      attempts.add({ userId, challengeId, correct: true, hintsUsed, points, date });
      return { correct: true, points, message: `¡Correcto! +${points} puntos.`, explanation: challenge.explanation };
    },

    ranking: () => attempts.ranking(),
  };
}
export type ChallengeService = ReturnType<typeof createChallengeService>;
