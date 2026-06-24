import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export class DocumentService {
  async list(params: {
    resourceType?: string;
    resourceId?: string;
    documentTypeId?: string;
    page: number;
    perPage: number;
  }) {
    const where: any = { deletedAt: null };
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.resourceId) where.resourceId = params.resourceId;
    if (params.documentTypeId) where.documentTypeId = params.documentTypeId;

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
        orderBy: { uploadedAt: 'desc' },
        include: {
          documentType: { select: { id: true, code: true, label: true } },
          department: { select: { id: true, name: true, code: true } },
          uploader: { select: { id: true, name: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page: params.page,
        perPage: params.perPage,
        totalItems: total,
        totalPages: Math.ceil(total / params.perPage),
      },
    };
  }

  async getByResource(resourceType: string, resourceId: string) {
    const docs = await prisma.document.findMany({
      where: { resourceType, resourceId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
      include: {
        documentType: { select: { id: true, code: true, label: true } },
        uploader: { select: { id: true, name: true } },
      },
    });

    const grouped: Record<string, typeof docs> = {};
    for (const doc of docs) {
      const key = doc.documentType?.code || 'OTHER';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(doc);
    }

    return { documents: docs, grouped };
  }

  async upload(
    file: Express.Multer.File,
    data: {
      documentTypeId: string;
      resourceType: string;
      resourceId: string;
      departmentId?: string | null;
      uploadedBy: string;
    },
  ) {
    const docType = await prisma.documentTypeDefinition.findUnique({ where: { id: data.documentTypeId } });
    if (!docType) {
      throw new AppError(404, 'DOC_TYPE_NOT_FOUND', 'Tipe dokumen tidak ditemukan.');
    }

    const latestVersion = await prisma.document.findFirst({
      where: {
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        documentTypeId: data.documentTypeId,
        deletedAt: null,
      },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const newVersion = (latestVersion?.versionNumber || 0) + 1;

    if (latestVersion) {
      await prisma.document.updateMany({
        where: {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          documentTypeId: data.documentTypeId,
          isLatestVersion: true,
        },
        data: { isLatestVersion: false },
      });
    }

    const document = await prisma.document.create({
      data: {
        documentTypeId: data.documentTypeId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        departmentId: data.departmentId || null,
        fileName: file.originalname,
        fileSizeBytes: BigInt(file.size),
        mimeType: file.mimetype,
        storagePath: file.path,
        versionNumber: newVersion,
        isLatestVersion: true,
        uploadedBy: data.uploadedBy,
      },
      include: {
        documentType: { select: { id: true, code: true, label: true } },
        uploader: { select: { id: true, name: true } },
      },
    });

    return document;
  }

  async getVersions(resourceType: string, resourceId: string, documentTypeId: string) {
    const versions = await prisma.document.findMany({
      where: { resourceType, resourceId, documentTypeId, deletedAt: null },
      orderBy: { versionNumber: 'desc' },
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });

    return versions;
  }

  async delete(id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Dokumen tidak ditemukan.');
    }

    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Dokumen berhasil dihapus.' };
  }
}
