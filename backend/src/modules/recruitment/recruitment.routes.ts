import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { atLeast } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import * as controller from './recruitment.controller';
import {
  CreateJobSchema,
  UpdateJobSchema,
  ListJobsQuerySchema,
  CreateCandidateSchema,
  UpdateCandidateStageSchema,
  ListCandidatesQuerySchema,
} from './recruitment.schema';

export const recruitmentRouter = Router();

// All recruitment routes require HR role or above (HR | ADMIN)
recruitmentRouter.use(authenticate);
recruitmentRouter.use(atLeast('HR'));

// ── Jobs ──────────────────────────────────────────────────────────────────────
recruitmentRouter.get(
  '/jobs',
  validate(ListJobsQuerySchema, 'query'),
  controller.listJobs,
);

recruitmentRouter.post(
  '/jobs',
  validate(CreateJobSchema),
  controller.createJob,
);

recruitmentRouter.put(
  '/jobs/:id',
  validate(UpdateJobSchema),
  controller.updateJob,
);

// ── Candidates ────────────────────────────────────────────────────────────────
recruitmentRouter.get(
  '/candidates',
  validate(ListCandidatesQuerySchema, 'query'),
  controller.listCandidates,
);

recruitmentRouter.post(
  '/candidates',
  validate(CreateCandidateSchema),
  controller.addCandidate,
);

recruitmentRouter.put(
  '/candidates/:id/stage',
  validate(UpdateCandidateStageSchema),
  controller.updateCandidateStage,
);

// ── Kanban ────────────────────────────────────────────────────────────────────
recruitmentRouter.get(
  '/kanban',
  controller.getKanban,
);
