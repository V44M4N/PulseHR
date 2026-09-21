import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ok } from '../../utils/response';
import { Errors } from '../../utils/errors';
import type { LoginDTO, RefreshDTO } from './auth.schema';
import * as authService from './auth.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const REFRESH_COOKIE = 'refreshToken';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path:     '/',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract remaining TTL (seconds) from a JWT without verifying signature again. */
function extractAccessTokenTTL(token: string): number {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return 0;
    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  } catch {
    return 0;
  }
}

// ── Controllers ───────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as LoginDTO;
    const ipAddress = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(dto, ipAddress, userAgent);

    // Set refresh token in httpOnly cookie
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    // Also return refresh token in body for non-browser clients
    res.json(ok({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      user:         result.user,
    }));
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Accept refresh token from cookie OR request body (body wins)
    const dto = req.body as RefreshDTO;
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const refreshToken = dto.refreshToken || tokenFromCookie;

    if (!refreshToken) {
      next(Errors.TOKEN_MISSING());
      return;
    }

    const tokens = await authService.refresh({ refreshToken });

    // Rotate the cookie
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    res.json(ok({
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }));
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId         = req.user.sub;
    const rawAccessToken = req.headers.authorization?.slice(7) ?? '';
    const tokenTTL       = extractAccessTokenTTL(rawAccessToken);

    await authService.logout(userId, rawAccessToken, tokenTTL);

    // Clear the cookie
    res.clearCookie(REFRESH_COOKIE, { path: '/' });

    res.json(ok({ message: 'Logged out successfully' }));
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.sub;
    const data   = await authService.me(userId);
    res.json(ok(data));
  } catch (err) {
    next(err);
  }
};
