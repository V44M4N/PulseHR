import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { ok } from '../../../utils/response';
import type { UpdateSettingDTO } from './settings.schema';

export const settingsController = {
  /**
   * GET /admin/settings
   * Returns all settings grouped by category.
   */
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await settingsService.getAll();
      res.json(ok(data));
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /admin/settings/:category
   * Returns all settings rows for one category.
   */
  getByCategory: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await settingsService.getByCategory(req.params.category);
      res.json(ok(data));
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /admin/settings/:category/:key
   * Returns a single setting by its full dot-notation key
   * (key = category + "." + remainder, e.g. "auth.mfa").
   */
  getOne: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `${req.params.category}.${req.params.key}`;
      const data = await settingsService.getOne(key);
      res.json(ok(data));
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /admin/settings/:key
   * Upsert a setting value. :key uses dot notation encoded as URL path
   * (the router mounts this under /:key with the full dot-notation key).
   */
  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await settingsService.update(
        req.params.key,
        req.body as UpdateSettingDTO,
        req.user.sub,
      );
      res.json(ok(result));
    } catch (err) {
      next(err);
    }
  },
};
