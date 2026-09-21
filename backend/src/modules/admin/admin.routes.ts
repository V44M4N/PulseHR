import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { rolesRouter }     from './roles/roles.routes';
import { orgRouter }       from './org/org.routes';
import { settingsRouter }  from './settings/settings.routes';
import { auditLogsRouter } from './audit-logs/audit-logs.routes';
import { workflowsRouter } from './workflows/workflows.routes';

export const adminRouter = Router();

// All admin routes require authentication + ADMIN role
adminRouter.use(authenticate);
adminRouter.use(authorize('ADMIN'));

adminRouter.use('/roles',      rolesRouter);
adminRouter.use('/org',        orgRouter);
adminRouter.use('/settings',   settingsRouter);
adminRouter.use('/audit-logs', auditLogsRouter);
adminRouter.use('/workflows',  workflowsRouter);
