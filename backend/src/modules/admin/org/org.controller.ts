import { Request, Response, NextFunction } from 'express';
import { orgService } from './org.service';
import { ok } from '../../../utils/response';
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateLocationDto,
  UpdateLocationDto,
} from './org.schema';

// ─── Department controllers ──────────────────────────────────────────────────

export const listDepartments = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await orgService.listDepartments();
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await orgService.createDepartment(req.body as CreateDepartmentDto);
    res.status(201).json(ok(data));
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await orgService.updateDepartment(req.params.id, req.body as UpdateDepartmentDto);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await orgService.deleteDepartment(req.params.id);
    res.json(ok({ deleted: true }));
  } catch (err) {
    next(err);
  }
};

// ─── Location controllers ────────────────────────────────────────────────────

export const listLocations = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await orgService.listLocations();
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

export const createLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await orgService.createLocation(req.body as CreateLocationDto);
    res.status(201).json(ok(data));
  } catch (err) {
    next(err);
  }
};

export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await orgService.updateLocation(req.params.id, req.body as UpdateLocationDto);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};

export const deleteLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await orgService.deleteLocation(req.params.id);
    res.json(ok({ deleted: true }));
  } catch (err) {
    next(err);
  }
};
