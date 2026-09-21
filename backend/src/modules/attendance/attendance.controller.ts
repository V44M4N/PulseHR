import { Request, Response, NextFunction } from 'express';
import { ok } from '../../utils/response';
import { getPagination, buildMeta } from '../../utils/pagination';
import * as service from './attendance.service';
import type { ClockInInput, MonthQueryInput, ManualAttendanceInput, ListAttendanceQueryInput } from './attendance.schema';

// ── Clock-in ──────────────────────────────────────────────────────────────────

export const clockIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { notes } = req.body as ClockInInput;
    const record = await service.clockIn(req.user.employeeId, notes);
    res.status(201).json(ok(record));
  } catch (err) {
    next(err);
  }
};

// ── Clock-out ─────────────────────────────────────────────────────────────────

export const clockOut = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const record = await service.clockOut(req.user.employeeId);
    res.json(ok(record));
  } catch (err) {
    next(err);
  }
};

// ── Today ─────────────────────────────────────────────────────────────────────

export const getToday = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const record = await service.getToday(req.user.employeeId);
    res.json(ok(record));
  } catch (err) {
    next(err);
  }
};

// ── Current week ──────────────────────────────────────────────────────────────

export const getWeek = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const records = await service.getWeek(req.user.employeeId);
    res.json(ok(records));
  } catch (err) {
    next(err);
  }
};

// ── Monthly ───────────────────────────────────────────────────────────────────

export const getMonthly = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { month, year } = req.query as unknown as MonthQueryInput;
    const records = await service.getMonthly(req.user.employeeId, month, year);
    res.json(ok(records));
  } catch (err) {
    next(err);
  }
};

// ── List all (HR / ADMIN) ────────────────────────────────────────────────────

export const listAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = getPagination(req);
    const query = req.query as unknown as ListAttendanceQueryInput;

    const result = await service.listAll(
      { ...query, page, limit },
      req.user.role,
      req.user.employeeId,
    );

    const meta = buildMeta(result.page, result.limit, result.total);
    res.json(ok(result.records, meta));
  } catch (err) {
    next(err);
  }
};

// ── Manual upsert (HR / ADMIN) ───────────────────────────────────────────────

export const upsertManual = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = req.body as ManualAttendanceInput;
    const record = await service.upsertManual(input);
    res.json(ok(record));
  } catch (err) {
    next(err);
  }
};
