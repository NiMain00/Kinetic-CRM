import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import type { AnalyticsFilter } from './dto/analytics.dto';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('analytics/dashboard')
  getDashboard(@Query() filters: AnalyticsFilter) {
    return this.service.getDashboardAnalytics(filters);
  }

  @Get('analytics/lead-time')
  getLeadTime(@Query() filters: AnalyticsFilter) {
    return this.service.getLeadTime(filters);
  }

  @Get('analytics/stage-duration')
  getStageDuration(@Query() filters: AnalyticsFilter) {
    return this.service.getStageDuration(filters);
  }

  @Get('analytics/bottlenecks')
  getBottlenecks(@Query() filters: AnalyticsFilter) {
    return this.service.getBottlenecks(filters);
  }

  @Get('analytics/throughput')
  getThroughput(@Query() filters: AnalyticsFilter) {
    return this.service.getThroughput(filters);
  }

  @Get('analytics/heatmap')
  getHeatmap(@Query() filters: AnalyticsFilter) {
    return this.service.getHeatmap(filters);
  }

  @Get('projects/:id/timeline-analytics')
  getProjectTimeline(@Param('id') id: string) {
    return this.service.getProjectTimeline(id);
  }
}
