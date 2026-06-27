import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryAlertService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InventoryAlertService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  // 記錄上次通知過的產品，避免重複發送
  private notifiedProducts = new Set<string>();

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => this.checkLowStock(), 300_000); // 每 5 分鐘
    this.logger.log('庫存警示已啟動（每 5 分鐘檢查）');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async checkLowStock() {
    try {
      // 依租戶分別檢查低庫存商品
      const tenants = await this.prisma.tenant.findMany({ select: { id: true } });

      for (const tenant of tenants) {
        const products = await this.prisma.product.findMany({
          where: { tenantId: tenant.id, active: true },
        });

        const lowStockProducts = products.filter(p => p.quantity <= p.minStock);

        for (const product of lowStockProducts) {
          const key = `${product.tenantId}-${product.id}`;

          // 已經通知過的跳過（避免每5分鐘洗版）
          if (this.notifiedProducts.has(key)) continue;
          this.notifiedProducts.add(key);

          // 檢查是否有庫存警示模板
          const templates = await this.prisma.notificationTemplate.findMany({
            where: { tenantId: product.tenantId, active: true },
          });

          const alertTemplates = templates.filter(t => {
            const triggers = JSON.parse(t.triggers || '[]');
            return triggers.includes('low_stock');
          });

          if (alertTemplates.length > 0) {
            for (const tpl of alertTemplates) {
              let content = tpl.content
                .replace(/\{\{product\}\}/g, product.name)
                .replace(/\{\{quantity\}\}/g, String(product.quantity))
                .replace(/\{\{minStock\}\}/g, String(product.minStock));

              await this.prisma.notificationLog.create({
                data: {
                  tenantId: product.tenantId,
                  templateId: tpl.id,
                  recipient: '管理員',
                  channel: tpl.channel,
                  subject: tpl.subject || null,
                  content,
                  status: 'sent',
                  sentAt: new Date(),
                },
              });
            }
          } else {
            // 沒有模板就直接發送預設通知
            await this.prisma.notificationLog.create({
              data: {
                tenantId: product.tenantId,
                recipient: '管理員',
                channel: 'line',
                content: `⚠️ 庫存警示：「${product.name}」庫存僅剩 ${product.quantity}，已低於警戒線 ${product.minStock}，請盡快補貨！`,
                status: 'sent',
                sentAt: new Date(),
              },
            });
          }

          this.logger.log(`低庫存通知：${product.name}（庫存 ${product.quantity}/${product.minStock}）`);
        }

        // 清理已恢復庫存的產品（此租戶）
        const activeKeys = new Set(lowStockProducts.map(p => `${p.tenantId}-${p.id}`));
        for (const key of this.notifiedProducts) {
          if (!activeKeys.has(key)) this.notifiedProducts.delete(key);
        }
      }
    } catch (err: any) {
      this.logger.error(`庫存警示檢查失敗: ${err.message}`);
    }
  }
}
