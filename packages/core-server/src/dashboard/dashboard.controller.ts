import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    return this.service.getStats(user.tenantId);
  }
}
