import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RksService } from './rks.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/rks')
export class RksController {
  constructor(private readonly service: RksService) {}

  @Get()
  getByProject(@Param('projectId') projectId: string) {
    return this.service.getByProject(projectId);
  }

  @Post()
  save(@Param('projectId') projectId: string, @Body() data: any) {
    return this.service.save(projectId, data);
  }

  @Post('submit')
  submit(@Param('projectId') projectId: string) {
    return this.service.submit(projectId);
  }

  @Post('review')
  review(@Param('projectId') projectId: string, @Body() action: { action: 'approve' | 'revision'; notes?: string }) {
    return this.service.review(projectId, action);
  }
}
