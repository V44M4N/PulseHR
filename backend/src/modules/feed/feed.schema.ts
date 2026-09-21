import { z } from 'zod';

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
});

export const ListFeedQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().max(100).optional()),
});

export type CreateAnnouncementDto = z.infer<typeof CreateAnnouncementSchema>;
export type ListFeedQuery = z.infer<typeof ListFeedQuerySchema>;
