import type { Request, Response, NextFunction } from "express";
import type { AuthService, SessionUser } from "../services/auth.service";
import { forbidden, unauthorized } from "../errors";

export interface AuthedRequest extends Request { user?: SessionUser; token?: string }

/** Exige "Authorization: Bearer <token>" y deja el usuario en req.user. */
export const requireAuth = (auth: AuthService) => (req: AuthedRequest, _res: Response, next: NextFunction): void => {
  const header = req.get("Authorization") ?? "";
  const match = /^Bearer ([a-f0-9]{64})$/.exec(header);
  if (!match?.[1]) return next(unauthorized());
  try {
    req.user = auth.authenticate(match[1]);
    req.token = match[1];
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (role: SessionUser["role"]) => (req: AuthedRequest, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== role) return next(forbidden());
  next();
};
