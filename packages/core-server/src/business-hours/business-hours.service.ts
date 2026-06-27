import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BusinessHoursService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    return this.prisma.businessHour.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async upsert(
    tenantId: string,
    dayOfWeek: number,
    data: { openTime?: string | null; closeTime?: string | null; isOpen?: boolean },
  ) {
    return this.prisma.businessHour.upsert({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
      update: data,
      create: { tenantId, dayOfWeek, ...data },
    });
  }

  async batchUpsert(
    tenantId: string,
    hours: { dayOfWeek: number; openTime?: string | null; closeTime?: string | null; isOpen?: boolean }[],
  ) {
    const results = [];
    for (const h of hours) {
      results.push(await this.upsert(tenantId, h.dayOfWeek, h));
    }
    return results;
  }
}
