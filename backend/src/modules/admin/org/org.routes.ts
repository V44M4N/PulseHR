import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { authorize } from '../../../middleware/rbac';
import { validate } from '../../../middleware/validate';
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  CreateLocationSchema,
  UpdateLocationSchema,
} from './org.schema';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from './org.controller';

export const orgRouter = Router();

orgRouter.use(authenticate);
orgRouter.use(authorize('ADMIN'));

// ─── Departments ─────────────────────────────────────────────────────────────
orgRouter.get('/departments', listDepartments);
orgRouter.post('/departments', validate(CreateDepartmentSchema), createDepartment);
orgRouter.put('/departments/:id', validate(UpdateDepartmentSchema), updateDepartment);
orgRouter.delete('/departments/:id', deleteDepartment);

// ─── Locations ────────────────────────────────────────────────────────────────
orgRouter.get('/locations', listLocations);
orgRouter.post('/locations', validate(CreateLocationSchema), createLocation);
orgRouter.put('/locations/:id', validate(UpdateLocationSchema), updateLocation);
orgRouter.delete('/locations/:id', deleteLocation);
