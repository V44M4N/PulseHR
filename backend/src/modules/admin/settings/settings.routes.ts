import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { authorize } from '../../../middleware/rbac';
import { validate } from '../../../middleware/validate';
import { UpdateSettingSchema, GetSettingsByCategorySchema } from './settings.schema';
import { settingsController } from './settings.controller';

export const settingsRouter = Router();

// All settings endpoints require a valid JWT and ADMIN role
settingsRouter.use(authenticate);
settingsRouter.use(authorize('ADMIN'));

// GET  /admin/settings                   — all settings, grouped by category
settingsRouter.get(
  '/',
  settingsController.getAll,
);

// GET  /admin/settings/:category         — all settings for one category
settingsRouter.get(
  '/:category',
  validate(GetSettingsByCategorySchema, 'params'),
  settingsController.getByCategory,
);

// PUT  /admin/settings/:key              — upsert a single setting value
// :key is the full dot-notation key, e.g. "auth.mfa"
// Express does not allow dots in param segments by default, so the router
// must be mounted with { strict: false } or the calling router must use
// a wildcard.  We use a named wildcard segment here to capture the whole key.
settingsRouter.put(
  '/:key(*)',
  validate(UpdateSettingSchema),
  settingsController.update,
);
