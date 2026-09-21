import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { fail } from '../utils/response';

export interface JwtPayload {
  sub:        string;   // User.id
  role:       string;   // UserRole enum value
  name:       string;
  employeeId: string;   // Employee.id
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json(fail('TOKEN_MISSING', 'Authentication token required'));
    return;
  }

  const token = header.slice(7);

  // Check Redis blocklist (tokens added on logout)
  const blocked = await redis.get(`blocklist:${token}`).catch(() => null);
  if (blocked) {
    res.status(401).json(fail('TOKEN_REVOKED', 'Token has been revoked'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json(fail('TOKEN_INVALID', 'Invalid or expired token'));
  }
}
