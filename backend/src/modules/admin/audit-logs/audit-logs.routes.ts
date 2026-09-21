import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { authorize } from '../../../middleware/rbac';
import { validate } from '../../../middleware/validate';
import { ListAuditLogsQuerySchema } from './audit-logs.schema';
import { auditLogsController } from './audit-logs.controller';

export const auditLogsRouter = Router();

auditLogsRouter.use(authenticate);
auditLogsRouter.use(authorize('ADMIN'));

auditLogsRouter.get(
  '/',
  validate(ListAuditLogsQuerySchema, 'query'),
  auditLogsController.list,
);
