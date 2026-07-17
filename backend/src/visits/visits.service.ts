import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProspect(prospectId: string) {
    return this.prisma.visit.findMany({
      where: { prospectId },
      orderBy: { visitNumber: 'asc' },
      include: { picUser: { select: { id: true, fullName: true } } },
    });
  }

  async get(id: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async create(data: { prospectId: string; customerId?: string; date: string; notes?: string; picName?: string; picUserId?: string }) {
    const lastVisit = await this.prisma.visit.findFirst({
      where: { prospectId: data.prospectId },
      orderBy: { visitNumber: 'desc' },
      select: { visitNumber: true },
    });
    const visitNumber = (lastVisit?.visitNumber || 0) + 1;

    return this.prisma.visit.create({
      data: {
        prospectId: data.prospectId,
        customerId: data.customerId,
        visitNumber,
        date: new Date(data.date),
        notes: data.notes,
        picName: data.picName,
        picUserId: data.picUserId,
        status: 'pending',
      },
    });
  }

  async update(id: string, data: { status?: string; notes?: string; picName?: string; date?: string }) {
    await this.get(id);
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.picName !== undefined) updateData.picName = data.picName;
    if (data.date) updateData.date = new Date(data.date);
    return this.prisma.visit.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    await this.get(id);
    return this.prisma.visit.delete({ where: { id } });
  }
}
