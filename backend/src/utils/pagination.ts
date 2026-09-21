import { Request } from 'express';

export interface PaginationParams {
  page:  number;
  limit: number;
  skip:  number;
}

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export function getPagination(req: Request): PaginationParams {
  const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10) || 1);
  const limit = Math.min(100, parseInt(String(req.query.limit ?? '20'), 10) || 20);
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
