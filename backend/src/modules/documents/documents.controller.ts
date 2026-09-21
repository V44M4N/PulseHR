import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { AppError } from '../../utils/errors';
import { ok } from '../../utils/response';
import { getPagination } from '../../utils/pagination';
import * as service from './documents.service';
import type { UploadDocumentDto, ListDocumentsQueryDto } from './documents.schema';

// ── Multer configuration ──────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpDir = path.join(process.cwd(), 'uploads', 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (_req, file, cb) => {
    const ext      = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'INVALID_FILE_TYPE',
        'Only PDF, JPEG, PNG, and DOCX files are accepted',
        415,
      ),
    );
  }
}

export const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// ── Controllers ───────────────────────────────────────────────────────────────

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pagination = getPagination(req);
    const query: ListDocumentsQueryDto = {
      page:     pagination.page,
      limit:    pagination.limit,
      category: (req.query as unknown as ListDocumentsQueryDto).category,
      search:   (req.query as unknown as ListDocumentsQueryDto).search,
    };
    const { items, meta } = await service.list(
      req.user.employeeId,
      req.user.role,
      query,
    );
    res.json(ok(items, meta));
  } catch (err) {
    next(err);
  }
};

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await service.getById(
      req.params.id,
      req.user.employeeId,
      req.user.role,
    );
    res.json(ok(doc));
  } catch (err) {
    next(err);
  }
};

export const upload = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('NO_FILE', 'A file must be attached', 400);
    }

    const dto = req.body as UploadDocumentDto;

    const doc = await service.upload(
      req.user.employeeId,
      req.file,
      dto,
      req.user.employeeId,
    );

    res.status(201).json(ok(doc));
  } catch (err) {
    next(err);
  }
};

export const download = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const absolutePath = await service.download(
      req.params.id,
      req.user.employeeId,
      req.user.role,
    );

    // Derive a safe filename from the path for Content-Disposition
    const filename = path.basename(absolutePath);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-cache');

    const stream = fs.createReadStream(absolutePath);

    stream.on('error', (streamErr) => {
      next(
        new AppError('STREAM_ERROR', `Failed to stream file: ${streamErr.message}`, 500),
      );
    });

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await service.remove(
      req.params.id,
      req.user.employeeId,
      req.user.role,
    );
    res.json(ok({ deleted: true }));
  } catch (err) {
    next(err);
  }
};
