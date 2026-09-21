import { Router } from 'express';
import { authenticate }  from '../../middleware/auth';
import { atLeast }       from '../../middleware/rbac';
import { validate }      from '../../middleware/validate';
import {
  CreatePayrollRunSchema,
  ProcessPayrollSchema,
  ListRunsQuerySchema,
} from './payroll.schema';
import * as controller from './payroll.controller';

export const payrollRouter = Router();

// All payroll management routes require HR or above (HR + ADMIN)
payrollRouter.use(authenticate);
payrollRouter.use(atLeast('HR'));

// GET  /runs       — paginated list of payroll runs
payrollRouter.get(
  '/runs',
  validate(ListRunsQuerySchema, 'query'),
  controller.listRuns,
);

// POST /runs       — create a new DRAFT run for a given month/year
payrollRouter.post(
  '/runs',
  validate(CreatePayrollRunSchema),
  controller.createRun,
);

// GET  /runs/:id   — full details of a single run
payrollRouter.get(
  '/runs/:id',
  controller.getRunById,
);

// POST /runs/:id/process — generate payslips and move run to PROCESSED
payrollRouter.post(
  '/runs/:id/process',
  validate(ProcessPayrollSchema),
  controller.processRun,
);

// POST /runs/:id/paid    — mark run and all its payslips as PAID
payrollRouter.post(
  '/runs/:id/paid',
  controller.markPaid,
);
