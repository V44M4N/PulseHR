import { z } from 'zod';

export const ListAuditLogsQuerySchema = z.object({
  page:    z.coerce.number().int().min(1).optional(),
  limit:   z.coerce.number().int().min(1).max(100).optional(),
  actorId: z.string().optional(),
  action:  z.string().optional(),
  from:    z.string().optional(),
  to:      z.string().optional(),
  search:  z.string().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>;
