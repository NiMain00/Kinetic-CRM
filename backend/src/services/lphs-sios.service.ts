import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export class LphsSiosService {
  async getByProject(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    const lphs = await prisma.lphsSios.findUnique({
      where: { projectId },
      include: {
        departmentReviews: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
        targetedRevisions: {
          include: {
            initiator: { select: { id: true, name: true } },
            departments: { include: { department: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    return lphs;
  }

  async create(projectId: string, data: { departmentIds: string[]; linkLphsExternal?: string | null; attachmentIds?: string[] }, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    const existing = await prisma.lphsSios.findUnique({ where: { projectId } });
    if (existing) {
      throw new AppError(409, 'LPHS_ALREADY_EXISTS', 'LPHS/SIOS untuk proyek ini sudah ada.');
    }

    const lphs = await prisma.lphsSios.create({
      data: {
        projectId,
        status: 'draft',
        linkLphsExternal: data.linkLphsExternal || null,
        departmentReviews: {
          create: data.departmentIds.map((deptId) => ({
            departmentId: deptId,
            approvalStatus: 'reviewing',
          })),
        },
      },
      include: {
        departmentReviews: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId,
        eventType: 'lphs_created',
        actorId: userId,
        description: 'Dokumen LPHS/SIOS dibuat.',
      },
    });

    return lphs;
  }

  async submit(id: string, userId: string) {
    const lphs = await prisma.lphsSios.findUnique({
      where: { id },
      include: { departmentReviews: true },
    });
    if (!lphs) {
      throw new AppError(404, 'LPHS_NOT_FOUND', 'LPHS/SIOS tidak ditemukan.');
    }

    if (lphs.status !== 'draft') {
      throw new AppError(400, 'LPHS_INVALID_STATUS', 'Hanya LPHS draft yang bisa disubmit.');
    }

    if (lphs.departmentReviews.length === 0) {
      throw new AppError(400, 'LPHS_NO_DEPARTMENTS', 'Tidak ada department review yang ditugaskan.');
    }

    const updated = await prisma.lphsSios.update({
      where: { id },
      data: {
        status: 'submitted',
      },
      include: {
        departmentReviews: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: lphs.projectId,
        eventType: 'lphs_submitted',
        actorId: userId,
        description: 'LPHS/SIOS disubmit untuk review departemen.',
      },
    });

    return updated;
  }

  async departmentApprove(id: string, deptId: string, userId: string, data?: { comment?: string }) {
    const lphs = await prisma.lphsSios.findUnique({ where: { id } });
    if (!lphs) {
      throw new AppError(404, 'LPHS_NOT_FOUND', 'LPHS/SIOS tidak ditemukan.');
    }

    const review = await prisma.lphsDepartmentReview.findUnique({
      where: { lphsSiosId_departmentId: { lphsSiosId: id, departmentId: deptId } },
    });
    if (!review) {
      throw new AppError(404, 'LPHS_DEPT_REVIEW_NOT_FOUND', 'Review departemen tidak ditemukan.');
    }

    if (review.approvalStatus !== 'reviewing') {
      throw new AppError(400, 'LPHS_DEPT_REVIEW_DONE', 'Departemen ini sudah memberikan keputusan.');
    }

    const updated = await prisma.lphsDepartmentReview.update({
      where: { id: review.id },
      data: {
        approvalStatus: 'approved',
        comment: data?.comment || null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    await this.checkAllDepartmentsApproved(id, lphs.projectId, userId);

    return updated;
  }

  async departmentReject(id: string, deptId: string, userId: string, data: { comment: string }) {
    const lphs = await prisma.lphsSios.findUnique({ where: { id } });
    if (!lphs) {
      throw new AppError(404, 'LPHS_NOT_FOUND', 'LPHS/SIOS tidak ditemukan.');
    }

    const review = await prisma.lphsDepartmentReview.findUnique({
      where: { lphsSiosId_departmentId: { lphsSiosId: id, departmentId: deptId } },
    });
    if (!review) {
      throw new AppError(404, 'LPHS_DEPT_REVIEW_NOT_FOUND', 'Review departemen tidak ditemukan.');
    }

    if (review.approvalStatus !== 'reviewing') {
      throw new AppError(400, 'LPHS_DEPT_REVIEW_DONE', 'Departemen ini sudah memberikan keputusan.');
    }

    const updated = await prisma.lphsDepartmentReview.update({
      where: { id: review.id },
      data: {
        approvalStatus: 'rejected',
        comment: data.comment,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    await prisma.lphsSios.update({
      where: { id },
      data: { status: 'revision' },
    });

    await prisma.lphsTargetedRevision.create({
      data: {
        lphsSiosId: id,
        revisionNumber: lphs.revisionNumber,
        initiatedBy: userId,
        initiatedRole: 'department',
        note: data.comment,
        departments: {
          create: { departmentId: deptId },
        },
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: lphs.projectId,
        eventType: 'lphs_dept_rejected',
        actorId: userId,
        description: `Departemen menolak LPHS/SIOS: ${data.comment}`,
      },
    });

    return updated;
  }

  async pmApprove(id: string, userId: string) {
    const lphs = await prisma.lphsSios.findUnique({
      where: { id },
      include: { departmentReviews: true },
    });
    if (!lphs) {
      throw new AppError(404, 'LPHS_NOT_FOUND', 'LPHS/SIOS tidak ditemukan.');
    }

    const allApproved = lphs.departmentReviews.every((r) => r.approvalStatus === 'approved');
    if (!allApproved) {
      throw new AppError(400, 'LPHS_DEPT_NOT_ALL_APPROVED', 'Semua department harus approve sebelum PM dapat approve.');
    }

    const updated = await prisma.lphsSios.update({
      where: { id },
      data: {
        status: 'approved',
        pmApprovalStatus: 'approved',
        pmApprovedAt: new Date(),
        pmApprovedBy: userId,
      },
      include: {
        departmentReviews: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: lphs.projectId,
        eventType: 'lphs_pm_approved',
        actorId: userId,
        description: 'PM menyetujui LPHS/SIOS.',
      },
    });

    return updated;
  }

  async departmentRevise(id: string, deptId: string, userId: string, data: { attachmentIds?: string[]; note?: string }) {
    const lphs = await prisma.lphsSios.findUnique({ where: { id } });
    if (!lphs) {
      throw new AppError(404, 'LPHS_NOT_FOUND', 'LPHS/SIOS tidak ditemukan.');
    }

    const review = await prisma.lphsDepartmentReview.findUnique({
      where: { lphsSiosId_departmentId: { lphsSiosId: id, departmentId: deptId } },
    });
    if (!review) {
      throw new AppError(404, 'LPHS_DEPT_REVIEW_NOT_FOUND', 'Review departemen tidak ditemukan.');
    }

    const updated = await prisma.lphsDepartmentReview.update({
      where: { id: review.id },
      data: {
        approvalStatus: 'reviewing',
        reviewedBy: null,
        reviewedAt: null,
      },
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    return updated;
  }

  private async checkAllDepartmentsApproved(lphsId: string, projectId: string, userId: string) {
    const lphs = await prisma.lphsSios.findUnique({
      where: { id: lphsId },
      include: { departmentReviews: true },
    });
    if (!lphs) return;

    const allApproved = lphs.departmentReviews.every(
      (r) => r.approvalStatus === 'approved'
    );

    if (allApproved) {
      await prisma.lphsSios.update({
        where: { id: lphsId },
        data: { status: 'approved' },
      });

      await prisma.projectTimelineEvent.create({
        data: {
          projectId,
          eventType: 'lphs_all_depts_approved',
          actorId: userId,
          description: 'Semua departemen menyetujui LPHS/SIOS.',
        },
      });
    }
  }
}
