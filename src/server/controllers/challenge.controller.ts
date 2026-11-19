import type { Response } from "express";
import type { ChallengeService } from "../services/challenge.service";
import type { AuthedRequest } from "../middlewares/auth";

const userId = (req: AuthedRequest): number => req.user!.id;
const challengeId = (req: AuthedRequest): string => String(req.params.id);

export function createChallengeController(service: ChallengeService) {
  return {
    list: async (req: AuthedRequest, res: Response) => { res.json(service.list(userId(req))); },
    detail: async (req: AuthedRequest, res: Response) => { res.json(service.detail(userId(req), challengeId(req))); },
    revealHint: async (req: AuthedRequest, res: Response) => { res.status(201).json(service.revealNextHint(userId(req), challengeId(req))); },
    submit: async (req: AuthedRequest, res: Response) => {
      const b = (req.body ?? {}) as { flag?: unknown };
      res.json(service.submitFlag(userId(req), challengeId(req), b.flag));
    },
    ranking: async (_req: AuthedRequest, res: Response) => { res.json(service.ranking()); },
  };
}
