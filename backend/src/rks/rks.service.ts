import { Injectable, NotFoundException } from '@nestjs/common';
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
}
