import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { success } from '../../utils/response';
import { AppError } from '../../utils/errors';

const router = Router();

router.get('/organization',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await prisma.company.findFirst({
        include: {
          divisions: {
            include: {
              departments: { where: { isActive: true } },
              branches: { where: { isActive: true } },
            },
          },
        },
      });
      res.json(success(org));
    } catch (err) { next(err); }
  });

router.put('/organization',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.company.findFirst();
      if (!existing) {
        const created = await prisma.company.create({ data: req.body });
        return res.json(success(created));
      }
      const updated = await prisma.company.update({
        where: { id: existing.id },
        data: req.body,
      });
      res.json(success(updated));
    } catch (err) { next(err); }
  });

router.get('/workflow',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stages = await prisma.approvalWorkflowStage.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: { slaConfig: true },
      });
      res.json(success(stages));
    } catch (err) { next(err); }
  });

router.put('/workflow',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stages } = req.body;
      if (Array.isArray(stages)) {
        for (const stage of stages) {
          await prisma.approvalWorkflowStage.update({
            where: { id: stage.id },
            data: stage,
          });
        }
      }
      const updated = await prisma.approvalWorkflowStage.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
      res.json(success(updated));
    } catch (err) { next(err); }
  });

router.get('/sla',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const configs = await prisma.slaConfiguration.findMany({
        include: {
          stage: { select: { id: true, stageCode: true, label: true } },
          reminders: true,
        },
      });
      res.json(success(configs));
    } catch (err) { next(err); }
  });

router.put('/sla',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { configs } = req.body;
      if (Array.isArray(configs)) {
        for (const cfg of configs) {
          await prisma.slaConfiguration.update({
            where: { id: cfg.id },
            data: {
              slaWorkingDays: cfg.slaWorkingDays,
              isEnforcementActive: cfg.isEnforcementActive,
            },
          });
        }
      }
      const updated = await prisma.slaConfiguration.findMany({
        include: { stage: { select: { id: true, stageCode: true, label: true } } },
      });
      res.json(success(updated));
    } catch (err) { next(err); }
  });

router.get('/notifications',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await prisma.notificationTemplate.findMany({
        include: { recipients: true },
        orderBy: { eventCode: 'asc' },
      });
      res.json(success(templates));
    } catch (err) { next(err); }
  });

router.put('/notifications/:eventCode',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await prisma.notificationTemplate.update({
        where: { eventCode: req.params.eventCode },
        data: {
          templateText: req.body.templateText,
          isActive: req.body.isActive,
        },
      });
      res.json(success(updated));
    } catch (err) { next(err); }
  });

router.get('/upload-policy',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const policies = await prisma.uploadPolicyConfiguration.findMany({
        include: {
          documentType: { select: { id: true, code: true, label: true } },
          mimeTypes: true,
        },
      });
      res.json(success(policies));
    } catch (err) { next(err); }
  });

router.put('/upload-policy/:id',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await prisma.uploadPolicyConfiguration.update({
        where: { id: req.params.id },
        data: {
          maxSizeMb: req.body.maxSizeMb,
        },
      });
      res.json(success(updated));
    } catch (err) { next(err); }
  });

router.get('/integrations',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const integrations = await prisma.integrationConfiguration.findMany();
      res.json(success(integrations));
    } catch (err) { next(err); }
  });

router.put('/integrations/:key',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await prisma.integrationConfiguration.update({
        where: { key: req.params.key },
        data: { valueEncrypted: req.body.value },
      });
      res.json(success(updated));
    } catch (err) { next(err); }
  });

router.get('/question-types',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const types = await prisma.questionType.findMany({
        orderBy: { code: 'asc' },
      });
      res.json(success(types));
    } catch (err) { next(err); }
  });

router.post('/question-types',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await prisma.questionType.create({
        data: {
          code: req.body.code,
          label: req.body.label,
          isActive: true,
        },
      });
      res.status(201).json(success(created));
    } catch (err) { next(err); }
  });

router.get('/roles',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await prisma.role.findMany({
        include: { rolePermissions: { include: { permission: { select: { id: true, code: true, label: true } } } } },
        orderBy: { name: 'asc' },
      });
      res.json(success(roles));
    } catch (err) { next(err); }
  });

router.post('/roles',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.role.findFirst({ where: { code: req.body.code } });
      if (existing) {
        throw new AppError(409, 'ROLE_EXISTS', 'Kode role sudah digunakan.');
      }
      const created = await prisma.role.create({
        data: {
          code: req.body.code,
          name: req.body.name,
          description: req.body.description,
        },
      });
      res.status(201).json(success(created));
    } catch (err) { next(err); }
  });

router.patch('/roles/:id',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await prisma.role.update({
        where: { id: req.params.id },
        data: {
          ...(req.body.name !== undefined && { name: req.body.name }),
          ...(req.body.description !== undefined && { description: req.body.description }),
        },
      });
      res.json(success(updated));
    } catch (err) { next(err); }
  });

router.get('/roles/:id/permissions',
  authMiddleware,
  requirePermission('config.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: req.params.id },
        include: { permission: { select: { id: true, code: true, label: true } } },
      });
      res.json(success(rolePermissions.map((rp) => rp.permission)));
    } catch (err) { next(err); }
  });

router.put('/roles/:id/permissions',
  authMiddleware,
  requirePermission('config.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { permissions } = req.body;
      await prisma.rolePermission.deleteMany({ where: { roleId: req.params.id } });
      if (Array.isArray(permissions) && permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissions.map((permissionId: string) => ({
            roleId: req.params.id,
            permissionId,
          })),
        });
      }
      const updated = await prisma.rolePermission.findMany({
        where: { roleId: req.params.id },
        include: { permission: { select: { id: true, code: true, label: true } } },
      });
      res.json(success(updated.map((rp) => rp.permission)));
    } catch (err) { next(err); }
  });

router.get('/permissions',
  authMiddleware,
  requirePermission('config.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { code: 'asc' },
      });
      res.json(success(permissions));
    } catch (err) { next(err); }
  });

export default router;
