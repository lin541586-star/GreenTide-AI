import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BookingReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingReminderService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // 每 2 分鐘檢查一次即將到來的預約
    this.timer = setInterval(() => this.checkReminders(), 120_000);
    this.logger.log('預約提醒已啟動（每 2 分鐘檢查）');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async checkReminders() {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTotalMin = currentHour * 60 + currentMin;

      // 找出今天所有已確認的預約
      const bookings = await this.prisma.booking.findMany({
        where: { date: today, status: 'confirmed' },
        include: { staff: true, service: true },
      });

      for (const booking of bookings) {
        // 計算預約時間（分鐘）
        const [bh, bm] = booking.startTime.split(':').map(Number);
        const bookingTotalMin = bh * 60 + bm;

        // 預約時間在 30~90 分鐘後（即約 1 小時前）
        const diff = bookingTotalMin - currentTotalMin;
        if (diff < 30 || diff > 90) continue;

        // 檢查是否已經發送過提醒
        const alreadySent = await this.prisma.notificationLog.findFirst({
          where: {
            tenantId: booking.tenantId,
            recipient: booking.customerContact || booking.customerName,
            content: { contains: `#reminder-${booking.id}` },
          },
        });

        if (alreadySent) continue;

        // 查詢通知模板
        const templates = await this.prisma.notificationTemplate.findMany({
          where: { tenantId: booking.tenantId, active: true },
        });

        const reminderTemplates = templates.filter(t => {
          const triggers = JSON.parse(t.triggers || '[]');
          return triggers.includes('booking_reminder');
        });

        const name = booking.customerName || '顧客';
        const time = `${booking.startTime}~${booking.endTime}`;
        const staffName = (booking.staff as any)?.name || '';
        const serviceName = (booking.service as any)?.name || '';

        if (reminderTemplates.length > 0) {
          for (const tpl of reminderTemplates) {
            let content = tpl.content
              .replace(/\{\{name\}\}/g, name)
              .replace(/\{\{date\}\}/g, booking.date || '')
              .replace(/\{\{time\}\}/g, time)
              .replace(/\{\{staff\}\}/g, staffName)
              .replace(/\{\{service\}\}/g, serviceName);

            content += `\n\n#reminder-${booking.id}`;

            await this.prisma.notificationLog.create({
              data: {
                tenantId: booking.tenantId,
                templateId: tpl.id,
                recipient: booking.customerContact || name,
                channel: tpl.channel,
                subject: tpl.subject ? tpl.subject.replace(/\{\{name\}\}/g, name) : null,
                content,
                status: 'sent',
                sentAt: new Date(),
              },
            });
          }
        } else {
          // 沒有模板時使用預設內容
          const defaultContent = `🔔 預約提醒\n親愛的 ${name} 您好，您預約的 ${serviceName} 即將在 ${time} 開始，請準時前往。\n\n#reminder-${booking.id}`;

          await this.prisma.notificationLog.create({
            data: {
              tenantId: booking.tenantId,
              recipient: booking.customerContact || name,
              channel: 'line',
              content: defaultContent,
              status: 'sent',
              sentAt: new Date(),
            },
          });
        }

        this.logger.log(`已發送預約提醒給 ${name}（${booking.id}）`);
      }
    } catch (err: any) {
      this.logger.error(`預約提醒檢查失敗: ${err.message}`);
    }
  }
}
