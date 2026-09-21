import { CandidateStage, JobStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { Errors } from '../../utils/errors';
import { buildMeta } from '../../utils/pagination';
import { nextJobCode, nextCandidateCode } from '../../utils/codeGen';
import type {
  CreateJobDTO,
  UpdateJobDTO,
  CreateCandidateDTO,
  UpdateCandidateStageDTO,
  ListJobsQuery,
  ListCandidatesQuery,
} from './recruitment.schema';

// ── Jobs ──────────────────────────────────────────────────────────────────────

async function listJobs(query: ListJobsQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where: { status?: JobStatus } = {};
  if (query.status) where.status = query.status as JobStatus;

  const [jobs, total] = await Promise.all([
    prisma.jobRequisition.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { candidates: true } },
      },
    }),
    prisma.jobRequisition.count({ where }),
  ]);

  return { jobs, meta: buildMeta(page, limit, total) };
}

async function createJob(dto: CreateJobDTO, openedById: string) {
  const code = await nextJobCode();
  return prisma.jobRequisition.create({
    data: {
      code,
      title:        dto.title,
      departmentId: dto.departmentId,
      location:     dto.location,
      type:         dto.type ?? 'Full-time',
      status:       JobStatus.OPEN,
      openedById,
    },
  });
}

async function updateJob(id: string, dto: UpdateJobDTO) {
  const job = await prisma.jobRequisition.findUnique({ where: { id } });
  if (!job) throw Errors.NOT_FOUND('Job');

  return prisma.jobRequisition.update({
    where: { id },
    data: {
      ...(dto.title        !== undefined && { title:        dto.title }),
      ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
      ...(dto.location     !== undefined && { location:     dto.location }),
      ...(dto.type         !== undefined && { type:         dto.type }),
      ...(dto.status       !== undefined && { status:       dto.status as JobStatus }),
    },
  });
}

// ── Candidates ────────────────────────────────────────────────────────────────

async function listCandidates(query: ListCandidatesQuery) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where: { jobId?: string; stage?: CandidateStage } = {};
  if (query.jobId) where.jobId = query.jobId;
  if (query.stage) where.stage = query.stage as CandidateStage;

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { appliedDate: 'desc' },
      include: { job: { select: { title: true, code: true } } },
    }),
    prisma.candidate.count({ where }),
  ]);

  return { candidates, meta: buildMeta(page, limit, total) };
}

async function addCandidate(dto: CreateCandidateDTO) {
  const code = await nextCandidateCode();
  return prisma.candidate.create({
    data: {
      code,
      jobId:       dto.jobId,
      name:        dto.name,
      email:       dto.email,
      phone:       dto.phone,
      stage:       (dto.stage ?? 'APPLIED') as CandidateStage,
      source:      dto.source,
      appliedDate: new Date(dto.appliedDate),
      rating:      dto.rating,
      notes:       dto.notes,
    },
  });
}

async function updateCandidateStage(id: string, dto: UpdateCandidateStageDTO) {
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw Errors.NOT_FOUND('Candidate');

  const updated = await prisma.candidate.update({
    where: { id },
    data:  { stage: dto.stage as CandidateStage },
  });

  // Auto-close the job when a candidate is hired
  if (dto.stage === 'HIRED' && candidate.jobId) {
    await prisma.jobRequisition.update({
      where: { id: candidate.jobId },
      data:  { status: JobStatus.CLOSED, closedAt: new Date() },
    });
  }

  return updated;
}

// ── Kanban ────────────────────────────────────────────────────────────────────

async function getKanban(jobId?: string) {
  const where: { jobId?: string } = {};
  if (jobId) where.jobId = jobId;

  const candidates = await prisma.candidate.findMany({
    where,
    orderBy: { appliedDate: 'asc' },
    include: { job: { select: { title: true, code: true } } },
  });

  const stages = [
    'APPLIED',
    'SCREENING',
    'INTERVIEW',
    'OFFER',
    'HIRED',
    'REJECTED',
  ] as const;

  return stages.reduce<Record<string, typeof candidates>>((acc, stage) => {
    acc[stage] = candidates.filter(c => c.stage === stage);
    return acc;
  }, {});
}

// ── Exported service object ───────────────────────────────────────────────────

export const recruitmentService = {
  listJobs,
  createJob,
  updateJob,
  listCandidates,
  addCandidate,
  updateCandidateStage,
  getKanban,
};
