import type { Response } from "express";
import type { LabsService } from "../labs/labs.service";
import type { AuthedRequest } from "../middlewares/auth";

const b = (req: AuthedRequest) => (req.body ?? {}) as Record<string, unknown>;

export function createLabsController(labs: LabsService) {
  return {
    sqliLogin: async (req: AuthedRequest, res: Response) => { res.json(await labs.sqliLogin(b(req).username, b(req).password)); },
    xssSearch: async (req: AuthedRequest, res: Response) => { res.json(labs.xssSearch(req.query.q)); },
    weakPassword: async (req: AuthedRequest, res: Response) => { res.json(labs.weakPassword(b(req).username, b(req).password)); },
    idorProfile: async (req: AuthedRequest, res: Response) => { res.json(labs.idorProfile(String(req.params.id), req.user!.name)); },
  };
}
