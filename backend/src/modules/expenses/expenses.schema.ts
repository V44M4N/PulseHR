import { z } from 'zod';

// ── Create Expense ────────────────────────────────────────────────────────────

export const CreateExpenseSchema = z.object({
  date: z
    .string({ required_error: 'date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  category: z
    .string({ required_error: 'category is required' })
    .min(1, 'category must not be empty'),
  amount: z
    .number({ required_error: 'amount is required' })
    .positive('amount must be a positive number'),
  description: z
    .string({ required_error: 'description is required' })
    .min(1, 'description must not be empty'),
  currency: z
    .string()
    .min(1, 'currency must not be empty')
    .optional(),
});

export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;

// ── Reject Expense ────────────────────────────────────────────────────────────

export const RejectExpenseSchema = z.object({
  reason: z
    .string({ required_error: 'reason is required' })
    .min(1, 'reason must not be empty'),
});

export type RejectExpenseDto = z.infer<typeof RejectExpenseSchema>;

// ── List Expenses Query ───────────────────────────────────────────────────────

export const ListExpensesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  limit: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().positive().max(100).optional()),
  status: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED', 'UNDER_REVIEW'])
    .optional(),
  category: z
    .string()
    .min(1)
    .optional(),
});

export type ListExpensesQueryDto = z.infer<typeof ListExpensesQuerySchema>;
