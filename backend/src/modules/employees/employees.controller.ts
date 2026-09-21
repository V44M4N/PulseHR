import { Request, Response, NextFunction } from 'express';
import { EmployeeStatus } from '@prisma/client';
import { getPagination } from '../../utils/pagination';
import { ok } from '../../utils/response';
import * as service from './employees.service';
import { ListEmployeesQuery, UpdateEmployeeStatusDto } from './employees.schema';

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * GET /employees
 * Returns a paginated list of employees with optional filters.
 */
export const list = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const query = req.query as unknown as ListEmployeesQuery;
    const { employees, meta } = await service.list(query, page, limit, skip);
    res.json(ok(employees, meta));
  } catch (err) {
    next(err);
  }
};

// ─── Get by ID ────────────────────────────────────────────────────────────────

/**
 * GET /employees/:id
 * Returns the full employee record. Accessible by HR/ADMIN or the employee themselves.
 */
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const employee = await service.getById(req.params.id);
    res.json(ok(employee));
  } catch (err) {
    next(err);
  }
};

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * POST /employees
 * Creates a new employee and linked user account.
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const employee = await service.create(req.body, req.user.sub);
    res.status(201).json(ok(employee));
  } catch (err) {
    next(err);
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * PUT /employees/:id
 * Partially updates employee details.
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const employee = await service.update(req.params.id, req.body);
    res.json(ok(employee));
  } catch (err) {
    next(err);
  }
};

// ─── Update status ────────────────────────────────────────────────────────────

/**
 * PUT /employees/:id/status
 * Changes only the employment status of an employee (ADMIN only).
 */
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status } = req.body as UpdateEmployeeStatusDto;
    const result = await service.updateStatus(req.params.id, status as EmployeeStatus);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
};

// ─── Get own profile ──────────────────────────────────────────────────────────

/**
 * GET /employees/me
 * Returns the authenticated employee's own full profile including leave balances.
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const profile = await service.getProfile(req.user.employeeId);
    res.json(ok(profile));
  } catch (err) {
    next(err);
  }
};
