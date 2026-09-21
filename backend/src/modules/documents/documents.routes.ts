import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { UploadDocumentSchema, ListDocumentsQuerySchema } from './documents.schema';
import * as controller from './documents.controller';

export const documentsRouter = Router();

// All document routes require a valid JWT
documentsRouter.use(authenticate);

/**
 * GET /documents
 * List documents. EMPLOYEE sees their own; HR/ADMIN see all.
 * Supports: ?page, ?limit, ?category, ?search
 */
documentsRouter.get(
  '/',
  validate(ListDocumentsQuerySchema, 'query'),
  controller.list,
);

/**
 * POST /documents
 * Upload a new document (multipart/form-data).
 * Fields: file (required), category (required), name?, isPublic?
 * multerUpload.single runs before the Zod body validator so req.file is
 * available and req.body contains the parsed text fields.
 */
documentsRouter.post(
  '/',
  controller.multerUpload.single('file'),
  validate(UploadDocumentSchema, 'body'),
  controller.upload,
);

/**
 * GET /documents/:id/download
 * Stream the file to the client. Ownership check is enforced in the service.
 */
documentsRouter.get('/:id/download', controller.download);

/**
 * DELETE /documents/:id
 * Delete a document. EMPLOYEE can only delete their own; HR/ADMIN can delete any.
 * The ownership check lives in the service layer.
 */
documentsRouter.delete('/:id', controller.remove);
