import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { buildMeta } from '../../../utils/pagination';
import type { ListAuditLogsQuery } from './audit-logs.schema';

export const auditLogsService = {
  async list(query: ListAuditLogsQuery, page: number, limit: number, skip: number) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorId) {
      where.actorId = query.actorId;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.from ?? query.to) {
      where.timestamp = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to   ? { lte: new Date(query.to) }   : {}),
      };
    }

    if (query.search) {
      const searchFilter = { contains: query.search, mode: 'insensitive' as const };
      // Merge search OR conditions with the base where via AND so other filters still apply
      where.AND = [
        {
          OR: [
            { actorName: searchFilter },
            { action:    searchFilter },
            { target:    searchFilter },
          ],
        },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, meta: buildMeta(page, limit, total) };
  },
};
