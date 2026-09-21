import { Router } from 'express';
import { validate } from '../../../middleware/validate';
import { rolesController } from './roles.controller';
import { UpdatePermissionsSchema } from './roles.schema';

export const rolesRouter = Router();

rolesRouter.get('/',       rolesController.getMatrix);
rolesRouter.put('/:role',  validate(UpdatePermissionsSchema), rolesController.updatePermissions);
