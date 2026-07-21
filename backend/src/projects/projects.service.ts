import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STATUS_TO_EVENT_KEY, EVENT_KEY_LABEL } from '../analytics/analytics.constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: any) {
    const where: any = { deletedAt: null };
    if (params?.status) where.status = params.status;
    if (params?.type) where.type = params.type;
    if (params?.search) {
      where.OR = [{ name: { contains: params.search } }, { code: { contains: params.search } }, { client: { contains: params.search } }];
    }
    if (params?.result) {
      where.tenderResult = { result: params.result };
    }
    if (params?.excludeResult) {
      const excluded = params.excludeResult.split(',');
      where.NOT = [
        { tenderResult: { result: { in: excluded } } },
      ];
    }

    const page = params?.page || 1;
    const perPage = Math.min(Number(params?.perPage) || 50, 100);
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where, skip: (page - 1) * perPage, take: perPage, orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, code: true, status: true, client: true,
          type: true, estimatedValue: true,
          createdAt: true, updatedAt: true, ownerUserId: true,
          sourceProspectId: true, branch: true,
          category: { select: { id: true, name: true, colorHex: true } },
          statusDef: { select: { id: true, label: true, colorHex: true, textColorHex: true } },
          ownerUser: { select: { id: true, fullName: true } },
          lphsSios: { select: { overallStatus: true } },
          tenderResult: { select: { result: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total, page, perPage };
  }

  async get(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: { include: { user: { select: { id: true, fullName: true } } } },
        rks: { include: { reviewQuestions: true, reviewNotes: true } },
        lphsSios: { include: { departmentReviews: { include: { department: true, reviewer: { select: { id: true, fullName: true } } } }, targetedRevisions: true } },
        priceSubmission: true, projectCompetitors: { include: { competitor: true } },
        tenderResult: true, deliveryTarget: true,
        timelineEvents: { orderBy: { time: 'desc' }, include: { actorUser: { select: { fullName: true } } } },
        category: true, statusDef: true, prospect: true,
        createdBy: { select: { id: true, fullName: true } },
        ownerUser: { select: { id: true, fullName: true } },
        tasks: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(data: any) {
    try {
      return await this.prisma.project.create({ data });
    } catch (err) {
      console.error('Prisma create project error:', err);
      throw err;
    }
  }

  async update(id: string, data: any, actorInfo?: { userId?: string; fullName?: string }) {
    const existing = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, sourceProspectId: true, status: true },
    });
    if (!existing) throw new NotFoundException('Project not found');

    const oldStatus = existing.status;

    // Handle timelineEvents terpisah agar bisa validasi actor UUID
    const timelinePayload = data.timelineEvents;
    delete data.timelineEvents;
    if (timelinePayload?.create) {
      const events = Array.isArray(timelinePayload.create) ? timelinePayload.create : [timelinePayload.create];
      for (const evt of events) {
        if (evt.actor && !UUID_REGEX.test(String(evt.actor))) {
          const user = await this.prisma.user.findFirst({
            where: { fullName: evt.actor },
            select: { id: true },
          });
          if (user) evt.actor = user.id;
          else delete evt.actor;
        }
        evt.projectId = id;
        await this.prisma.projectTimelineEvent.create({ data: evt });
      }
    }

    const oneToOneRelations = ['lphsSios', 'priceSubmission', 'tenderResult', 'deliveryTarget', 'rks'];
    const prismaOps = new Set(['upsert', 'create', 'update', 'delete', 'disconnect', 'connect']);
    const nested: any = {};
    for (const key of oneToOneRelations) {
      if (data[key] !== undefined && data[key] !== null) {
        const isPrismaOp = data[key] && typeof data[key] === 'object' && Object.keys(data[key]).some(k => prismaOps.has(k));
        nested[key] = isPrismaOp ? data[key] : { upsert: { create: data[key], update: data[key] } };
        delete data[key];
      }
    }
    // Handle prospect linking/unlinking
    if ('sourceProspectId' in data) {
      const newProspectId = data.sourceProspectId;
      const oldProspectId = existing.sourceProspectId;

      if (newProspectId !== oldProspectId) {
        if (oldProspectId) {
          await this.prisma.prospect.update({
            where: { id: oldProspectId },
            data: { convertedToProjectId: null, isConverted: false },
          });
        }
        if (newProspectId) {
          await this.prisma.prospect.update({
            where: { id: newProspectId },
            data: { convertedToProjectId: id, isConverted: true },
          });
        }
      }
    }

    const updated = await this.prisma.project.update({ where: { id }, data: { ...data, ...nested } });

    // ── Auto-log status changes ──
    const newStatus = updated.status;
    if (oldStatus && newStatus && oldStatus !== newStatus) {
      const eventKey = STATUS_TO_EVENT_KEY[newStatus];
      const prevEventKey = STATUS_TO_EVENT_KEY[oldStatus];
      if (eventKey) {
        // Calculate duration from previous event if available
        let durationMinutes: number | null = null;
        if (prevEventKey) {
          const prevEvent = await this.prisma.projectTimelineEvent.findFirst({
            where: { projectId: id, eventKey: prevEventKey },
            orderBy: { occurredAt: 'desc' },
          });
          if (prevEvent?.occurredAt) {
            durationMinutes = Math.round(
              (new Date().getTime() - new Date(prevEvent.occurredAt).getTime()) / 60000,
            );
          }
        }

        await this.prisma.projectTimelineEvent.create({
          data: {
            projectId: id,
            title: `Status berubah: ${oldStatus} → ${newStatus}`,
            actor: actorInfo?.fullName || 'System',
            type: 'status_change',
            eventKey,
            eventLabel: EVENT_KEY_LABEL[eventKey] || newStatus,
            previousStatus: oldStatus,
            nextStatus: newStatus,
            actorUserId: actorInfo?.userId || null,
            occurredAt: new Date(),
            durationMinutes,
            prevVal: oldStatus,
            newVal: newStatus,
          },
        });
      }
    }

    return updated;
  }

  async delete(id: string) {
    const exists = await this.prisma.project.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!exists) throw new NotFoundException('Project not found');
    return this.prisma.$transaction(async (tx) => {
      await tx.procurement.updateMany({
        where: { sourceProjectId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return tx.project.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
