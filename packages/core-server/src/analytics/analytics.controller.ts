import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '@prisma/client';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private svc: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: User) {
    return this.svc.getDashboardStats(user.tenantId);
  }

  @Get('revenue')
  getRevenue(@CurrentUser() user: User) {
    return this.svc.getRevenueStats(user.tenantId);
  }

  @Get('services')
  getServiceRanking(@CurrentUser() user: User) {
    return this.svc.getServiceRanking(user.tenantId);
  }

  @Get('staff')
  getStaffPerformance(@CurrentUser() user: User) {
    return this.svc.getStaffPerformance(user.tenantId);
  }
}
