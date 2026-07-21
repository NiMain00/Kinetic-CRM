import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { AnalyticsService } from '../analytics/analytics.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly service: ProjectsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  list(@Query() params: any) {
    return this.service.list(params);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const actorInfo = req.user
      ? { userId: req.user.id, fullName: req.user.fullName }
      : undefined;
    return this.service.update(id, data, actorInfo);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get(':id/timeline-analytics')
  getTimelineAnalytics(@Param('id') id: string) {
    return this.analyticsService.getProjectTimeline(id);
  }
}
