import { z } from 'zod';

export const DirectoryQuerySchema = z.object({
  search:       z.string().optional(),
  departmentId: z.string().optional(),
  locationId:   z.string().optional(),
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(20),
});

export type DirectoryQuery = z.infer<typeof DirectoryQuerySchema>;
