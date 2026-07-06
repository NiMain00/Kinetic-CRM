import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
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
