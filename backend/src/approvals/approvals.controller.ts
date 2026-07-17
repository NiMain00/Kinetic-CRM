import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApprovalsService } from './approvals.service';

@UseGuards(AuthGuard('jwt'))
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly service: ApprovalsService) {}

  @Get()
  list(@Query() params: { type?: string; status?: string; page?: number; perPage?: number }) {
    return this.service.list(params);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: { notes?: string }, @Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.approve(id, userId, body.notes);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: { notes?: string }, @Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.reject(id, userId, body.notes);
  }

  @Post(':id/review')
  addReview(@Param('id') id: string, @Body() body: { reviewNotes: string; status: 'approved' | 'revision' }) {
    return this.service.addReview(id, body);
  }
}
