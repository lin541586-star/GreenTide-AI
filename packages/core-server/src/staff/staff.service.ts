import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.staff.findMany({
      where: { tenantId, active: true },
      include: { availabilities: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: { availabilities: true, bookings: { take: 10, orderBy: { date: 'desc' } } },
    });
    if (!staff) throw new NotFoundException('服務人員不存在');
    return staff;
  }

  async create(tenantId: string, data: { name: string; title?: string; bio?: string; color?: string }) {
    return this.prisma.staff.create({
      data: { ...data, tenantId },
    });
  }

  async update(id: string, data: { name?: string; title?: string; bio?: string; color?: string; active?: boolean }) {
    await this.findOne(id);
    return this.prisma.staff.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.staff.update({
      where: { id },
      data: { active: false },
    });
  }
}
