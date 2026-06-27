import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PluginAdminService } from './plugin-admin.service';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('plugins/admin')
@UseGuards(AuthGuard('jwt'))
export class PluginAdminController {
  constructor(private pluginAdminService: PluginAdminService) {}

  @Get()
  getPlugins(@CurrentUser() user: User) {
    return this.pluginAdminService.getPluginsWithStatus(user.tenantId);
  }

  @Post(':pluginId/enable')
  enable(@CurrentUser() user: User, @Param('pluginId') pluginId: string) {
    return this.pluginAdminService.togglePlugin(user.tenantId, pluginId, true);
  }

  @Post(':pluginId/disable')
  disable(@CurrentUser() user: User, @Param('pluginId') pluginId: string) {
    return this.pluginAdminService.togglePlugin(user.tenantId, pluginId, false);
  }
}
