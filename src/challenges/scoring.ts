import type { Challenge } from "./types";

/** El puntaje de un reto resuelto nunca baja de este porcentaje de sus puntos. */
export const MIN_SCORE_RATIO = 0.2;

/**
 * Puntos que obtiene un alumno al resolver un reto, según las pistas que usó.
 * Cada pista usada (en orden) descuenta su penalización; el resultado nunca
 * baja del mínimo (MIN_SCORE_RATIO de los puntos del reto).
 */
export function calculateChallengeScore(
  challenge: Pick<Challenge, "points" | "hints">,
  hintsUsed: number,
): number {
  const chargedHints = challenge.hints.slice(0, Math.max(0, Math.ceil(hintsUsed)));
  const penalty = chargedHints.reduce((sum, hint) => sum + hint.penalty, 0);
  const score = challenge.points - penalty;
  const minimum = challenge.points * MIN_SCORE_RATIO;
  return score < minimum ? Math.round(minimum) : score;
}
