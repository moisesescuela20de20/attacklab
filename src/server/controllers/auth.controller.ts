import type { Response } from "express";
import type { AuthService } from "../services/auth.service";
import type { AuthedRequest } from "../middlewares/auth";

type Body = Record<string, unknown>;
const body = (req: AuthedRequest): Body => (req.body && typeof req.body === "object" ? req.body : {}) as Body;

export function createAuthController(auth: AuthService) {
  return {
    register: async (req: AuthedRequest, res: Response) => { res.status(201).json(await auth.register(body(req))); },
    login: async (req: AuthedRequest, res: Response) => { const b = body(req); res.json(await auth.login(b.email, b.password)); },
    logout: async (req: AuthedRequest, res: Response) => { if (req.token) auth.logout(req.token); res.status(204).end(); },
    me: async (req: AuthedRequest, res: Response) => { res.json(req.user); },
  };
}
