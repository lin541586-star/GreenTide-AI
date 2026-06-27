import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PluginDiscoveryService implements OnModuleInit {
  private plugins: any[] = [];

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.loadAllPlugins();
  }

  loadAllPlugins() {
    const pluginsDir = path.resolve(__dirname, '../../../../packages/plugins');
    if (!fs.existsSync(pluginsDir)) {
      console.log('⚠️ Plugin 目錄不存在，跳過載入');
      return;
    }

    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(pluginsDir, entry.name, 'manifest.json');
      if (!fs.existsSync(manifestPath)) continue;

      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        this.plugins.push(manifest);
        console.log(`  ✓ 已載入 Plugin: ${manifest.name} (${manifest.id})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠️ Plugin ${entry.name} 載入失敗:`, msg);
      }
    }
    console.log(`  共載入 ${this.plugins.length} 個 Plugin`);
  }

  getPlugins() {
    return this.plugins;
  }

  getPlugin(id: string) {
    return this.plugins.find((p) => p.id === id);
  }
}
