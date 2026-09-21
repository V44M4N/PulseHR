import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { CreateAnnouncementSchema, ListFeedQuerySchema } from './feed.schema';
import * as controller from './feed.controller';

export const feedRouter = Router();

feedRouter.use(authenticate);

// GET /feed — all authenticated roles, published-only filtering handled in service
feedRouter.get('/', validate(ListFeedQuerySchema, 'query'), controller.list);

feedRouter.post('/', authorize('HR', 'ADMIN'), validate(CreateAnnouncementSchema), controller.create);

// GET /feed/:id — all authenticated roles
feedRouter.get('/:id', controller.getById);

// POST /feed/:id/react — all authenticated roles
feedRouter.post('/:id/react', controller.react);
