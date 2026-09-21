import { Request, Response, NextFunction } from 'express';
import { onboardingService } from './onboarding.service';
import { ok } from '../../utils/response';
import type { TriggerOnboardingDTO, AddTaskDTO, ListOnboardingQuery } from './onboarding.schema';

export const onboardingController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await onboardingService.list(req.query as unknown as ListOnboardingQuery);
      res.json(ok(result.data, result.meta));
    } catch (err) { next(err); }
  },

  getEmployeeTasks: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await onboardingService.getEmployeeTasks(req.params.employeeId);
      res.json(ok(result));
    } catch (err) { next(err); }
  },

  triggerOnboarding: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tasks = await onboardingService.triggerOnboarding(req.body as TriggerOnboardingDTO);
      res.status(201).json(ok(tasks));
    } catch (err) { next(err); }
  },

  completeTask: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await onboardingService.completeTask(
        req.params.taskId,
        req.user.employeeId,
        req.user.role,
      );
      res.json(ok(task));
    } catch (err) { next(err); }
  },

  addTask: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await onboardingService.addTask(
        req.params.employeeId,
        req.body as AddTaskDTO,
      );
      res.status(201).json(ok(task));
    } catch (err) { next(err); }
  },
};
