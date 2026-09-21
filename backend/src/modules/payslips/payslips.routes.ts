import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate }     from '../../middleware/validate';
import { ListPayslipsQuerySchema } from './payslips.schema';
import * as controller from './payslips.controller';

export const payslipsRouter = Router();

// All payslip routes require a valid JWT
payslipsRouter.use(authenticate);

/**
 * GET /payslips
 * Returns own payslips for EMPLOYEE/MANAGER.
 * Returns all payslips (optionally filtered by ?year=) for HR/ADMIN.
 */
payslipsRouter.get(
  '/',
  validate(ListPayslipsQuerySchema, 'query'),
  controller.list,
);

/**
 * GET /payslips/ytd
 * Year-to-date salary summary for the authenticated employee.
 * HR/ADMIN may pass ?employeeId= to query another employee.
 * IMPORTANT: must be registered BEFORE /:id to avoid "ytd" being parsed as an id.
 */
payslipsRouter.get('/ytd', controller.getYtdSummary);

/**
 * GET /payslips/:id
 * Returns a single payslip. EMPLOYEE ownership is enforced inside the service.
 */
payslipsRouter.get('/:id', controller.getById);

/**
 * GET /payslips/:id/pdf
 * Streams the payslip as a PDF attachment.
 * EMPLOYEE ownership is enforced inside the service.
 */
payslipsRouter.get('/:id/pdf', controller.downloadPdf);
