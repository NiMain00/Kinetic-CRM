import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env';

const MAX_SIZE = env.STORAGE_MAX_UPLOAD_MB * 1024 * 1024;

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(env.STORAGE_ROOT, { recursive: true });
      cb(null, env.STORAGE_ROOT);
    } catch (err) {
      cb(err as Error, env.STORAGE_ROOT);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file ${file.mimetype} tidak diizinkan.`));
    }
  },
});
