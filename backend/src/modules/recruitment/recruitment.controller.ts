import { Request, Response, NextFunction } from 'express';
import { recruitmentService } from './recruitment.service';
import { ok } from '../../utils/response';
import type {
  CreateJobDTO,
  UpdateJobDTO,
  CreateCandidateDTO,
  UpdateCandidateStageDTO,
  ListJobsQuery,
  ListCandidatesQuery,
} from './recruitment.schema';

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const listJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await recruitmentService.listJobs(req.query as unknown as ListJobsQuery);
    res.json(ok(result.jobs, result.meta));
  } catch (err) { next(err); }
};

export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await recruitmentService.createJob(req.body as CreateJobDTO, req.user.employeeId);
    res.status(201).json(ok(job));
  } catch (err) { next(err); }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await recruitmentService.updateJob(req.params.id, req.body as UpdateJobDTO);
    res.json(ok(job));
  } catch (err) { next(err); }
};

// ── Candidates ────────────────────────────────────────────────────────────────

export const listCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await recruitmentService.listCandidates(req.query as unknown as ListCandidatesQuery);
    res.json(ok(result.candidates, result.meta));
  } catch (err) { next(err); }
};

export const addCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidate = await recruitmentService.addCandidate(req.body as CreateCandidateDTO);
    res.status(201).json(ok(candidate));
  } catch (err) { next(err); }
};

export const updateCandidateStage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const candidate = await recruitmentService.updateCandidateStage(
      req.params.id,
      req.body as UpdateCandidateStageDTO,
    );
    res.json(ok(candidate));
  } catch (err) { next(err); }
};

// ── Kanban ────────────────────────────────────────────────────────────────────

export const getKanban = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
    const kanban = await recruitmentService.getKanban(jobId);
    res.json(ok(kanban));
  } catch (err) { next(err); }
};
