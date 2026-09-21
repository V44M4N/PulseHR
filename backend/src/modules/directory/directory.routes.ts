import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { directoryController } from './directory.controller';
import { DirectoryQuerySchema } from './directory.schema';

export const directoryRouter = Router();

directoryRouter.use(authenticate);

// GET /api/v1/directory           — paginated employee directory (all authenticated roles)
directoryRouter.get('/', validate(DirectoryQuerySchema, 'query'), directoryController.list);

// GET /api/v1/directory/org-chart — full org hierarchy tree (all authenticated roles)
directoryRouter.get('/org-chart', directoryController.getOrgChart);
