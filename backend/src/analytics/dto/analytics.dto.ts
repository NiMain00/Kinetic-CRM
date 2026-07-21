export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  branch?: string;
  branchId?: string;
  division?: string;
  department?: string;
  departmentId?: string;
  ownerUserId?: string;
  customerId?: string;
  status?: string;
  threshold?: string;
}

export interface TransitionDurationDto {
  eventKey: string;
  eventLabel: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  durationHours: number | null;
  durationDays: number | null;
  isOverSla: boolean;
  slaDays: number | null;
  slaExcessDays: number;
  actorName: string;
}

export interface ProjectTimelineAnalyticsDto {
  projectId: string;
  projectName: string;
  projectCode: string;
  currentStatus: string;
  totalDurationDays: number | null;
  transitions: TransitionDurationDto[];
  activeStage: string | null;
  slaExceededStages: string[];
}

export interface LeadTimeDto {
  month: string;
  averageDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  projectCount: number;
}

export interface StageDurationDto {
  stageKey: string;
  stageLabel: string;
  averageDays: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  projectCount: number;
}

export interface BottleneckDto {
  stageKey: string;
  stageLabel: string;
  stuckCount: number;
  avgDaysStuck: number;
  maxDaysStuck: number;
  projects: Array<{ id: string; name: string; daysStuck: number }>;
}

export interface HeatmapCellDto {
  stageKey: string;
  stageLabel: string;
  period: string;
  count: number;
  projectCount: number;
}

export interface AnalyticsKpiDto {
  averageLeadTimeDays: number;
  medianLeadTimeDays: number;
  fastestProjectDays: number;
  fastestProjectName: string | null;
  slowestProjectDays: number;
  slowestProjectName: string | null;
  projectsOverSla: number;
  projectsOverSlaPercent: number;
  approvalCycleTimeDays: number;
  poWaitingTimeDays: number;
  executionCycleTimeDays: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
}

export interface DashboardAnalyticsDto {
  kpis: AnalyticsKpiDto;
  leadTime: LeadTimeDto[];
  stageDuration: StageDurationDto[];
  bottlenecks: BottleneckDto[];
  throughput: Array<{ month: string; count: number }>;
  heatmap: HeatmapCellDto[];
  statusDistribution: Array<{ status: string; count: number }>;
}
