import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  headId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

export const CreateLocationSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).max(100).optional(),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

export type CreateDepartmentDto = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentSchema>;
export type CreateLocationDto = z.infer<typeof CreateLocationSchema>;
export type UpdateLocationDto = z.infer<typeof UpdateLocationSchema>;
