import { z } from 'zod';

export const TriggerOnboardingSchema = z.object({
  employeeId: z.string().min(1),
  startDate:  z.string().min(1),
});

export const CompleteTaskSchema = z.object({});

export const AddTaskSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional(),
  owner:       z.string().min(1),
  dueDate:     z.string().optional(),
  sortOrder:   z.number().int().optional(),
});

export const ListOnboardingQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type TriggerOnboardingDTO = z.infer<typeof TriggerOnboardingSchema>;
export type CompleteTaskDTO      = z.infer<typeof CompleteTaskSchema>;
export type AddTaskDTO           = z.infer<typeof AddTaskSchema>;
export type ListOnboardingQuery  = z.infer<typeof ListOnboardingQuerySchema>;
