import { Request, Response, NextFunction } from 'express';
import { auditLogsService } from './audit-logs.service';
import { ok } from '../../../utils/response';
import { getPagination } from '../../../utils/pagination';
import type { ListAuditLogsQuery } from './audit-logs.schema';

export const auditLogsController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = getPagination(req);
      const query = req.query as ListAuditLogsQuery;
      const result = await auditLogsService.list(query, page, limit, skip);
      res.json(ok(result.logs, result.meta));
    } catch (err) {
      next(err);
    }
  },
};
