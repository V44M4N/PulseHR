import path from 'path';
import { promises as fs } from 'fs';
import { DocumentCategory } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, Errors } from '../../utils/errors';
import { buildMeta } from '../../utils/pagination';
import type { UploadDocumentDto, ListDocumentsQueryDto } from './documents.schema';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

const HR_ROLES: Role[] = ['HR', 'ADMIN'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isElevated(role: string): boolean {
  return HR_ROLES.includes(role as Role);
}

// ── Service ───────────────────────────────────────────────────────────────────

export async function list(
  employeeId: string,
  role: string,
  query: ListDocumentsQueryDto,
) {
  const { page, limit, category, search } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(isElevated(role) ? {} : { employeeId }),
    ...(category ? { category: category as DocumentCategory } : {}),
    ...(search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:         true,
        name:       true,
        category:   true,
        fileSize:   true,
        mimeType:   true,
        isPublic:   true,
        uploadedBy: true,
        employeeId: true,
        createdAt:  true,
        employee: {
          select: {
            firstName: true,
            lastName:  true,
          },
        },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getById(
  id: string,
  employeeId: string,
  role: string,
) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw Errors.NOT_FOUND('Document');

  if (!isElevated(role) && doc.employeeId !== employeeId) {
    throw Errors.FORBIDDEN();
  }

  return doc;
}

export async function upload(
  employeeId: string,
  file: Express.Multer.File,
  dto: UploadDocumentDto,
  uploadedById: string,
) {
  // Build destination directory uploads/<employeeId>/
  const destDir = path.join(process.cwd(), 'uploads', employeeId);
  await fs.mkdir(destDir, { recursive: true });

  // Construct a unique filename to avoid collisions
  const ext      = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 100);
  const uniqueName = `${Date.now()}-${baseName}${ext}`;
  const destPath   = path.join(destDir, uniqueName);

  // Move file from uploads/tmp to uploads/<employeeId>/
  await fs.rename(file.path, destPath);

  // Relative path stored in DB (portable across deployments)
  const relPath = path.join('uploads', employeeId, uniqueName);

  const doc = await prisma.document.create({
    data: {
      employeeId,
      name:       dto.name ?? file.originalname,
      category:   dto.category,
      filePath:   relPath,
      fileSize:   formatFileSize(file.size),
      mimeType:   file.mimetype,
      uploadedBy: uploadedById,
      isPublic:   dto.isPublic ?? false,
    },
  });

  return doc;
}

export async function download(
  id: string,
  employeeId: string,
  role: string,
): Promise<string> {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw Errors.NOT_FOUND('Document');

  if (!isElevated(role) && doc.employeeId !== employeeId) {
    throw Errors.FORBIDDEN();
  }

  const absolutePath = path.join(process.cwd(), doc.filePath);

  // Verify file exists on disk before handing path to the controller
  try {
    await fs.access(absolutePath);
  } catch {
    throw new AppError('FILE_NOT_FOUND', 'The file no longer exists on disk', 404);
  }

  return absolutePath;
}

export async function remove(
  id: string,
  employeeId: string,
  role: string,
): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw Errors.NOT_FOUND('Document');

  if (!isElevated(role) && doc.employeeId !== employeeId) {
    throw Errors.FORBIDDEN();
  }

  // Hard-delete the DB record; file stays on disk (MVP acceptable)
  await prisma.document.delete({ where: { id } });
}
