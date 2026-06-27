import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  // 取得某店家所有預約（可篩選日期範圍）
  async findAll(tenantId: string, date?: string, staffId?: string) {
    return this.prisma.booking.findMany({
      where: {
        tenantId,
        ...(date && { date }),
        ...(staffId && { staffId }),
      },
      include: { staff: true, service: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  // 取得某店家某日的所有預約（日曆用）
  async findByDate(tenantId: string, date: string) {
    return this.prisma.booking.findMany({
      where: { tenantId, date, status: { notIn: ['cancelled'] } },
      include: { staff: true, service: true },
      orderBy: { startTime: 'asc' },
    });
  }

  // 檢查時段是否已被預約
  async checkSlot(staffId: string, date: string, startTime: string, endTime: string): Promise<boolean> {
    const existing = await this.prisma.booking.findFirst({
      where: {
        staffId,
        date,
        status: { notIn: ['cancelled'] },
        OR: [
          // 新預約開始時間落在已有預約區間內
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });
    return !existing; // true = 時段可用
  }

  // 建立預約（含時段衝突檢查 + 自動建立客戶）
  async create(data: {
    tenantId: string;
    staffId: string;
    serviceId?: string;
    customerName: string;
    customerContact?: string;
    source?: string;
    date: string;
    startTime: string;
    endTime: string;
    note?: string;
  }) {
    // 檢查衝突
    const available = await this.checkSlot(data.staffId, data.date, data.startTime, data.endTime);
    if (!available) {
      throw new ConflictException('此時段已被預約，請選擇其他時間');
    }

    const booking = await this.prisma.booking.create({
      data: {
        tenantId: data.tenantId,
        staffId: data.staffId,
        serviceId: data.serviceId,
        customerName: data.customerName,
        customerContact: data.customerContact,
        source: data.source || 'manual',
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        note: data.note,
        status: 'confirmed',
      },
      include: { staff: true, service: true },
    });

    // 🔗 自動發送預約確認通知
    await this.sendBookingNotification(data.tenantId, booking, 'booking_confirmed');

    return booking;
  }

  /** 根據預約觸發自動通知 */
  private async sendBookingNotification(tenantId: string, booking: any, trigger: string) {
    try {
      const templates = await this.prisma.notificationTemplate.findMany({
        where: { tenantId, active: true },
      });

      for (const tpl of templates) {
        const triggers = JSON.parse(tpl.triggers || '[]');
        if (!triggers.includes(trigger)) continue;

        const name = booking.customerName || '顧客';
        const date = booking.date || '';
        const time = `${booking.startTime}~${booking.endTime}`;
        const staffName = (booking.staff as any)?.name || '';
        const serviceName = (booking.service as any)?.name || '';

        let content = tpl.content
          .replace(/\{\{name\}\}/g, name)
          .replace(/\{\{date\}\}/g, date)
          .replace(/\{\{time\}\}/g, time)
          .replace(/\{\{staff\}\}/g, staffName)
          .replace(/\{\{service\}\}/g, serviceName);

        await this.prisma.notificationLog.create({
          data: {
            tenantId,
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
    } catch (err: any) {
      console.error(`自動通知發送失敗: ${err.message}`);
    }
  }

  /** 預約完成後，自動同步到 CRM */
  private async syncCustomerToCrm(tenantId: string, booking: any) {
    try {
      const contact = booking.customerContact || '';
      // 尋找是否已有同名客戶
      const existing = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          name: booking.customerName,
          ...(booking.customerContact ? { phone: booking.customerContact } : {}),
        },
      });

      const servicePrice = (booking.service as any)?.price || 0;

      if (existing) {
        // 更新既有客戶
        await this.prisma.customer.update({
          where: { id: existing.id },
          data: {
            totalVisits: { increment: 1 },
            totalSpent: { increment: servicePrice },
            lastVisitAt: new Date(booking.date + 'T' + booking.startTime),
            phone: contact || existing.phone,
          },
        });
      } else {
        // 建立新客戶
        await this.prisma.customer.create({
          data: {
            tenantId,
            name: booking.customerName,
            phone: contact || null,
            notes: `自動建立（來自預約 #${booking.id}）`,
            tags: JSON.stringify(['新客']),
            totalVisits: 1,
            totalSpent: servicePrice,
            lastVisitAt: new Date(booking.date + 'T' + booking.startTime),
          },
        });
      }
    } catch (err: any) {
      // CRM 同步不影響預約主流程
      console.error(`CRM 同步失敗: ${err.message}`);
    }
  }

  // 更新預約狀態（確認/取消/完成）
  async updateStatus(id: string, status: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { service: true } });
    if (!booking) throw new NotFoundException('預約不存在');

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status },
      include: { staff: true, service: true },
    });

    // 🔗 若完成預約，更新 CRM 消費記錄
    if (status === 'completed') {
      await this.syncCustomerToCrm(booking.tenantId, { ...booking, status: 'completed' });
    }

    return updated;
  }

  // 取消預約
  async cancel(id: string) {
    return this.updateStatus(id, 'cancelled');
  }
}
