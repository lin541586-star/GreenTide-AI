import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }
    return this.prisma.customer.findMany({ where, orderBy: { updatedAt: 'desc' } });
  }

  async getById(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('客戶不存在');
    return customer;
  }

  async create(tenantId: string, data: { name: string; phone?: string; email?: string; notes?: string; tags?: string[] }) {
    return this.prisma.customer.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        tags: JSON.stringify(data.tags || []),
      },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; phone?: string; email?: string; notes?: string; tags?: string[] }) {
    await this.getById(tenantId, id);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    return this.prisma.customer.update({ where: { id }, data: updateData });
  }

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
