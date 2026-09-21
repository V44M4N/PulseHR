import { Request, Response, NextFunction } from 'express';
import { helpdeskService } from './helpdesk.service';
import { ok } from '../../utils/response';
import type { CreateTicketDTO, UpdateTicketDTO, ListTicketsQuery } from './helpdesk.schema';

export const helpdeskController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await helpdeskService.list(
        req.user.employeeId,
        req.user.role,
        req.query as unknown as ListTicketsQuery,
      );
      res.json(ok(result.tickets, result.meta));
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticket = await helpdeskService.getById(
        req.params.id,
        req.user.employeeId,
        req.user.role,
      );
      res.json(ok(ticket));
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticket = await helpdeskService.create(
        req.user.employeeId,
        req.body as CreateTicketDTO,
      );
      res.status(201).json(ok(ticket));
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticket = await helpdeskService.update(
        req.params.id,
        req.user.employeeId,
        req.user.role,
        req.body as UpdateTicketDTO,
      );
      res.json(ok(ticket));
    } catch (err) { next(err); }
  },
};
