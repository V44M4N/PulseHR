import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { fail } from '../utils/response';

function ipv4ToInt(ip: string): number | null {
  const parts = ip.replace(/^::ffff:/, '').split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return parts.reduce((value, part) => (value * 256) + part, 0) >>> 0;
}

function matches(ip: string, rule: string): boolean {
  const [network, prefixText] = rule.trim().split('/');
  const value = ipv4ToInt(ip);
  const target = ipv4ToInt(network);
  if (value === null || target === null) return ip === network;
  const prefix = prefixText === undefined ? 32 : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (target & mask);
}

/** Enforce the admin-configured auth.ipAllowlist setting for privileged routes. */
export async function enforceIpAllowlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const setting = await prisma.companySetting.findUnique({ where: { key: 'auth.ipAllowlist' } });
    const legacy = await prisma.companySetting.findUnique({ where: { key: 'auth.ip_allowlist' } });
    const value = (setting ?? legacy)?.value as { enabled?: boolean; ips?: string[] } | undefined;
    if (!value?.enabled) { next(); return; }
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? req.socket.remoteAddress ?? '';
    if ((value.ips ?? []).some(rule => matches(ip, rule))) { next(); return; }
    res.status(403).json(fail('IP_NOT_ALLOWED', 'This network is not allowed to access administrator routes'));
  } catch (error) { next(error); }
}
