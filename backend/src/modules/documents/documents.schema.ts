import { z } from 'zod';
import { DocumentCategory } from '@prisma/client';

export const UploadDocumentSchema = z.object({
  category: z.nativeEnum(DocumentCategory),
  name:     z.string().trim().min(1).max(255).optional(),
  isPublic: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional()
    .default(false),
});

export const ListDocumentsQuerySchema = z.object({
  page:     z.coerce.number().int().positive().optional().default(1),
  limit:    z.coerce.number().int().positive().max(100).optional().default(20),
  category: z.nativeEnum(DocumentCategory).optional(),
  search:   z.string().trim().min(1).max(100).optional(),
});

export type UploadDocumentDto     = z.infer<typeof UploadDocumentSchema>;
export type ListDocumentsQueryDto = z.infer<typeof ListDocumentsQuerySchema>;
