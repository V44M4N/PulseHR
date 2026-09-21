import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { helpdeskController } from './helpdesk.controller';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  ListTicketsQuerySchema,
} from './helpdesk.schema';

export const helpdeskRouter = Router();

helpdeskRouter.use(authenticate);

// GET /  — all authenticated roles; EMPLOYEE sees own, HR/ADMIN see all (enforced in service)
helpdeskRouter.get(
  '/',
  validate(ListTicketsQuerySchema, 'query'),
  helpdeskController.list,
);

// POST /  — any authenticated employee may raise a ticket
helpdeskRouter.post(
  '/',
  validate(CreateTicketSchema),
  helpdeskController.create,
);

// GET /:id  — ownership check enforced in service (own or HR/ADMIN)
helpdeskRouter.get(
  '/:id',
  helpdeskController.getById,
);

// PUT /:id  — HR/ADMIN can update any; EMPLOYEE can only update own OPEN tickets
helpdeskRouter.put(
  '/:id',
  validate(UpdateTicketSchema),
  helpdeskController.update,
);
