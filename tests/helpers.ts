import { createHash } from "node:crypto";
import type { Challenge, Store } from "../src/challenges/types";

export const hash = (text: string): string => createHash("sha256").update(text).digest("hex");

/** Reto de inyección SQL: 100 puntos y dos pistas de 30 y 25 puntos. */
export function sqlChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: "sqli-login",
    title: "Inyección SQL en un login falso",
    points: 100,
    flagHash: hash("FLAG{or_1_igual_1}"),
    hints: [
      { order: 1, text: "Probá con una comilla simple", penalty: 30 },
      { order: 2, text: "¿Qué pasa si la condición siempre es verdadera?", penalty: 25 },
    ],
    active: true,
    ...overrides,
  };
}

export function newStore(...challenges: Challenge[]): Store {
  return { challenges: challenges.length ? challenges : [sqlChallenge()], attempts: [] };
}

export const NOW = new Date("2026-11-19T15:00:00.000Z");
export const FLAG = "FLAG{or_1_igual_1}";
