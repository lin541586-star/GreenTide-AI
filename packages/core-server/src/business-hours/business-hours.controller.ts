import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BusinessHoursService } from './business-hours.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { RequirePermission } from '../common/permission.decorator';
import { PermissionGuard } from '../common/permission.guard';
import { PERMISSIONS } from '../roles/permission.constant';

@Controller('business-hours')
@UseGuards(JwtAuthGuard)
export class BusinessHoursController {
  constructor(private readonly service: BusinessHoursService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.service.findByTenant(user.tenantId);
  }

  @Put()
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.BUSINESS_HOURS.EDIT)
  async update(
    @CurrentUser() user: any,
    @Body() body: { hours: { dayOfWeek: number; openTime?: string; closeTime?: string; isOpen?: boolean }[] },
  ) {
    return this.service.batchUpsert(user.tenantId, body.hours);
  }
}
