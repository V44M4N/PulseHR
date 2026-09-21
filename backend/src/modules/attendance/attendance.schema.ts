import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

// ── Clock-in body ─────────────────────────────────────────────────────────────

export const ClockInSchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

export type ClockInInput = z.infer<typeof ClockInSchema>;

// ── Monthly query params ──────────────────────────────────────────────────────

export const MonthQuerySchema = z.object({
  month: z.coerce
    .number()
    .int()
    .min(1, 'month must be between 1 and 12')
    .max(12, 'month must be between 1 and 12'),
  year: z.coerce
    .number()
    .int()
    .min(2000, 'year must be 2000 or later')
    .max(2100, 'year must be 2100 or earlier'),
});

export type MonthQueryInput = z.infer<typeof MonthQuerySchema>;

// ── Manual attendance (HR use) ────────────────────────────────────────────────

export const ManualAttendanceSchema = z.object({
  employeeId: z.string().cuid('employeeId must be a valid CUID'),
  date: z.coerce.date(),
  clockIn: z.coerce.date().optional(),
  clockOut: z.coerce.date().optional(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().trim().max(500).optional(),
});

export type ManualAttendanceInput = z.infer<typeof ManualAttendanceSchema>;

// ── List / filter query params ────────────────────────────────────────────────

export const ListAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  employeeId: z.string().cuid().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListAttendanceQueryInput = z.infer<typeof ListAttendanceQuerySchema>;
