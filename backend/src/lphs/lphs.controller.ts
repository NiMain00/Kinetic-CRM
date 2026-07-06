import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LphsService } from './lphs.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/lphs')
export class LphsController {
  constructor(private readonly service: LphsService) {}

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

  @Post('review-department')
  reviewDepartment(@Param('projectId') projectId: string, @Body() approval: any) {
    return this.service.reviewDepartment(projectId, approval);
  }

  @Post('review-pm')
  reviewPm(@Param('projectId') projectId: string, @Body() body: { action: 'approve' | 'revision'; notes?: string }) {
    return this.service.reviewPm(projectId, body.action, body.notes);
  }

  @Post('review-mgmt')
  reviewMgmt(@Param('projectId') projectId: string, @Body() body: { action: 'approve' | 'revision'; notes?: string }) {
    return this.service.reviewMgmt(projectId, body.action, body.notes);
  }
}
