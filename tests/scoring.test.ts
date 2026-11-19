// Tests unitarios de la función nueva calculateChallengeScore.
import { describe, test, expect } from "vitest";
import { calculateChallengeScore, MIN_SCORE_RATIO } from "../src/challenges/scoring";
import type { Challenge } from "../src/challenges/types";

const challenge = (points: number, penalties: number[]): Pick<Challenge, "points" | "hints"> => ({
  points,
  hints: penalties.map((penalty, i) => ({ order: i + 1, text: `pista ${i + 1}`, penalty })),
});

describe("calculateChallengeScore", () => {
  test("correcto: sin pistas devuelve los puntos del reto", () => {
    expect(calculateChallengeScore(challenge(100, [30, 25]), 0)).toBe(100);
  });

  test("correcto: descuenta las pistas en orden", () => {
    expect(calculateChallengeScore(challenge(100, [30, 25]), 2)).toBe(45);
  });

  test("inválido: una cantidad negativa o NaN de pistas no descuenta nada", () => {
    expect(calculateChallengeScore(challenge(100, [30]), -3)).toBe(100);
    expect(calculateChallengeScore(challenge(100, [30]), Number.NaN)).toBe(100);
  });

  test("límite: justo en el mínimo del 20 % no se modifica", () => {
    expect(calculateChallengeScore(challenge(100, [80]), 1)).toBe(20);
    expect(MIN_SCORE_RATIO).toBe(0.2);
  });

  test("límite: un mínimo con decimales se redondea (99 puntos → 19,8 → 20)", () => {
    expect(calculateChallengeScore(challenge(99, [90]), 1)).toBe(20);
  });
});

// Equivalencia: compara la función nueva con el bucle original sobre 5000 casos al azar.
function legacyScore(points: number, penalties: number[], hintsUsed: number): number {
  let p = points;
  for (let i = 0; i < hintsUsed && i < penalties.length; i++) p = p - (penalties[i] ?? 0);
  if (p < points * 0.2) p = Math.round(points * 0.2);
  return p;
}

test("equivalencia: 5000 combinaciones al azar dan el mismo puntaje que el código original", () => {
  let seed = 7;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const hintOptions = [-2, -1, 0, 0.5, 1, 1.5, 2, 3, 10, Number.NaN, Number.POSITIVE_INFINITY];
  for (let n = 0; n < 5000; n++) {
    const points = Math.floor(rand() * 500);
    const penalties = Array.from({ length: Math.floor(rand() * 5) }, () => Math.floor(rand() * 200));
    const hintsUsed = hintOptions[Math.floor(rand() * hintOptions.length)]!;
    expect(calculateChallengeScore(challenge(points, penalties), hintsUsed)).toBe(legacyScore(points, penalties, hintsUsed));
  }
});
