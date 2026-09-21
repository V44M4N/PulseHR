import { z } from 'zod';

export const UpdatePermissionsSchema = z.object({
  permissions: z.record(z.boolean()),
});

export type UpdatePermissionsDTO = z.infer<typeof UpdatePermissionsSchema>;
