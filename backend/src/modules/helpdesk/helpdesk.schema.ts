import { z } from 'zod';

export const CreateTicketSchema = z.object({
  title:       z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category:    z.string().min(1, 'Category is required'),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

export const UpdateTicketSchema = z.object({
  status:     z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
  priority:   z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  resolvedAt: z.coerce.date().optional(),
});

export const ListTicketsQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  status:   z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export type CreateTicketDTO  = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketDTO  = z.infer<typeof UpdateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof ListTicketsQuerySchema>;
