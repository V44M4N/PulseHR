import { Request, Response, NextFunction } from 'express';
import { ok }          from '../../utils/response';
import { getPagination } from '../../utils/pagination';
import * as service    from './payroll.service';
import type { CreatePayrollRunDTO } from './payroll.schema';

// ── List runs ─────────────────────────────────────────────────────────────────

export const listRuns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pagination = getPagination(req);
    const { runs, meta } = await service.listRuns(pagination);
    res.json(ok(runs, meta));
  } catch (err) { next(err); }
};

// ── Get run by ID ─────────────────────────────────────────────────────────────

export const getRunById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const run = await service.getRunById(req.params.id);
    res.json(ok(run));
  } catch (err) { next(err); }
};

// ── Create run ────────────────────────────────────────────────────────────────

export const createRun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as CreatePayrollRunDTO;
    const run = await service.createRun(dto, req.user.sub);
    res.status(201).json(ok(run));
  } catch (err) { next(err); }
};

// ── Process run ───────────────────────────────────────────────────────────────

export const processRun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const run = await service.processRun(req.params.id, req.user.sub);
    res.json(ok(run));
  } catch (err) { next(err); }
};

// ── Mark paid ─────────────────────────────────────────────────────────────────

export const markPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const run = await service.markPaid(req.params.id);
    res.json(ok(run));
  } catch (err) { next(err); }
};
