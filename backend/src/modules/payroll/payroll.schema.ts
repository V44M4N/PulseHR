import { z } from 'zod';

export const CreatePayrollRunSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year:  z.coerce.number().int().min(2020).max(2100),
});

// POST /runs/:id/process — no body required; schema validates an empty object
export const ProcessPayrollSchema = z.object({});

export const ListRunsQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePayrollRunDTO = z.infer<typeof CreatePayrollRunSchema>;
export type ProcessPayrollDTO   = z.infer<typeof ProcessPayrollSchema>;
export type ListRunsQuery        = z.infer<typeof ListRunsQuerySchema>;
