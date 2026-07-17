import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RksService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitize(data: any) {
    const sanitized = { ...data };
    if (sanitized.deadlineTender === '' || sanitized.deadlineTender === undefined) {
      sanitized.deadlineTender = null;
    } else if (typeof sanitized.deadlineTender === 'string') {
      sanitized.deadlineTender = new Date(sanitized.deadlineTender);
    }
    delete sanitized.uploadedFiles;
    delete sanitized.selectedDepartments;
    delete sanitized.departmentsLocked;
    delete sanitized.overallStatus;
    delete sanitized.departmentApprovals;
    return sanitized;
  }

  async getByProject(projectId: string) {
    const rks = await this.prisma.rks.findUnique({
      where: { projectId },
      include: { reviewQuestions: true, reviewNotes: true },
    });
    if (!rks) throw new NotFoundException('RKS not found for this project');
    return rks;
  }

  async save(projectId: string, data: any) {
    const clean = this.sanitize(data);
    const existing = await this.prisma.rks.findUnique({ where: { projectId } });
    if (existing) {
      return this.prisma.rks.update({ where: { projectId }, data: clean });
    }
    return this.prisma.rks.create({ data: { ...clean, projectId } });
  }

  async submit(projectId: string) {
    const rks = await this.prisma.rks.findUnique({ where: { projectId } });
    if (!rks) throw new NotFoundException('RKS not found');
    return this.prisma.rks.update({
      where: { projectId },
      data: { status: 'waiting_pm_approval', submittedAt: new Date(), revisionNumber: rks.revisionNumber + 1 },
    });
  }

  async review(projectId: string, action: { action: 'approve' | 'revision'; notes?: string }) {
    const rks = await this.prisma.rks.findUnique({ where: { projectId } });
    if (!rks) throw new NotFoundException('RKS not found');
    const status = action.action === 'approve' ? 'approved' : 'revision';
    return this.prisma.rks.update({
      where: { projectId },
      data: { status, approvedAt: action.action === 'approve' ? new Date() : null },
    });
  }

  async reviewDepartment(projectId: string, body: { departmentId: string; action: 'approve' | 'revision'; notes?: string; reviewerName?: string }) {
    const rks = await this.prisma.rks.findUnique({ where: { projectId } });
    if (!rks) throw new NotFoundException('RKS not found');

    // Store department review status inside answers JSON
    const answers = (rks.answers as Record<string, any>) || {};
    const deptReviews = answers._departmentReviews || [];

    const existingIdx = deptReviews.findIndex((r: any) => r.departmentId === body.departmentId);
    const reviewEntry = {
      departmentId: body.departmentId,
      status: body.action,
      notes: body.notes || null,
      reviewedBy: body.reviewerName || 'Unknown',
      reviewedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      deptReviews[existingIdx] = { ...deptReviews[existingIdx], ...reviewEntry };
    } else {
      deptReviews.push(reviewEntry);
    }

    const updatedAnswers = { ...answers, _departmentReviews: deptReviews };

    // Check if all departments approved
    const allApproved = deptReviews.length > 0 && deptReviews.every((r: any) => r.status === 'approve');

    return this.prisma.rks.update({
      where: { projectId },
      data: {
        answers: updatedAnswers,
        status: allApproved ? 'waiting_pm_approval' : body.action === 'revision' ? 'revision' : rks.status,
      },
    });
  }
}
