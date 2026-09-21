import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  ApplyLeaveSchema,
  RejectLeaveSchema,
  ListLeaveQuerySchema,
} from './leave.schema';
import * as controller from './leave.controller';

export const leaveRouter = Router();

// All leave routes require a valid JWT
leaveRouter.use(authenticate);

// ── GET /balances ─────────────────────────────────────────────────────────────
// All roles can view their own balances (year filtering via query param)
leaveRouter.get('/balances', controller.getBalances);

// ── GET /requests ─────────────────────────────────────────────────────────────
// All roles: own requests; HR/ADMIN: all requests
// Query params validated: page, limit, status, year
leaveRouter.get(
  '/requests',
  validate(ListLeaveQuerySchema, 'query'),
  controller.getRequests,
);

// ── POST /requests ────────────────────────────────────────────────────────────
// Any authenticated employee can apply for leave
leaveRouter.post(
  '/requests',
  validate(ApplyLeaveSchema),
  controller.apply,
);

// ── PUT /requests/:id/approve ─────────────────────────────────────────────────
// MANAGER, HR, ADMIN only
leaveRouter.put(
  '/requests/:id/approve',
  authorize('MANAGER', 'HR', 'ADMIN'),
  controller.approve,
);

// ── PUT /requests/:id/reject ──────────────────────────────────────────────────
// MANAGER, HR, ADMIN only; requires a rejection reason in body
leaveRouter.put(
  '/requests/:id/reject',
  authorize('MANAGER', 'HR', 'ADMIN'),
  validate(RejectLeaveSchema),
  controller.reject,
);

// ── PUT /requests/:id/cancel ──────────────────────────────────────────────────
// Any authenticated user — service layer enforces ownership check
leaveRouter.put('/requests/:id/cancel', controller.cancel);

// ── GET /team-calendar ────────────────────────────────────────────────────────
// MANAGER, HR, ADMIN — shows approved leaves for direct reports in current month
leaveRouter.get(
  '/team-calendar',
  authorize('MANAGER', 'HR', 'ADMIN'),
  controller.getTeamCalendar,
);
