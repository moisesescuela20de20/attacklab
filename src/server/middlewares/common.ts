import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { RateLimiter } from "../services/rate-limiter";
import type { AuthedRequest } from "./auth";
import { tooManyRequests } from "../errors";

/** Pasa al manejador de errores lo que lance una función async (Express 4 no lo hace solo). */
export const asyncHandler = (fn: (req: AuthedRequest, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req as AuthedRequest, res).catch(next); };

/** Encabezados de seguridad básicos. */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
}

/** Limita pedidos por usuario (o por IP si no hay sesión). */
export const rateLimit = (limiter: RateLimiter) => (req: AuthedRequest, _res: Response, next: NextFunction): void => {
  const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  const wait = limiter.retryAfter(key);
  if (wait > 0) return next(tooManyRequests(wait));
  limiter.record(key);
  next();
};
