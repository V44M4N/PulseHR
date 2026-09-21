import { z } from 'zod';

// ── Query schema for listing payslips ────────────────────────────────────────

export const ListPayslipsQuerySchema = z.object({
  page:  z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  year:  z.coerce.number().int().min(2000).max(2100).optional(),
});

export type ListPayslipsQuery = z.infer<typeof ListPayslipsQuerySchema>;

// ── Body schema for HR/Admin creating a payslip ──────────────────────────────

export const CreatePayslipSchema = z.object({
  employeeId:  z.string().min(1, 'employeeId is required'),
  month:       z.number().int().min(1).max(12),
  year:        z.number().int().min(2000).max(2100),
  grossSalary: z.number().positive('grossSalary must be positive'),
  earnings:    z.record(z.string(), z.number()).refine(
    (val) => Object.keys(val).length > 0,
    { message: 'earnings must have at least one entry' },
  ),
  deductions:  z.record(z.string(), z.number()),
});

export type CreatePayslipInput = z.infer<typeof CreatePayslipSchema>;
