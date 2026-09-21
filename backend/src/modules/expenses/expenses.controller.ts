import { Request, Response, NextFunction } from 'express';
import { ok } from '../../utils/response';
import { getPagination } from '../../utils/pagination';
import * as service from './expenses.service';
import type { CreateExpenseDto, RejectExpenseDto, ListExpensesQueryDto } from './expenses.schema';

// ── List ──────────────────────────────────────────────────────────────────────

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = getPagination(req);
    const query = req.query as unknown as ListExpensesQueryDto;
    const { expenses, meta } = await service.list(
      req.user.employeeId,
      req.user.role,
      { ...query, page, limit },
    );
    res.json(ok(expenses, meta));
  } catch (err) {
    next(err);
  }
};

// ── Get By ID ─────────────────────────────────────────────────────────────────

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await service.getById(req.params.id, req.user.employeeId, req.user.role);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── Create ────────────────────────────────────────────────────────────────────

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as CreateExpenseDto;
    const data = await service.create(req.user.employeeId, dto);
    res.status(201).json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── Approve ───────────────────────────────────────────────────────────────────

export const approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await service.approve(req.params.id, req.user.employeeId);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── Reject ────────────────────────────────────────────────────────────────────

export const reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body as RejectExpenseDto;
    const data = await service.reject(req.params.id, req.user.employeeId, reason);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

// ── Mark Reimbursed ───────────────────────────────────────────────────────────

export const markReimbursed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await service.markReimbursed(req.params.id);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};
