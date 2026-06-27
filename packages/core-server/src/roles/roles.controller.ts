import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { RequirePermission } from '../common/permission.decorator';
import { PermissionGuard } from '../common/permission.guard';
import { PERMISSIONS, PERMISSION_LIST } from './permission.constant';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get('permissions')
  getPermissionList() {
    return PERMISSION_LIST;
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.USERS.PERMISSIONS)
  async create(
    @CurrentUser() user: any,
    @Body() body: { name: string; level: number; permissions: string[] },
  ) {
    return this.service.create(user.tenantId, body);
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.USERS.PERMISSIONS)
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; level?: number; permissions?: string[] },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.USERS.PERMISSIONS)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
