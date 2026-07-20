import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ELEVATED_ROLES = ['super_admin', 'director', 'admin', 'manager', 'supervisor'];

@Injectable()
export class ProspectsService {
  constructor(private readonly prisma: PrismaService) {}

  private isElevated(user: any): boolean {
    return user.userRoles?.some((ur: any) =>
      ELEVATED_ROLES.includes(ur.role?.name?.toLowerCase()),
    ) ?? false;
  }

  private getUserDeptCode(user: any): string | null {
    return user.orgUnit?.code || null;
  }

  private async getAccessibleStageIds(deptCode: string, module: string = 'prospect'): Promise<string[]> {
    const stages = await this.prisma.workflowStage.findMany({
      where: {
        module,
        OR: [
          { ownerDepartmentCode: deptCode },
          { prevDepartmentCode: deptCode },
          { stageDepartments: { some: { departmentCode: deptCode } } },
        ],
      },
      select: { id: true },
    });
    return stages.map(s => s.id);
  }

  async list(params: any, user: any) {
    const conditions: any[] = [{ deletedAt: null }];

    if (!this.isElevated(user)) {
      const deptCode = this.getUserDeptCode(user);
      if (!deptCode) return { data: [], total: 0, page: 1, perPage: 20 };

      const stageIds = await this.getAccessibleStageIds(deptCode);

      const accessOr: any[] = [{ ownerUserId: user.id }];
      if (stageIds.length > 0) {
        accessOr.push({ currentStageId: { in: stageIds } });
      }
      conditions.push({ OR: accessOr });
    }

    if (params?.status) {
      conditions.push({ status: params.status });
    }

    if (params?.search) {
      conditions.push({
        OR: [
          { name: { contains: params.search } },
          { client: { contains: params.search } },
        ],
      });
    }

    const where = conditions.length === 1 ? conditions[0] : { AND: conditions };

    const page = params?.page || 1;
    const perPage = Math.min(Number(params?.perPage) || 20, 100);
    const [data, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          client: true,
          status: true,
          description: true,
          createdAt: true,
          ownerUserId: true,
          isConverted: true,
          convertedToProjectId: true,
          estimatedValue: true,
          customerId: true,
          currentStageId: true,
          branch: true,
          prospectType: true,
          potensiUnit: true,
          source: true,
          customer: {
            select: {
              id: true,
              name: true,
              needsVerification: true,
              level: true,
            },
          },
          ownerUser: {
            select: { id: true, fullName: true },
          },
        },
      }),
      this.prisma.prospect.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async get(id: string, user: any) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        category: true,
        branchRel: true,
        project: true,
        createdBy: { select: { id: true, fullName: true } },
        ownerUser: { select: { id: true, fullName: true } },
        answers: { include: { question: true } },
        reviewQuestions: true,
        reviewNotes: true,
        timelineEvents: { orderBy: { time: 'desc' } },
      },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');

    if (!this.isElevated(user)) {
      const deptCode = this.getUserDeptCode(user);
      const stageIds = deptCode ? await this.getAccessibleStageIds(deptCode) : [];
      const hasAccess = prospect.ownerUserId === user.id ||
        (prospect.currentStageId && stageIds.includes(prospect.currentStageId));
      if (!hasAccess) {
        throw new ForbiddenException('Anda tidak memiliki akses ke prospek ini');
      }
    }

    return prospect;
  }

  async listLight(params: any, user: any) {
    const conditions: any[] = [{ deletedAt: null }];

    if (!this.isElevated(user)) {
      const deptCode = this.getUserDeptCode(user);
      if (!deptCode) return { data: [], total: 0, page: 1, perPage: 20 };
      const stageIds = await this.getAccessibleStageIds(deptCode);
      const accessOr: any[] = [{ ownerUserId: user.id }];
      if (stageIds.length > 0) accessOr.push({ currentStageId: { in: stageIds } });
      conditions.push({ OR: accessOr });
    }

    const where = conditions.length === 1 ? conditions[0] : { AND: conditions };
    const page = params?.page || 1;
    const perPage = Math.min(Number(params?.perPage) || 100, 100);

    const [data, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          client: true,
          customerId: true,
          source: true,
          potensiUnit: true,
          createdAt: true,
          ownerUser: {
            select: { id: true, fullName: true },
          },
          customer: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
      }),
      this.prisma.prospect.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async create(data: any, user: any) {
    return this.prisma.prospect.create({
      data: {
        ...data,
        ownerUserId: data.ownerUserId || user.id,
        createdByUserId: user.id,
      },
    });
  }

  private async checkWriteAccess(prospect: any, user: any): Promise<void> {
    if (this.isElevated(user)) return;
    if (prospect.ownerUserId === user.id) return;

    const deptCode = this.getUserDeptCode(user);
    if (!deptCode) throw new ForbiddenException('Anda tidak memiliki akses write ke prospek ini');
    if (!prospect.currentStageId) throw new ForbiddenException('Anda tidak memiliki akses write ke prospek ini');

    const hasWrite = await this.prisma.workflowStage.findFirst({
      where: {
        id: prospect.currentStageId,
        OR: [
          { ownerDepartmentCode: deptCode },
          { stageDepartments: { some: { departmentCode: deptCode, accessLevel: 'write' } } },
        ],
      },
    });
    if (!hasWrite) {
      throw new ForbiddenException('Anda tidak memiliki akses write ke prospek ini');
    }
  }

  async update(id: string, data: any, user: any) {
    const prospect = await this.get(id, user);
    await this.checkWriteAccess(prospect, user);

    // Validasi: jika customer level bukan hot, blokir perubahan pada field detail prospek
    const detailFields = ['name', 'client', 'estimatedValue', 'description', 'answers', 'projectType', 'source', 'branch', 'industryId', 'providerExisting'];
    if (prospect.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: prospect.customerId },
      });
      if (customer && customer.level && customer.level !== 'hot') {
        const changedDetailFields = detailFields.filter(f => f in data);
        if (changedDetailFields.length > 0) {
          throw new ForbiddenException(
            `Customer masih level ${customer.level}. Hanya customer level Hot yang bisa mengubah detail prospek. Perubahan pada field: ${changedDetailFields.join(', ')} tidak diizinkan.`
          );
        }
      }
    }

    const mapped: any = { ...data };

    // Validasi promosi Lead → Potensial
    if (prospect.status === 'Lead' && mapped.status === 'Potensial') {
      const customer = await this.prisma.customer.findFirst({
        where: { id: prospect.customerId || '' },
      });
      if (customer?.needsVerification) {
        throw new ForbiddenException('Customer harus diverifikasi dahulu sebelum Lead dapat dinaikkan ke Prospek.');
      }
      if ((mapped.potensiUnit ?? prospect.potensiUnit) <= 0) {
        throw new ForbiddenException('Potensi unit harus lebih dari 0 untuk naik dari Lead ke Prospek.');
      }
      // Phase 2: minimal 1 kunjungan completed
      const completedVisits = await this.prisma.visit.count({
        where: { prospectId: id, status: 'completed' },
      });
      if (completedVisits < 1) {
        throw new ForbiddenException('Lead harus memiliki minimal 1 kunjungan (Visit) untuk naik ke Prospek.');
      }
    }

    if ('projectId' in mapped) {
      mapped.convertedToProjectId = mapped.projectId ?? null;
      mapped.isConverted = mapped.projectId != null;
      delete mapped.projectId;
    }
    return this.prisma.prospect.update({ where: { id }, data: mapped });
  }

  async delete(id: string, user: any) {
    const prospect = await this.get(id, user);
    await this.checkWriteAccess(prospect, user);
    return this.prisma.$transaction(async (tx) => {
      const linked = await tx.project.findMany({
        where: { sourceProspectId: id, deletedAt: null },
      });
      for (const proj of linked) {
        await tx.procurement.updateMany({
          where: { sourceProjectId: proj.id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        await tx.project.update({
          where: { id: proj.id },
          data: { deletedAt: new Date() },
        });
      }
      return tx.prospect.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  async promoteLevel(prospectId: string, newLevel: string, user: any) {
    const prospect = await this.get(prospectId, user);
    await this.checkWriteAccess(prospect, user);
    if (!prospect.customerId) {
      throw new BadRequestException('Prospek ini tidak memiliki customer');
    }

    const validLevels = ['low', 'medium', 'hot'] as const;
    if (!validLevels.includes(newLevel as any)) {
      throw new BadRequestException('Level tidak valid. Pilihan: low, medium, hot');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: prospect.customerId },
    });

    // Validasi: hanya boleh naik level
    const levelOrder = { low: 0, medium: 1, hot: 2 };
    if (customer?.level && levelOrder[newLevel as keyof typeof levelOrder] <= levelOrder[customer.level]) {
      throw new BadRequestException('Level hanya bisa dinaikkan (low → medium → hot)');
    }

    return this.prisma.customer.update({
      where: { id: prospect.customerId },
      data: { level: newLevel as any },
    });
  }
}
