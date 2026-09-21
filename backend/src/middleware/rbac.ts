import { Request, Response, NextFunction } from 'express';
import { fail } from '../utils/response';

type Role = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

/**
 * Role hierarchy — higher index = more access.
 * Used by `atLeast` to allow a role and everything above it.
 */
const HIERARCHY: Role[] = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'];

/** Restrict to specific roles only */
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json(fail('FORBIDDEN', 'Insufficient permissions'));
      return;
    }
    next();
  };
}

/** Allow a role and everything above it in the hierarchy */
export function atLeast(minRole: Role) {
  const minIndex = HIERARCHY.indexOf(minRole);
  return (req: Request, res: Response, next: NextFunction): void => {
    const userIndex = HIERARCHY.indexOf(req.user.role as Role);
    if (userIndex < minIndex) {
      res.status(403).json(fail('FORBIDDEN', 'Insufficient permissions'));
      return;
    }
    next();
  };
}

/** Verify the authenticated user owns the resource OR has elevated role */
export function ownerOrRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isOwner    = req.params.employeeId === req.user.employeeId;
    const hasRole    = roles.includes(req.user.role as Role);
    if (!isOwner && !hasRole) {
      res.status(403).json(fail('FORBIDDEN', 'Access denied'));
      return;
    }
    next();
  };
}
