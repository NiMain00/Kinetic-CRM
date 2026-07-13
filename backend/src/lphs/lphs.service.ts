import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LphsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByProject(projectId: string) {
    const lphs = await this.prisma.lphsSios.findUnique({
      where: { projectId },
      include: {
        departmentReviews: { include: { department: true, reviewer: { select: { id: true, fullName: true } } } },
        targetedRevisions: { include: { departments: true } },
      },
    });
    if (!lphs) throw new NotFoundException('LPHS not found for this project');
    return lphs;
  }

  async save(projectId: string, data: any) {
    const existing = await this.prisma.lphsSios.findUnique({ where: { projectId } });
    if (existing) {
      return this.prisma.lphsSios.update({ where: { projectId }, data });
    }
    return this.prisma.lphsSios.create({ data: { ...data, projectId } });
  }

  async submit(projectId: string) {
    const lphs = await this.prisma.lphsSios.findUnique({ where: { projectId } });
    if (!lphs) throw new NotFoundException('LPHS not found');
    return this.prisma.lphsSios.update({
      where: { projectId },
      data: { overallStatus: 'submitted', submittedAt: new Date(), status: 'lphs_sios' },
    });
  }

  async reviewDepartment(projectId: string, approval: { departmentId: string; status: string; notes?: string; reviewerId: string }) {
    const lphs = await this.prisma.lphsSios.findUnique({ where: { projectId } });
    if (!lphs) throw new NotFoundException('LPHS not found for this project');
    return this.prisma.lphsDepartmentReview.upsert({
      where: { lphsSiosId_departmentId: { lphsSiosId: lphs.id, departmentId: approval.departmentId } },
      update: { approvalStatus: approval.status as any, comment: approval.notes, reviewedBy: approval.reviewerId, reviewedAt: new Date() },
      create: { lphsSiosId: lphs.id, departmentId: approval.departmentId, approvalStatus: approval.status as any, comment: approval.notes, reviewedBy: approval.reviewerId, reviewedAt: new Date() },
    });
  }

  async reviewPm(projectId: string, action: 'approve' | 'revision', notes?: string) {
    const lphs = await this.prisma.lphsSios.findUnique({ where: { projectId } });
    if (!lphs) throw new NotFoundException('LPHS not found');
    return this.prisma.lphsSios.update({
      where: { projectId },
      data: {
        pmApprovalStatus: action === 'approve' ? 'approved' : 'revision_requested',
        pmApprovedAt: action === 'approve' ? new Date() : null,
      },
    });
  }

  async reviewMgmt(projectId: string, action: 'approve' | 'revision', notes?: string) {
    const lphs = await this.prisma.lphsSios.findUnique({ where: { projectId } });
    if (!lphs) throw new NotFoundException('LPHS not found');
    return this.prisma.lphsSios.update({
      where: { projectId },
      data: {
        mgmtApprovalStatus: action === 'approve' ? 'approved' : 'revision_requested',
        mgmtApprovedAt: action === 'approve' ? new Date() : null,
      },
    });
  }
}
