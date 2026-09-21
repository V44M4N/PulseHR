import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { ok } from '../../utils/response';

export const analyticsController = {
  getHeadcountTrend: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getHeadcountTrend();
      res.json(ok(data));
    } catch (err) { next(err); }
  },

  getAttritionByDept: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getAttritionByDept();
      res.json(ok(data));
    } catch (err) { next(err); }
  },

  getKpis: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getKpis();
      res.json(ok(data));
    } catch (err) { next(err); }
  },
};
