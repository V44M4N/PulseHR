import { Request, Response, NextFunction } from 'express';
import { ok } from '../../utils/response';
import { getPagination } from '../../utils/pagination';
import * as leaveService from './leave.service';
import { ApplyLeaveDto, ListLeaveQueryDto, RejectLeaveDto } from './leave.schema';

// ── GET /balances ─────────────────────────────────────────────────────────────

export const getBalances = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const data = await leaveService.getBalances(req.user.employeeId, year);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── GET /requests ─────────────────────────────────────────────────────────────

export const getRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = getPagination(req);
    const query = req.query as unknown as ListLeaveQueryDto;
    const role = req.user.role as 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

    const { data, meta } = await leaveService.getRequests(
      req.user.employeeId,
      role,
      query,
      page,
      limit,
    );

    res.json(ok(data, meta));
  } catch (err) {
    next(err);
  }
};

// ── POST /requests ────────────────────────────────────────────────────────────

export const apply = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto = req.body as ApplyLeaveDto;
    const data = await leaveService.apply(req.user.employeeId, dto);
    res.status(201).json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── PUT /requests/:id/approve ─────────────────────────────────────────────────

export const approve = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await leaveService.approve(req.params.id, req.user.employeeId);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── PUT /requests/:id/reject ──────────────────────────────────────────────────

export const reject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto = req.body as RejectLeaveDto;
    const data = await leaveService.reject(req.params.id, req.user.employeeId, dto);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── PUT /requests/:id/cancel ──────────────────────────────────────────────────

export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await leaveService.cancel(req.params.id, req.user.employeeId);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── GET /team-calendar ────────────────────────────────────────────────────────

export const getTeamCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await leaveService.getTeamCalendar(req.user.employeeId);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};
