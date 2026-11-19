// Ejecuta una consulta en el hilo aislado, con tiempo y memoria limitados.
import { Worker } from "node:worker_threads";

export interface SandboxResult { ok: boolean; rows?: Record<string, unknown>[]; error?: string; timedOut?: boolean }

export const SANDBOX_TIMEOUT_MS = 300;
const WORKER_URL = new URL("./sql-sandbox.worker.mjs", import.meta.url);

export function runSandboxQuery(query: string, timeoutMs = SANDBOX_TIMEOUT_MS): Promise<SandboxResult> {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_URL, {
      workerData: { query },
      resourceLimits: { maxOldGenerationSizeMb: 32, maxYoungGenerationSizeMb: 8 },
      execArgv: [],
    });
    let settled = false;
    const finish = (result: SandboxResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, timedOut: true, error: "La consulta tardó demasiado y se canceló." }), timeoutMs);
    worker.once("message", (msg: SandboxResult) => finish(msg));
    worker.once("error", (err: Error) => finish({ ok: false, error: err.message }));
    worker.once("exit", (code) => finish({ ok: false, error: `El laboratorio terminó inesperadamente (${code}).` }));
  });
}
