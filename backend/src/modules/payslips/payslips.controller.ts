import { Request, Response, NextFunction } from 'express';
import { ok } from '../../utils/response';
import { getPagination } from '../../utils/pagination';
import * as service from './payslips.service';
import { ListPayslipsQuery } from './payslips.schema';

// ── List payslips ─────────────────────────────────────────────────────────────

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query      = req.query as unknown as ListPayslipsQuery;
    const pagination = getPagination(req);
    const { payslips, meta } = await service.list(
      req.user.employeeId,
      req.user.role,
      query,
      pagination,
    );
    res.json(ok(payslips, meta));
  } catch (err) {
    next(err);
  }
};

// ── Get single payslip ────────────────────────────────────────────────────────

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payslip = await service.getById(
      req.params.id,
      req.user.employeeId,
      req.user.role,
    );
    res.json(ok(payslip));
  } catch (err) {
    next(err);
  }
};

// ── Download payslip PDF ──────────────────────────────────────────────────────

export const downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Ownership/role check is embedded inside service.getById
    await service.getById(req.params.id, req.user.employeeId, req.user.role);

    const buffer = await service.generatePdf(req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip-${req.params.id}.pdf"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

// ── Year-to-date summary ──────────────────────────────────────────────────────

export const getYtdSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(String(req.query.year ?? new Date().getFullYear()), 10);

    // Elevated roles may request another employee's YTD via query param;
    // everyone else sees their own.
    const elevated   = ['HR', 'ADMIN'].includes(req.user.role);
    const employeeId = elevated && typeof req.query.employeeId === 'string'
      ? req.query.employeeId
      : req.user.employeeId;

    const summary = await service.getYtdSummary(employeeId, year);
    res.json(ok(summary));
  } catch (err) {
    next(err);
  }
};
