import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PluginDiscoveryService } from './plugin-discovery.service';

@Injectable()
export class PluginAdminService {
  constructor(
    private prisma: PrismaService,
    private pluginDiscovery: PluginDiscoveryService,
  ) {}

  async getPluginsWithStatus(tenantId: string) {
    const manifests = this.pluginDiscovery.getPlugins();
    const registries = await this.prisma.pluginRegistry.findMany({
      where: { tenantId },
    });

    return manifests.map((manifest) => {
      const registry = registries.find((r) => r.pluginId === manifest.id);
      return {
        ...manifest,
        enabled: registry?.enabled ?? false,
        registryId: registry?.id ?? null,
      };
    });
  }

  async togglePlugin(tenantId: string, pluginId: string, enabled: boolean) {
    const existing = await this.prisma.pluginRegistry.upsert({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      update: { enabled },
      create: { tenantId, pluginId, enabled, config: '{}' },
    });
    return existing;
  }
}
