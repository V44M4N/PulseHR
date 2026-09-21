import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { Errors } from '../../../utils/errors';
import { cacheDel } from '../../../config/redis';
import type { UpdateSettingDTO } from './settings.schema';

// ── Default settings ──────────────────────────────────────────────────────────

const DEFAULTS: Record<string, { category: string; value: Prisma.InputJsonValue }> = {
  'auth.mfa': {
    category: 'auth',
    value: { enabled: false, requiredForRoles: ['ADMIN'] },
  },
  'auth.sso': {
    category: 'auth',
    value: { enabled: false, provider: 'google', domain: '' },
  },
  'auth.ipAllowlist': {
    category: 'auth',
    value: { enabled: false, ips: [] },
  },
  'auth.session': {
    category: 'auth',
    value: { maxSessions: 3, idleTimeoutMinutes: 60 },
  },
  'locale.timezone': {
    category: 'locale',
    value: 'Asia/Kolkata',
  },
  'locale.currency': {
    category: 'locale',
    value: 'INR',
  },
  'locale.dateFormat': {
    category: 'locale',
    value: 'DD/MM/YYYY',
  },
  'locale.fiscalYear': {
    category: 'locale',
    value: { startMonth: 4 },
  },
  'privacy.retention': {
    category: 'privacy',
    value: { employeeDataDays: 2555, auditLogDays: 365 },
  },
  'notifications.leaveApproval': {
    category: 'notifications',
    value: {
      enabled: true,
      emailTemplate: 'Your leave request has been {{status}}.',
    },
  },
};

// ── Service ───────────────────────────────────────────────────────────────────

export const settingsService = {
  /**
   * Return all CompanySettings grouped by category.
   * Shape: { auth: { mfa: {...}, sso: {...} }, locale: { timezone: '...' }, ... }
   */
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const settings = await prisma.companySetting.findMany({
      orderBy: { key: 'asc' },
    });

    const grouped: Record<string, Record<string, unknown>> = {};
    for (const s of settings) {
      if (!grouped[s.category]) grouped[s.category] = {};
      // Use the sub-key after the first dot (e.g. "auth.mfa" → "mfa")
      const subKey = s.key.includes('.')
        ? s.key.split('.').slice(1).join('.')
        : s.key;
      grouped[s.category][subKey] = s.value;
    }
    return grouped;
  },

  /**
   * Return all settings rows for a given category.
   */
  async getByCategory(category: string) {
    const settings = await prisma.companySetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
    return settings;
  },

  /**
   * Return a single setting by its full key (e.g. "auth.mfa").
   * Falls back to the in-memory default when the row does not exist yet.
   */
  async getOne(key: string) {
    const setting = await prisma.companySetting.findUnique({ where: { key } });
    if (setting) return setting;

    const def = DEFAULTS[key];
    if (!def) throw Errors.NOT_FOUND('Setting');

    // Return the default shape so callers get a consistent object
    return { key, category: def.category, value: def.value, updatedBy: null };
  },

  /**
   * Upsert a setting value and purge its Redis cache entry.
   */
  async update(key: string, dto: UpdateSettingDTO, updatedBy: string) {
    const existing = await prisma.companySetting.findUnique({ where: { key } });
    const def = DEFAULTS[key];
    const category =
      existing?.category ?? def?.category ?? key.split('.')[0];

    const result = await prisma.companySetting.upsert({
      where: { key },
      update: { value: dto.value, updatedBy },
      create: { key, category, value: dto.value, updatedBy },
    });

    await cacheDel(`settings:${key}`);
    return result;
  },

  /**
   * Idempotently create all default settings rows.
   * Call this from the seed script — never in request handlers.
   */
  async seed() {
    for (const [key, { category, value }] of Object.entries(DEFAULTS)) {
      await prisma.companySetting.upsert({
        where: { key },
        // Do not overwrite existing customised values on re-seed
        update: {},
        create: { key, category, value, updatedBy: 'system' },
      });
    }
  },
};
