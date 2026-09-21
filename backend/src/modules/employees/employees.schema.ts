import { z } from 'zod';

// ─── Create ──────────────────────────────────────────────────────────────────

export const CreateEmployeeSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be 100 characters or fewer')
    .trim(),

  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be 100 characters or fewer')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),

  phone: z
    .string()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number must be 20 characters or fewer')
    .trim()
    .optional(),

  designation: z
    .string({ required_error: 'Designation is required' })
    .min(1, 'Designation cannot be empty')
    .max(150, 'Designation must be 150 characters or fewer')
    .trim(),

  departmentId: z
    .string({ required_error: 'Department is required' })
    .cuid('Invalid department ID'),

  locationId: z
    .string()
    .cuid('Invalid location ID')
    .optional(),

  dateOfJoining: z
    .string({ required_error: 'Date of joining is required' })
    .datetime({ message: 'dateOfJoining must be a valid ISO 8601 datetime string' }),

  employmentType: z
    .string()
    .min(1, 'Employment type cannot be empty')
    .max(50, 'Employment type must be 50 characters or fewer')
    .trim()
    .optional(),

  managerId: z
    .string()
    .cuid('Invalid manager ID')
    .optional(),
});

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

export const UpdateEmployeeSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .max(100, 'First name must be 100 characters or fewer')
      .trim()
      .optional(),

    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .max(100, 'Last name must be 100 characters or fewer')
      .trim()
      .optional(),

    email: z
      .string()
      .email('Must be a valid email address')
      .toLowerCase()
      .trim()
      .optional(),

    phone: z
      .string()
      .min(7, 'Phone number must be at least 7 characters')
      .max(20, 'Phone number must be 20 characters or fewer')
      .trim()
      .optional()
      .nullable(),

    designation: z
      .string()
      .min(1, 'Designation cannot be empty')
      .max(150, 'Designation must be 150 characters or fewer')
      .trim()
      .optional(),

    departmentId: z
      .string()
      .cuid('Invalid department ID')
      .optional(),

    locationId: z
      .string()
      .cuid('Invalid location ID')
      .optional()
      .nullable(),

    dateOfJoining: z
      .string()
      .datetime({ message: 'dateOfJoining must be a valid ISO 8601 datetime string' })
      .optional(),

    employmentType: z
      .string()
      .min(1, 'Employment type cannot be empty')
      .max(50, 'Employment type must be 50 characters or fewer')
      .trim()
      .optional(),

    managerId: z
      .string()
      .cuid('Invalid manager ID')
      .optional()
      .nullable(),

    status: z
      .enum(['ACTIVE', 'PROBATION', 'NOTICE', 'INACTIVE', 'TERMINATED'], {
        errorMap: () => ({
          message: 'Status must be one of: ACTIVE, PROBATION, NOTICE, INACTIVE, TERMINATED',
        }),
      })
      .optional(),
  })
  .strict();

export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;

// ─── Status update ───────────────────────────────────────────────────────────

export const UpdateEmployeeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PROBATION', 'NOTICE', 'INACTIVE', 'TERMINATED']),
});

export type UpdateEmployeeStatusDto = z.infer<typeof UpdateEmployeeStatusSchema>;

// ─── List / query ─────────────────────────────────────────────────────────────

export const ListEmployeesQuerySchema = z.object({
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

  search: z
    .string()
    .max(200, 'Search query is too long')
    .trim()
    .optional(),

  departmentId: z
    .string()
    .cuid('Invalid department ID')
    .optional(),

  status: z
    .enum(['ACTIVE', 'PROBATION', 'NOTICE', 'INACTIVE', 'TERMINATED'], {
      errorMap: () => ({
        message: 'Status must be one of: ACTIVE, PROBATION, NOTICE, INACTIVE, TERMINATED',
      }),
    })
    .optional(),

  locationId: z
    .string()
    .cuid('Invalid location ID')
    .optional(),
});

export type ListEmployeesQuery = z.infer<typeof ListEmployeesQuerySchema>;
