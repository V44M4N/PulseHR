import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const CandidateStageEnum = z.enum([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
]);

export const JobStatusEnum = z.enum(['DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED']);

// ── Job Requisition ───────────────────────────────────────────────────────────

export const CreateJobSchema = z.object({
  title:        z.string().min(1, 'Title is required'),
  departmentId: z.string().optional(),
  location:     z.string().optional(),
  type:         z.string().optional(),
});

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: JobStatusEnum.optional(),
});

export const ListJobsQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  status: JobStatusEnum.optional(),
});

// ── Candidate ─────────────────────────────────────────────────────────────────

export const CreateCandidateSchema = z.object({
  jobId:       z.string().optional(),
  name:        z.string().min(1, 'Name is required'),
  email:       z.string().email('Invalid email address'),
  phone:       z.string().optional(),
  stage:       CandidateStageEnum.default('APPLIED'),
  source:      z.string().min(1, 'Source is required'),
  appliedDate: z.string().min(1, 'Applied date is required'),
  rating:      z.number().int().min(1).max(5).optional(),
  notes:       z.string().optional(),
});

export const UpdateCandidateStageSchema = z.object({
  stage: CandidateStageEnum,
});

export const ListCandidatesQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  jobId: z.string().optional(),
  stage: CandidateStageEnum.optional(),
});

// ── DTO types ─────────────────────────────────────────────────────────────────

export type CreateJobDTO             = z.infer<typeof CreateJobSchema>;
export type UpdateJobDTO             = z.infer<typeof UpdateJobSchema>;
export type ListJobsQuery            = z.infer<typeof ListJobsQuerySchema>;
export type CreateCandidateDTO       = z.infer<typeof CreateCandidateSchema>;
export type UpdateCandidateStageDTO  = z.infer<typeof UpdateCandidateStageSchema>;
export type ListCandidatesQuery      = z.infer<typeof ListCandidatesQuerySchema>;
