import { Router, Request, Response, NextFunction } from 'express';
import { DocumentService } from '../../services/document.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { uploadMiddleware } from '../../middleware/upload.middleware';
import { createDocumentSchema, listDocumentsSchema } from '../../validators/document.schema';
import { getPagination } from '../../utils/pagination';
import { success } from '../../utils/response';

const router = Router();
const documentService = new DocumentService();

router.get('/',
  authMiddleware,
  requirePermission('documents.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage } = getPagination(req.query as any);
      const parsed = listDocumentsSchema.safeParse({ ...req.query, page, perPage });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await documentService.list(parsed.data);
      res.json(success(result.data, result.pagination));
    } catch (err) { next(err); }
  });

router.get('/by-resource',
  authMiddleware,
  requirePermission('documents.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resourceType, resourceId } = req.query as { resourceType: string; resourceId: string };
      if (!resourceType || !resourceId) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'resourceType dan resourceId diperlukan.' } });
      }
      const result = await documentService.getByResource(resourceType, resourceId);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.get('/versions',
  authMiddleware,
  requirePermission('documents.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resourceType, resourceId, documentTypeId } = req.query as { resourceType: string; resourceId: string; documentTypeId: string };
      if (!resourceType || !resourceId || !documentTypeId) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'resourceType, resourceId, dan documentTypeId diperlukan.' } });
      }
      const result = await documentService.getVersions(resourceType, resourceId, documentTypeId);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/',
  authMiddleware,
  requirePermission('documents.create'),
  uploadMiddleware.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 'FILE_REQUIRED', message: 'File harus diunggah.' } });
      }

      const parsed = createDocumentSchema.safeParse({ ...req.body, departmentId: req.body.departmentId || null });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }

      const result = await documentService.upload(req.file, {
        ...parsed.data,
        departmentId: parsed.data.departmentId || null,
        uploadedBy: req.user!.sub,
      });
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

router.delete('/:id',
  authMiddleware,
  requirePermission('documents.delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await documentService.delete(req.params.id);
      res.json(success(result));
    } catch (err) { next(err); }
  });

export default router;
