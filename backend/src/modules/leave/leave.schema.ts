import { z } from 'zod';

// ── Apply Leave ───────────────────────────────────────────────────────────────

export const ApplyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'leaveTypeId is required'),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate must be in YYYY-MM-DD format'),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate must be in YYYY-MM-DD format'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
});

export type ApplyLeaveDto = z.infer<typeof ApplyLeaveSchema>;

// ── Approve / Reject Leave ────────────────────────────────────────────────────

export const ApproveLeaveSchema = z.object({
  // No body fields required for approve — kept as an empty validated object
  // so the route can still use validate() uniformly
});

export type ApproveLeaveDto = z.infer<typeof ApproveLeaveSchema>;

export const RejectLeaveSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters').max(500),
});

export type RejectLeaveDto = z.infer<typeof RejectLeaveSchema>;

// ── List Leave Query ──────────────────────────────────────────────────────────

export const ListLeaveQuerySchema = z.object({
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
  status: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
    .optional(),
  year: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().min(2000).max(2100).optional()),
});

export type ListLeaveQueryDto = z.infer<typeof ListLeaveQuerySchema>;
