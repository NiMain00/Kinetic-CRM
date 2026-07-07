import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  getStats(@Req() req: any) {
    return this.service.getStats(req.user.id);
  }

  @Get('trend-win-loss')
  getWinLossTrend() {
    return this.service.getWinLossTrend();
  }

  @Get('status-distribution')
  getStatusDistribution() {
    return this.service.getStatusDistribution();
  }

  @Get('critical-deadlines')
  getCriticalDeadlines() {
    return this.service.getCriticalDeadlines();
  }

  @Get('approval-pending')
  getApprovalPending(@Query('limit') limit?: string) {
    return this.service.getApprovalPending(limit ? parseInt(limit, 10) : undefined);
  }
}
