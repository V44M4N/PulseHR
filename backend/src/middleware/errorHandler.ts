import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { fail } from '../utils/response';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.code, err.message));
    return;
  }

  // Prisma unique constraint
  if (isObject(err) && err.code === 'P2002') {
    const fields = (err.meta as { target?: string[] })?.target?.join(', ') ?? 'field';
    res.status(409).json(fail('CONFLICT', `A record with this ${fields} already exists`));
    return;
  }

  // Prisma record not found
  if (isObject(err) && err.code === 'P2025') {
    res.status(404).json(fail('NOT_FOUND', 'Record not found'));
    return;
  }

  // Unknown error — log in dev, generic message in prod
  const message = env.NODE_ENV === 'development' && err instanceof Error
    ? err.message
    : 'An unexpected error occurred';

  if (env.NODE_ENV !== 'test') {
    console.error('[Unhandled error]', err);
  }

  res.status(500).json(fail('INTERNAL_ERROR', message));
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}
