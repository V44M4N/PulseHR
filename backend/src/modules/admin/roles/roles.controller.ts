import { Request, Response, NextFunction } from 'express';
import { rolesService } from './roles.service';
import { ok } from '../../../utils/response';
import type { UpdatePermissionsDTO } from './roles.schema';

export const rolesController = {
  getMatrix: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const matrix = await rolesService.getMatrix();
      res.json(ok(matrix));
    } catch (err) { next(err); }
  },

  updatePermissions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rolesService.updatePermissions(
        req.params.role,
        req.body as UpdatePermissionsDTO,
        req.user.sub,
      );
      res.json(ok(result));
    } catch (err) { next(err); }
  },
};
