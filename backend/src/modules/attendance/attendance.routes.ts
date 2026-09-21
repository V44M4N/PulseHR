import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  ClockInSchema,
  MonthQuerySchema,
  ManualAttendanceSchema,
  ListAttendanceQuerySchema,
} from './attendance.schema';
import * as controller from './attendance.controller';

export const attendanceRouter = Router();

// All routes require a valid JWT
attendanceRouter.use(authenticate);

// ── Employee-accessible routes ────────────────────────────────────────────────

/** POST /attendance/clock-in — clock in for today (all roles) */
attendanceRouter.post(
  '/clock-in',
  validate(ClockInSchema, 'body'),
  controller.clockIn,
);

/** POST /attendance/clock-out — clock out for today (all roles) */
attendanceRouter.post('/clock-out', controller.clockOut);

/** GET /attendance/today — today's record for the authenticated employee */
attendanceRouter.get('/today', controller.getToday);

/** GET /attendance/week — Mon-Sun records for the current week */
attendanceRouter.get('/week', controller.getWeek);

/** GET /attendance/monthly?month=&year= — full month records */
attendanceRouter.get(
  '/monthly',
  validate(MonthQuerySchema, 'query'),
  controller.getMonthly,
);

// ── HR / ADMIN routes ─────────────────────────────────────────────────────────

/**
 * GET /attendance — paginated list of all employees' attendance records.
 * Supports query filters: employeeId, status, from, to, page, limit.
 */
attendanceRouter.get(
  '/',
  authorize('HR', 'ADMIN'),
  validate(ListAttendanceQuerySchema, 'query'),
  controller.listAll,
);

/**
 * POST /attendance/manual — HR/ADMIN upsert an attendance record manually.
 */
attendanceRouter.post(
  '/manual',
  authorize('HR', 'ADMIN'),
  validate(ManualAttendanceSchema, 'body'),
  controller.upsertManual,
);
