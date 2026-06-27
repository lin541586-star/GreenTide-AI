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
import { UsersAdminService } from './users-admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { RequirePermission } from '../common/permission.decorator';
import { PermissionGuard } from '../common/permission.guard';
import { PERMISSIONS } from '../roles/permission.constant';

@Controller('users-admin')
@UseGuards(JwtAuthGuard)
export class UsersAdminController {
  constructor(private readonly service: UsersAdminService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.USERS.CREATE)
  async create(
    @CurrentUser() user: any,
    @Body() body: { email: string; password: string; name: string; roleId?: string },
  ) {
    return this.service.create(user.tenantId, body);
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.USERS.EDIT)
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; roleId?: string; active?: boolean; password?: string },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.USERS.DELETE)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
