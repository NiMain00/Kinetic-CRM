import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PROJECT_STATUS_FLOW,
  EVENT_KEY_LABEL,
  DEFAULT_BOTTLENECK_THRESHOLD_DAYS,
  DEFAULT_SLA_DAYS,
} from './analytics.constants';
import type {
  AnalyticsFilter,
  DashboardAnalyticsDto,
  AnalyticsKpiDto,
  LeadTimeDto,
  StageDurationDto,
  BottleneckDto,
  HeatmapCellDto,
  TransitionDurationDto,
  ProjectTimelineAnalyticsDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClauses(filters: AnalyticsFilter): string[] {
    const clauses: string[] = ['pte.deleted_at IS NULL'];
    const params: string[] = [];

    if (filters.startDate) {
      clauses.push('pte.occurred_at >= $1');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      clauses.push(`pte.occurred_at <= $${params.length + 1}`);
      params.push(filters.endDate);
    }
    if (filters.branch) {
      clauses.push(`p.branch = $${params.length + 1}`);
      params.push(filters.branch);
    }
    if (filters.ownerUserId) {
      clauses.push(`p.owner_user_id = $${params.length + 1}`);
      params.push(filters.ownerUserId);
    }
    if (filters.status) {
      clauses.push(`p.status = $${params.length + 1}`);
      params.push(filters.status);
    }

    return clauses;
  }

  async getDashboardAnalytics(filters: AnalyticsFilter): Promise<DashboardAnalyticsDto> {
    const [kpis, leadTime, stageDuration, bottlenecks, throughput, heatmap, statusDistribution] =
      await Promise.all([
        this.getKpis(filters),
        this.getLeadTime(filters),
        this.getStageDuration(filters),
        this.getBottlenecks(filters),
        this.getThroughput(filters),
        this.getHeatmap(filters),
        this.getStatusDistribution(filters),
      ]);

    return { kpis, leadTime, stageDuration, bottlenecks, throughput, heatmap, statusDistribution };
  }

  async getKpis(filters: AnalyticsFilter): Promise<AnalyticsKpiDto> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        COUNT(DISTINCT p.id) AS total_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'Selesai' THEN p.id END) AS completed_projects,
        COUNT(DISTINCT CASE WHEN p.status NOT IN ('Selesai','Dibatalkan','Kalah') THEN p.id END) AS active_projects,
        AVG(CASE WHEN complete.occurred_at IS NOT NULL AND start.occurred_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400 END) AS avg_lead_days,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY
          CASE WHEN complete.occurred_at IS NOT NULL AND start.occurred_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400 END
        ) AS median_lead_days,
        MIN(CASE WHEN complete.occurred_at IS NOT NULL AND start.occurred_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400 END) AS fastest_days,
        MAX(CASE WHEN complete.occurred_at IS NOT NULL AND start.occurred_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400 END) AS slowest_days,
        AVG(CASE WHEN rks_approved.occurred_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (approved_event.occurred_at - rks_approved.occurred_at))/86400 END) AS approval_cycle_days,
        AVG(CASE WHEN po_wait_start.occurred_at IS NOT NULL AND po_wait_end.occurred_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (po_wait_end.occurred_at - po_wait_start.occurred_at))/86400 END) AS po_waiting_days,
        AVG(CASE WHEN exec_start.occurred_at IS NOT NULL AND exec_end.occurred_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (exec_end.occurred_at - exec_start.occurred_at))/86400 END) AS execution_cycle_days
      FROM projects p
      LEFT JOIN project_timeline_events start ON start.project_id = p.id AND start.event_key = 'CREATED'
      LEFT JOIN project_timeline_events complete ON complete.project_id = p.id AND complete.event_key = 'SELESAI'
      LEFT JOIN project_timeline_events rks_approved ON rks_approved.project_id = p.id AND rks_approved.event_key = 'RKS_APPROVED'
      LEFT JOIN project_timeline_events approved_event ON approved_event.project_id = p.id AND approved_event.event_key = 'PENAWARAN_DIKIRIM'
      LEFT JOIN project_timeline_events po_wait_start ON po_wait_start.project_id = p.id AND po_wait_start.event_key = 'MENUNGGU_PO'
      LEFT JOIN project_timeline_events po_wait_end ON po_wait_end.project_id = p.id AND po_wait_end.event_key = 'PO_DITERIMA'
      LEFT JOIN project_timeline_events exec_start ON exec_start.project_id = p.id AND exec_start.event_key = 'PELAKSANAAN'
      LEFT JOIN project_timeline_events exec_end ON exec_end.project_id = p.id AND exec_end.event_key = 'BAST'
      WHERE p.deleted_at IS NULL`,
      ...Object.values(this.buildWhereParams(filters)),
    );

    const r = rows[0] || {};
    return {
      averageLeadTimeDays: this.num(r.avg_lead_days),
      medianLeadTimeDays: this.num(r.median_lead_days),
      fastestProjectDays: this.num(r.fastest_days),
      fastestProjectName: null,
      slowestProjectDays: this.num(r.slowest_days),
      slowestProjectName: null,
      projectsOverSla: 0,
      projectsOverSlaPercent: 0,
      approvalCycleTimeDays: this.num(r.approval_cycle_days),
      poWaitingTimeDays: this.num(r.po_waiting_days),
      executionCycleTimeDays: this.num(r.execution_cycle_days),
      totalProjects: this.num(r.total_projects),
      completedProjects: this.num(r.completed_projects),
      activeProjects: this.num(r.active_projects),
    };
  }

  async getLeadTime(filters: AnalyticsFilter): Promise<LeadTimeDto[]> {
    const whereClauses = this.buildWhereClauses(filters);
    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        TO_CHAR(date_trunc('month', start.occurred_at), 'YYYY-MM') AS month,
        AVG(EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400) AS avg_days,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400) AS med_days,
        MIN(EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400) AS min_days,
        MAX(EXTRACT(EPOCH FROM (complete.occurred_at - start.occurred_at))/86400) AS max_days,
        COUNT(*) AS cnt
      FROM project_timeline_events start
      JOIN project_timeline_events complete ON complete.project_id = start.project_id AND complete.event_key = 'SELESAI'
      JOIN projects p ON p.id = start.project_id
      WHERE start.event_key = 'CREATED'
        AND complete.event_key = 'SELESAI'
      GROUP BY date_trunc('month', start.occurred_at)
      ORDER BY month`,
    );

    return rows.map((r) => ({
      month: r.month,
      averageDays: this.num(r.avg_days),
      medianDays: this.num(r.med_days),
      minDays: this.num(r.min_days),
      maxDays: this.num(r.max_days),
      projectCount: Number(r.cnt) || 0,
    }));
  }

  async getStageDuration(filters: AnalyticsFilter): Promise<StageDurationDto[]> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        pte.event_key,
        AVG(pte.duration_minutes/1440.0) AS avg_days,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pte.duration_minutes/1440.0) AS med_days,
        MIN(pte.duration_minutes/1440.0) AS min_days,
        MAX(pte.duration_minutes/1440.0) AS max_days,
        COUNT(*) AS cnt
      FROM project_timeline_events pte
      JOIN projects p ON p.id = pte.project_id
      WHERE pte.duration_minutes IS NOT NULL
        AND p.deleted_at IS NULL
      GROUP BY pte.event_key
      ORDER BY avg_days DESC`,
    );

    return rows.map((r) => ({
      stageKey: r.event_key,
      stageLabel: EVENT_KEY_LABEL[r.event_key] || r.event_key,
      averageDays: this.num(r.avg_days),
      medianDays: this.num(r.med_days),
      minDays: this.num(r.min_days),
      maxDays: this.num(r.max_days),
      projectCount: Number(r.cnt) || 0,
    }));
  }

  async getBottlenecks(filters: AnalyticsFilter): Promise<BottleneckDto[]> {
    const threshold = parseInt(filters.threshold || String(DEFAULT_BOTTLENECK_THRESHOLD_DAYS), 10);

    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        current.event_key,
        COUNT(*) AS stuck_count,
        AVG(EXTRACT(EPOCH FROM (next.occurred_at - current.occurred_at))/86400) AS avg_days,
        MAX(EXTRACT(EPOCH FROM (next.occurred_at - current.occurred_at))/86400) AS max_days,
        JSON_AGG(JSON_BUILD_OBJECT('id', p.id, 'name', p.name, 'daysStuck',
          ROUND(EXTRACT(EPOCH FROM (next.occurred_at - current.occurred_at))/86400::numeric, 1)))
        AS project_list
      FROM project_timeline_events current
      JOIN project_timeline_events next ON next.project_id = current.project_id AND next.occurred_at > current.occurred_at
      JOIN projects p ON p.id = current.project_id
      WHERE NOT EXISTS (
        SELECT 1 FROM project_timeline_events mid
        WHERE mid.project_id = current.project_id
          AND mid.occurred_at > current.occurred_at
          AND mid.occurred_at < next.occurred_at
      )
        AND EXTRACT(EPOCH FROM (next.occurred_at - current.occurred_at))/86400 > $1
        AND p.deleted_at IS NULL
      GROUP BY current.event_key
      ORDER BY avg_days DESC`,
      threshold,
    );

    return rows.map((r) => ({
      stageKey: r.event_key,
      stageLabel: EVENT_KEY_LABEL[r.event_key] || r.event_key,
      stuckCount: Number(r.stuck_count) || 0,
      avgDaysStuck: this.num(r.avg_days),
      maxDaysStuck: this.num(r.max_days),
      projects: (r.project_list || []).slice(0, 10),
    }));
  }

  async getThroughput(filters: AnalyticsFilter): Promise<Array<{ month: string; count: number }>> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        TO_CHAR(date_trunc('month', pte.occurred_at), 'YYYY-MM') AS month,
        COUNT(*) AS cnt
      FROM project_timeline_events pte
      JOIN projects p ON p.id = pte.project_id
      WHERE pte.event_key = 'SELESAI'
        AND p.deleted_at IS NULL
      GROUP BY date_trunc('month', pte.occurred_at)
      ORDER BY month`,
    );

    return rows.map((r) => ({ month: r.month, count: Number(r.cnt) || 0 }));
  }

  async getHeatmap(filters: AnalyticsFilter): Promise<HeatmapCellDto[]> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        pte.event_key,
        TO_CHAR(date_trunc('month', pte.occurred_at), 'YYYY-MM') AS month,
        COUNT(*) AS cnt,
        COUNT(DISTINCT pte.project_id) AS proj_cnt
      FROM project_timeline_events pte
      JOIN projects p ON p.id = pte.project_id
      WHERE pte.event_key NOT IN ('CREATED','SELESAI','DITUNDA','DIBATALKAN')
        AND p.deleted_at IS NULL
      GROUP BY pte.event_key, date_trunc('month', pte.occurred_at)
      ORDER BY pte.event_key, month`,
    );

    return rows.map((r) => ({
      stageKey: r.event_key,
      stageLabel: EVENT_KEY_LABEL[r.event_key] || r.event_key,
      period: r.month,
      count: Number(r.cnt) || 0,
      projectCount: Number(r.proj_cnt) || 0,
    }));
  }

  async getStatusDistribution(filters: AnalyticsFilter): Promise<Array<{ status: string; count: number }>> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT status, COUNT(*) AS cnt
       FROM projects
       WHERE deleted_at IS NULL
       GROUP BY status
       ORDER BY cnt DESC`,
    );
    return rows.map((r) => ({ status: r.status, count: Number(r.cnt) || 0 }));
  }

  async getProjectTimeline(projectId: string): Promise<ProjectTimelineAnalyticsDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, code: true, status: true },
    });
    if (!project) throw new Error('Project not found');

    const events = await this.prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT
        id, event_key, event_label, previous_status, next_status,
        actor, actor_user_id, occurred_at, duration_minutes, type
      FROM project_timeline_events
      WHERE project_id = $1
      ORDER BY occurred_at ASC`,
      projectId,
    );

    const transitions: TransitionDurationDto[] = [];
    let totalDurationMinutes = 0;

    for (let i = 0; i < events.length; i++) {
      const curr = events[i];
      const next = events[i + 1];

      let durationMinutes: number | null = null;
      let slaExcessDays = 0;
      let isOverSla = false;

      if (next?.occurred_at && curr?.occurred_at) {
        durationMinutes = (new Date(next.occurred_at).getTime() - new Date(curr.occurred_at).getTime()) / 60000;
        const slaDays = DEFAULT_SLA_DAYS[curr.event_key] || null;
        const durationDays = durationMinutes / 1440;
        if (slaDays && durationDays > slaDays) {
          isOverSla = true;
          slaExcessDays = Math.round((durationDays - slaDays) * 10) / 10;
        }
        totalDurationMinutes += durationMinutes;
      }

      transitions.push({
        eventKey: curr.event_key || '',
        eventLabel: curr.event_label || EVENT_KEY_LABEL[curr.event_key] || curr.event_key,
        startedAt: curr.occurred_at ? new Date(curr.occurred_at).toISOString() : '',
        endedAt: next?.occurred_at ? new Date(next.occurred_at).toISOString() : null,
        durationMinutes: durationMinutes ? Math.round(durationMinutes) : null,
        durationHours: durationMinutes ? Math.round(durationMinutes / 60 * 10) / 10 : null,
        durationDays: durationMinutes ? Math.round(durationMinutes / 1440 * 10) / 10 : null,
        isOverSla,
        slaDays: DEFAULT_SLA_DAYS[curr.event_key] || null,
        slaExcessDays,
        actorName: curr.actor || '',
      });
    }

    const slaExceededStages = transitions.filter((t) => t.isOverSla).map((t) => t.eventKey);

    return {
      projectId: project.id,
      projectName: project.name,
      projectCode: project.code,
      currentStatus: project.status,
      totalDurationDays: totalDurationMinutes ? Math.round(totalDurationMinutes / 1440 * 10) / 10 : null,
      transitions,
      activeStage: events.length > 0 ? events[events.length - 1].event_key || null : null,
      slaExceededStages,
    };
  }

  private buildWhereParams(filters: AnalyticsFilter): Record<string, any> {
    const params: Record<string, any> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.branch) params.branch = filters.branch;
    if (filters.ownerUserId) params.ownerUserId = filters.ownerUserId;
    if (filters.status) params.status = filters.status;
    return params;
  }

  private num(val: any): number {
    if (val === null || val === undefined) return 0;
    return typeof val === 'number' ? Math.round(val * 10) / 10 : Number(val) || 0;
  }
}
