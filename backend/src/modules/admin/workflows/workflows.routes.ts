import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { authorize } from '../../../middleware/rbac';
import { validate } from '../../../middleware/validate';
import { workflowsController } from './workflows.controller';
import { UpdateWorkflowSchema } from './workflows.schema';

export const workflowsRouter = Router();

workflowsRouter.use(authenticate);
workflowsRouter.use(authorize('ADMIN'));

workflowsRouter.get('/',      workflowsController.list);
workflowsRouter.put('/:key',  validate(UpdateWorkflowSchema), workflowsController.update);
