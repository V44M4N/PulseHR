import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Automatically writes an AuditLog row after every successful write operation.
 * Attaches a listener to the response `finish` event — does not block the request.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  res.on('finish', () => {
    // Only log successful mutations
    if (res.statusCode >= 400) return;
    if (!req.user) return;

    const action = `${req.method} ${req.path}`;
    const target = req.params.id ?? req.params.employeeId ?? '-';

    prisma.auditLog
      .create({
        data: {
          actorId:   req.user.sub,
          actorName: req.user.name,
          action,
          target,
          ipAddress: req.ip ?? req.socket.remoteAddress ?? '-',
        },
      })
      .catch((err) => console.error('[Audit] Failed to write log:', err));
  });

  next();
}
