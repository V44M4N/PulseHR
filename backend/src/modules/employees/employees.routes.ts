import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize, ownerOrRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  UpdateEmployeeStatusSchema,
  ListEmployeesQuerySchema,
} from './employees.schema';
import * as controller from './employees.controller';

export const employeesRouter = Router();

// All routes under /employees require a valid JWT
employeesRouter.use(authenticate);

// ─── GET /employees/me ────────────────────────────────────────────────────────
// Must be declared BEFORE /:id so Express does not treat "me" as an id param.
employeesRouter.get(
  '/me',
  controller.getProfile,
);

// ─── GET /employees ───────────────────────────────────────────────────────────
employeesRouter.get(
  '/',
  authorize('HR', 'ADMIN'),
  validate(ListEmployeesQuerySchema, 'query'),
  controller.list,
);

// ─── POST /employees ──────────────────────────────────────────────────────────
employeesRouter.post(
  '/',
  authorize('HR', 'ADMIN'),
  validate(CreateEmployeeSchema),
  controller.create,
);

// ─── GET /employees/:id ───────────────────────────────────────────────────────
// The authenticated employee may view their own record; HR and ADMIN can view any.
// ownerOrRole compares req.params.employeeId — we alias :id as employeeId below.
employeesRouter.get(
  '/:id',
  (req, _res, next) => {
    // Expose :id as :employeeId so ownerOrRole middleware can compare correctly
    req.params.employeeId = req.params.id;
    next();
  },
  ownerOrRole('HR', 'ADMIN'),
  controller.getById,
);

// ─── PUT /employees/:id ───────────────────────────────────────────────────────
employeesRouter.put(
  '/:id',
  authorize('HR', 'ADMIN'),
  validate(UpdateEmployeeSchema),
  controller.update,
);

// ─── PUT /employees/:id/status ────────────────────────────────────────────────
employeesRouter.put(
  '/:id/status',
  authorize('ADMIN'),
  validate(UpdateEmployeeStatusSchema),
  controller.updateStatus,
);
