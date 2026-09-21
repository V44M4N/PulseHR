import { Request, Response, NextFunction } from 'express';
import { directoryService } from './directory.service';
import { ok } from '../../utils/response';
import type { DirectoryQuery } from './directory.schema';

export const directoryController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await directoryService.list(req.query as unknown as DirectoryQuery);
      res.json(ok(result.employees, result.meta));
    } catch (err) {
      next(err);
    }
  },

  getOrgChart: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tree = await directoryService.getOrgChart();
      res.json(ok(tree));
    } catch (err) {
      next(err);
    }
  },
};
