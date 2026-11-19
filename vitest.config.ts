import { defineConfig } from "vitest/config";

// Configuración propia de los tests (el frontend usa vite.config.ts con root "web").
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
