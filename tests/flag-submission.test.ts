// La MISMA batería se ejecuta contra el código ANTES del refactoring y DESPUÉS,
// para comprobar que el comportamiento no cambió.
import { describe, test, expect } from "vitest";
import * as before from "../docs/antes/flag-submission";
import * as after from "../src/challenges/flag-submission";
import { newStore, sqlChallenge, NOW, FLAG } from "./helpers";

const versions = [
  { name: "ANTES del refactoring", impl: before },
  { name: "DESPUÉS del refactoring", impl: after },
];

for (const { name, impl } of versions) {
  describe(name, () => {
    // ---------- Casos correctos ----------
    test("correcto: bandera correcta sin pistas suma los puntos completos", () => {
      const store = newStore();
      const result = impl.submitFlag(store, "moi", "sqli-login", FLAG, 0, NOW);
      expect(result).toEqual({ ok: true, message: "¡Correcto! +100 puntos", points: 100 });
      expect(store.attempts).toHaveLength(1);
    });

    test("correcto: cada pista usada descuenta su penalización", () => {
      const store = newStore();
      expect(impl.submitFlag(store, "moi", "sqli-login", FLAG, 1, NOW).points).toBe(70);
    });

    test("correcto: el ranking ordena a los alumnos por puntaje total", () => {
      const store = newStore();
      impl.submitFlag(store, "ana", "sqli-login", FLAG, 1, NOW);
      impl.submitFlag(store, "moi", "sqli-login", FLAG, 0, NOW);
      expect(impl.recalculateRanking(store)).toEqual([
        { userId: "moi", total: 100 },
        { userId: "ana", total: 70 },
      ]);
    });

    // ---------- Datos inválidos ----------
    test("inválido: bandera incorrecta no suma y registra el intento fallido", () => {
      const store = newStore();
      const result = impl.submitFlag(store, "moi", "sqli-login", "FLAG{adivinando}", 0, NOW);
      expect(result).toEqual({ ok: false, message: "Bandera incorrecta", points: 0 });
      expect(store.attempts[0]?.correct).toBe(false);
    });

    test("inválido: bandera vacía o solo espacios se rechaza sin registrar intento", () => {
      const store = newStore();
      expect(impl.submitFlag(store, "moi", "sqli-login", "   ", 0, NOW).message).toBe("Bandera inválida");
      expect(store.attempts).toHaveLength(0);
    });

    test("inválido: reto inexistente o archivado", () => {
      const store = newStore(sqlChallenge({ active: false }));
      expect(impl.submitFlag(store, "moi", "sqli-login", FLAG, 0, NOW).message).toBe("Reto no encontrado");
      expect(impl.submitFlag(store, "moi", "no-existe", FLAG, 0, NOW).message).toBe("Reto no encontrado");
    });

    // ---------- Casos límite ----------
    test("límite: el puntaje nunca baja del 20 % aunque las pistas descuenten más", () => {
      const store = newStore(sqlChallenge({ hints: [
        { order: 1, text: "a", penalty: 50 }, { order: 2, text: "b", penalty: 45 },
      ] }));
      expect(impl.submitFlag(store, "moi", "sqli-login", FLAG, 2, NOW).points).toBe(20);
    });

    test("límite: bandera de exactamente 200 caracteres se evalúa; de 201 se rechaza", () => {
      const store = newStore();
      expect(impl.submitFlag(store, "moi", "sqli-login", "x".repeat(200), 0, NOW).message).toBe("Bandera incorrecta");
      expect(impl.submitFlag(store, "moi", "sqli-login", "x".repeat(201), 0, NOW).message).toBe("Bandera inválida");
    });

    test("límite: resolver dos veces el mismo reto no vuelve a sumar", () => {
      const store = newStore();
      impl.submitFlag(store, "moi", "sqli-login", FLAG, 0, NOW);
      const second = impl.submitFlag(store, "moi", "sqli-login", FLAG, 0, NOW);
      expect(second).toEqual({ ok: true, message: "Ya resolviste este reto", points: 0 });
      expect(impl.recalculateRanking(store)).toEqual([{ userId: "moi", total: 100 }]);
    });

    test("límite: declarar más pistas de las que tiene el reto solo descuenta las existentes", () => {
      const store = newStore();
      expect(impl.submitFlag(store, "moi", "sqli-login", FLAG, 5, NOW).points).toBe(45);
    });

    test("límite: si el docente cambia los puntos, el ranking se recalcula con el valor nuevo", () => {
      const store = newStore();
      impl.submitFlag(store, "moi", "sqli-login", FLAG, 1, NOW);
      store.challenges[0]!.points = 200;
      expect(impl.recalculateRanking(store)).toEqual([{ userId: "moi", total: 170 }]);
    });
  });
}
