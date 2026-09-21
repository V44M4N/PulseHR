import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { atLeast, ownerOrRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { onboardingController } from './onboarding.controller';
import {
  TriggerOnboardingSchema,
  CompleteTaskSchema,
  AddTaskSchema,
  ListOnboardingQuerySchema,
} from './onboarding.schema';

export const onboardingRouter = Router();

onboardingRouter.use(authenticate);

// GET  /onboarding — list all employees with onboarding tasks (HR, ADMIN)
onboardingRouter.get(
  '/',
  atLeast('HR'),
  validate(ListOnboardingQuerySchema, 'query'),
  onboardingController.list,
);

// POST /onboarding — trigger onboarding for an employee (HR, ADMIN)
onboardingRouter.post(
  '/',
  atLeast('HR'),
  validate(TriggerOnboardingSchema),
  onboardingController.triggerOnboarding,
);

// GET  /onboarding/:employeeId/tasks — view tasks; own employee, HR, or ADMIN
onboardingRouter.get(
  '/:employeeId/tasks',
  ownerOrRole('HR', 'ADMIN'),
  onboardingController.getEmployeeTasks,
);

// PUT  /onboarding/:employeeId/tasks/:taskId — mark task complete; own employee, HR, or ADMIN
onboardingRouter.put(
  '/:employeeId/tasks/:taskId',
  ownerOrRole('HR', 'ADMIN'),
  validate(CompleteTaskSchema),
  onboardingController.completeTask,
);

// POST /onboarding/:employeeId/tasks — add a custom task (HR, ADMIN)
onboardingRouter.post(
  '/:employeeId/tasks',
  atLeast('HR'),
  validate(AddTaskSchema),
  onboardingController.addTask,
);
