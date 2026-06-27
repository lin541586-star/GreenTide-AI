import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // ============ Templates ============
  async listTemplates(tenantId: string) {
    return this.prisma.notificationTemplate.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' } });
  }

  async getTemplate(tenantId: string, id: string) {
    const tpl = await this.prisma.notificationTemplate.findFirst({ where: { id, tenantId } });
    if (!tpl) throw new NotFoundException('通知模板不存在');
    return tpl;
  }

  async createTemplate(tenantId: string, data: { name: string; channel: string; subject?: string; content: string; triggers?: string[] }) {
    return this.prisma.notificationTemplate.create({
      data: {
        tenantId,
        name: data.name,
        channel: data.channel || 'line',
        subject: data.subject || null,
        content: data.content,
        triggers: JSON.stringify(data.triggers || []),
      },
    });
  }

  async updateTemplate(tenantId: string, id: string, data: any) {
    await this.getTemplate(tenantId, id);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.triggers !== undefined) updateData.triggers = JSON.stringify(data.triggers);
    if (data.active !== undefined) updateData.active = data.active;
    return this.prisma.notificationTemplate.update({ where: { id }, data: updateData });
  }

  async removeTemplate(tenantId: string, id: string) {
    await this.getTemplate(tenantId, id);
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }

  // ============ Logs ============
  async listLogs(tenantId: string) {
    return this.prisma.notificationLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async send(tenantId: string, data: { templateId?: string; recipient: string; channel: string; subject?: string; content: string }) {
    // 實際發送邏輯（LINE/Email）可後續擴充，目前僅記錄
    const log = await this.prisma.notificationLog.create({
      data: {
        tenantId,
        templateId: data.templateId || null,
        recipient: data.recipient,
        channel: data.channel,
        subject: data.subject || null,
        content: data.content,
        status: 'sent',
        sentAt: new Date(),
      },
    });
    return log;
  }
}
