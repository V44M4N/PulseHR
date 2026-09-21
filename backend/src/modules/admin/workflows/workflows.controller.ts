import { Request, Response, NextFunction } from 'express';
import { workflowsService } from './workflows.service';
import { ok } from '../../../utils/response';
import type { UpdateWorkflowDTO } from './workflows.schema';

export const workflowsController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await workflowsService.list();
      res.json(ok(data));
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await workflowsService.update(
        req.params.key,
        req.body as UpdateWorkflowDTO,
        req.user.sub,
      );
      res.json(ok(result));
    } catch (err) { next(err); }
  },
};
