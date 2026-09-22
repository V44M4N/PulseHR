import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError, Errors } from '../../utils/errors';
import type { LoginDTO, RefreshDTO } from './auth.schema';

function base32Decode(value: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = value.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error('Invalid base32 secret');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function verifyTotp(secret: string, code: string, timestamp = Date.now()): boolean {
  const key = base32Decode(secret);
  const counter = Math.floor(timestamp / 30000);
  for (const offset of [-1, 0, 1]) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter + offset));
    const digest = crypto.createHmac('sha1', key).update(buffer).digest();
    const index = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[index] & 0x7f) << 24) | (digest[index + 1] << 16) | (digest[index + 2] << 8) | digest[index + 3];
    if (String(binary % 1_000_000).padStart(6, '0') === code) return true;
  }
  return false;
}

function randomBase32Secret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(20);
  let result = '';
  let buffer = 0; let bits = 0;
  for (const byte of bytes) { buffer = (buffer << 8) | byte; bits += 8; while (bits >= 5) { result += alphabet[(buffer >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) result += alphabet[(buffer << (5 - bits)) & 31];
  return result;
}

async function mfaRequired(user: { role: string; mfaSecret: string | null }): Promise<boolean> {
  const setting = await prisma.companySetting.findUnique({ where: { key: 'auth.mfa' } });
  const value = setting?.value as { enabled?: boolean; requiredForRoles?: string[]; required_for_roles?: string[] } | undefined;
  const roles = value?.requiredForRoles ?? value?.required_for_roles ?? ['ADMIN'];
  return Boolean(value?.enabled && roles.includes(user.role) && user.mfaSecret);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export interface AuthUser {
  id:         string;
  email:      string;
  role:       string;
  name:       string;
  employeeId: string;
}

export interface LoginResult extends AuthTokens {
  user: AuthUser;
}

export interface MeResult {
  id:         string;
  email:      string;
  role:       string;
  isActive:   boolean;
  employee: {
    id:              string;
    employeeCode:    string;
    firstName:       string;
    lastName:        string;
    designation:     string;
    employmentType:  string;
    status:          string;
    avatarUrl:       string | null;
    phone:           string | null;
    dateOfJoining:   Date;
    department: {
      id:   string;
      name: string;
    };
    location: {
      id:      string;
      name:    string;
      city:    string;
      country: string;
    } | null;
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateAccessToken(payload: {
  sub:        string;
  role:       string;
  name:       string;
  employeeId: string;
}): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function accessTokenTTLSeconds(): number {
  // Parse "15m" → 900 seconds; fallback to 900
  const raw = env.JWT_ACCESS_EXPIRES_IN;
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit  = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 60);
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Authenticate a user by email + password.
 * Returns a fresh access/refresh token pair plus a slim user object.
 */
export async function login(dto: LoginDTO, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: dto.email },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!user) throw Errors.INVALID_CREDENTIALS();

  const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!passwordValid) throw Errors.INVALID_CREDENTIALS();

  if (!user.isActive) throw Errors.ACCOUNT_INACTIVE();

  if (!user.employee) {
    throw new AppError('NO_EMPLOYEE_PROFILE', 'No employee profile linked to this account', 403);
  }

  if (await mfaRequired(user)) {
    if (!dto.mfaCode) throw Errors.MFA_REQUIRED();
    if (!verifyTotp(user.mfaSecret!, dto.mfaCode)) throw Errors.MFA_INVALID();
  }

  const employeeId = user.employee.id;
  const name       = `${user.employee.firstName} ${user.employee.lastName}`;

  // Generate tokens
  const accessToken      = generateAccessToken({ sub: user.id, role: user.role, name, employeeId });
  const rawRefreshToken  = crypto.randomUUID();
  const hashedRefresh    = hashToken(rawRefreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      userId:       user.id,
      refreshToken: hashedRefresh,
      expiresAt,
      ipAddress:    ipAddress ?? null,
      userAgent:    userAgent ?? null,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id:         user.id,
      email:      user.email,
      role:       user.role,
      name,
      employeeId,
    },
  };
}

export async function setupMfa(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.NOT_FOUND('User');
  const secret = randomBase32Secret();
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });
  return { secret, otpauthUrl: `otpauth://totp/PulseHR:${encodeURIComponent(user.email)}?secret=${secret}&issuer=PulseHR` };
}

export async function verifyMfa(userId: string, code: string): Promise<{ enabled: true }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { mfaSecret: true } });
  if (!user?.mfaSecret || !verifyTotp(user.mfaSecret, code)) throw Errors.MFA_INVALID();
  return { enabled: true };
}

/**
 * Rotate a refresh token: validate the session, issue a new pair, delete the old session.
 */
export async function refresh(dto: RefreshDTO): Promise<AuthTokens> {
  const hashedIncoming = hashToken(dto.refreshToken);

  const session = await prisma.session.findUnique({
    where: { refreshToken: hashedIncoming },
    include: {
      user: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!session) throw Errors.TOKEN_INVALID();
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    throw Errors.TOKEN_INVALID();
  }

  const { user } = session;

  if (!user.isActive) throw Errors.ACCOUNT_INACTIVE();
  if (!user.employee) {
    throw new AppError('NO_EMPLOYEE_PROFILE', 'No employee profile linked to this account', 403);
  }

  const employeeId = user.employee.id;
  const name       = `${user.employee.firstName} ${user.employee.lastName}`;

  const newAccessToken     = generateAccessToken({ sub: user.id, role: user.role, name, employeeId });
  const newRawRefresh      = crypto.randomUUID();
  const newHashedRefresh   = hashToken(newRawRefresh);
  const expiresAt          = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Rotate: delete old session and create new one atomically
  await prisma.$transaction([
    prisma.session.delete({ where: { id: session.id } }),
    prisma.session.create({
      data: {
        userId:       user.id,
        refreshToken: newHashedRefresh,
        expiresAt,
        ipAddress:    session.ipAddress,
        userAgent:    session.userAgent,
      },
    }),
  ]);

  return {
    accessToken:  newAccessToken,
    refreshToken: newRawRefresh,
  };
}

/**
 * Logout: delete the session and blocklist the current access token in Redis.
 * tokenTTL is the remaining lifetime of the access token in seconds.
 */
export async function logout(userId: string, rawAccessToken: string, tokenTTL?: number): Promise<void> {
  // Delete all sessions for this user (single-device logout).
  // To support multi-device, pass a sessionId and delete only that session.
  await prisma.session.deleteMany({ where: { userId } });

  // Blocklist the access token so it cannot be reused within its remaining TTL
  const ttl = tokenTTL ?? accessTokenTTLSeconds();
  if (ttl > 0) {
    await redis.setEx(`blocklist:${rawAccessToken}`, ttl, '1');
  }
}

/**
 * Return the full user record enriched with the linked employee profile,
 * department, and location.
 */
export async function me(userId: string): Promise<MeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:       true,
      email:    true,
      role:     true,
      isActive: true,
      employee: {
        select: {
          id:             true,
          employeeCode:   true,
          firstName:      true,
          lastName:       true,
          designation:    true,
          employmentType: true,
          status:         true,
          avatarUrl:      true,
          phone:          true,
          dateOfJoining:  true,
          department: {
            select: { id: true, name: true },
          },
          location: {
            select: { id: true, name: true, city: true, country: true },
          },
        },
      },
    },
  });

  if (!user) throw Errors.NOT_FOUND('User');

  return user;
}
