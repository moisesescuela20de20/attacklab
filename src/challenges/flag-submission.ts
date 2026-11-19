import { createHash } from "node:crypto";
import type { Store, SubmissionResult, RankingEntry } from "./types";
import { calculateChallengeScore } from "./scoring";

export function submitFlag(
  store: Store,
  userId: string,
  challengeId: string,
  flag: string,
  hintsUsed: number,
  now: Date = new Date(),
): SubmissionResult {
  const ch = store.challenges.find((c) => c.id === challengeId);
  if (!ch || !ch.active) {
    return { ok: false, message: "Reto no encontrado", points: 0 };
  }
  if (typeof flag !== "string" || flag.trim().length === 0 || flag.length > 200) {
    return { ok: false, message: "Bandera inválida", points: 0 };
  }
  const already = store.attempts.find(
    (a) => a.userId === userId && a.challengeId === challengeId && a.correct,
  );
  const h = createHash("sha256").update(flag.trim()).digest("hex");
  if (h !== ch.flagHash) {
    store.attempts.push({
      userId, challengeId, correct: false, hintsUsed, pointsEarned: 0, date: now.toISOString(),
    });
    return { ok: false, message: "Bandera incorrecta", points: 0 };
  }
  if (already) {
    return { ok: true, message: "Ya resolviste este reto", points: 0 };
  }
  const p = calculateChallengeScore(ch, hintsUsed);
  store.attempts.push({
    userId, challengeId, correct: true, hintsUsed, pointsEarned: p, date: now.toISOString(),
  });
  return { ok: true, message: "¡Correcto! +" + p + " puntos", points: p };
}

// Recalcula el ranking con los puntos actuales de cada reto
// (por si el docente cambió los puntos o las pistas después).
export function recalculateRanking(store: Store): RankingEntry[] {
  const totals = new Map<string, number>();
  for (const a of store.attempts) {
    if (!a.correct) continue;
    const ch = store.challenges.find((c) => c.id === a.challengeId);
    if (!ch) continue;
    totals.set(a.userId, (totals.get(a.userId) ?? 0) + calculateChallengeScore(ch, a.hintsUsed));
  }
  return [...totals.entries()]
    .map(([userId, total]) => ({ userId, total }))
    .sort((x, y) => y.total - x.total);
}
