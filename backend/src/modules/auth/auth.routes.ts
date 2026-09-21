import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { LoginSchema, RefreshSchema } from './auth.schema';
import * as authController from './auth.controller';

export const authRouter = Router();

// ── Public routes ─────────────────────────────────────────────────────────────

authRouter.post(
  '/login',
  validate(LoginSchema),
  authController.login,
);

authRouter.post(
  '/refresh',
  validate(RefreshSchema),
  authController.refresh,
);

// ── Protected routes ──────────────────────────────────────────────────────────

authRouter.post(
  '/logout',
  authenticate,
  authController.logout,
);

authRouter.get(
  '/me',
  authenticate,
  authController.me,
);
