import { Announcement } from '@prisma/client';
import { prisma } from '../../config/database';
import { Errors } from '../../utils/errors';
import { buildMeta } from '../../utils/pagination';
import { CreateAnnouncementDto, ListFeedQuery } from './feed.schema';

export const list = async (query: ListFeedQuery, isAdmin: boolean) => {
  const page  = query.page  ?? 1;
  const limit = query.limit ?? 20;
  const skip  = (page - 1) * limit;
  const where = isAdmin ? {} : { isPublished: true };

  const [announcements, total] = await prisma.$transaction([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.announcement.count({ where }),
  ]);

  return { announcements, meta: buildMeta(page, limit, total) };
};

export const getById = async (id: string): Promise<Announcement> => {
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) throw Errors.NOT_FOUND('Announcement');
  return announcement;
};

export const create = async (
  authorId: string,
  authorName: string,
  dto: CreateAnnouncementDto,
): Promise<Announcement> => {
  return prisma.announcement.create({
    data: {
      title: dto.title,
      body: dto.body,
      authorId,
      authorName,
    },
  });
};

export const react = async (id: string): Promise<Announcement> => {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw Errors.NOT_FOUND('Announcement');

  return prisma.announcement.update({
    where: { id },
    data: { reactions: { increment: 1 } },
  });
};
