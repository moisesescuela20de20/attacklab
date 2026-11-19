import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.retryAfter) res.set("Retry-After", String(err.retryAfter));
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (typeof err === "object" && err !== null && (err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "El cuerpo no es un JSON válido." } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado." } });
}
