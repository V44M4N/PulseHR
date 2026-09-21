import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { CreateExpenseSchema, RejectExpenseSchema, ListExpensesQuerySchema } from './expenses.schema';
import * as controller from './expenses.controller';

export const expensesRouter = Router();

// All expense routes require authentication
expensesRouter.use(authenticate);

// GET /expenses — all authenticated roles; service filters results by role
expensesRouter.get(
  '/',
  validate(ListExpensesQuerySchema, 'query'),
  controller.list,
);

// POST /expenses — any authenticated employee can submit an expense
expensesRouter.post(
  '/',
  validate(CreateExpenseSchema),
  controller.create,
);

// GET /expenses/:id — owner (EMPLOYEE) or elevated roles
expensesRouter.get(
  '/:id',
  controller.getById,
);

// PUT /expenses/:id/approve — MANAGER, HR, ADMIN only
expensesRouter.put(
  '/:id/approve',
  authorize('MANAGER', 'HR', 'ADMIN'),
  controller.approve,
);

// PUT /expenses/:id/reject — MANAGER, HR, ADMIN only
expensesRouter.put(
  '/:id/reject',
  authorize('MANAGER', 'HR', 'ADMIN'),
  validate(RejectExpenseSchema),
  controller.reject,
);

// PUT /expenses/:id/reimburse — HR, ADMIN only
expensesRouter.put(
  '/:id/reimburse',
  authorize('HR', 'ADMIN'),
  controller.markReimbursed,
);
