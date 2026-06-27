import { Module } from '@nestjs/common';
import { PluginDiscoveryService } from './plugin-discovery.service';
import { PluginAdminController } from './plugin-admin.controller';
import { PluginAdminService } from './plugin-admin.service';

@Module({
  controllers: [PluginAdminController],
  providers: [PluginDiscoveryService, PluginAdminService],
  exports: [PluginDiscoveryService, PluginAdminService],
})
export class PluginLoaderModule {}
