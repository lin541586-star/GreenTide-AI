import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalBookings, monthBookings, totalCustomers, totalRevenue] = await Promise.all([
      this.prisma.booking.count({ where: { tenantId, status: { not: 'cancelled' } } }),
      this.prisma.booking.count({ where: { tenantId, createdAt: { gte: monthStart, lte: monthEnd }, status: { not: 'cancelled' } } }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.booking.count({ where: { tenantId, status: 'completed' } }),
    ]);

    return {
      totalBookings,
      monthBookings,
      totalCustomers,
      totalRevenue,
      staffCount: await this.prisma.staff.count({ where: { tenantId, active: true } }),
      serviceCount: await this.prisma.service.count({ where: { tenantId, active: true } }),
      productCount: await this.prisma.product.count({ where: { tenantId, active: true } }),
      lowStockCount: await this.prisma.product.count({ where: { tenantId, active: true, quantity: { lte: 5 } } }),
    };
  }

  async getRevenueStats(tenantId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { tenantId, status: 'completed' },
      include: { service: true },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const byDate: Record<string, number> = {};
    for (const b of bookings) {
      if (!byDate[b.date]) byDate[b.date] = 0;
      byDate[b.date] += b.service?.price || 0;
    }

    return Object.entries(byDate).map(([date, revenue]) => ({ date, revenue }));
  }

  async getServiceRanking(tenantId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { tenantId, serviceId: { not: null }, status: { not: 'cancelled' } },
      include: { service: true },
    });

    const ranking: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const b of bookings) {
      if (!b.service) continue;
      if (!ranking[b.serviceId!]) ranking[b.serviceId!] = { name: b.service.name, count: 0, revenue: 0 };
      ranking[b.serviceId!].count++;
      ranking[b.serviceId!].revenue += b.service.price || 0;
    }

    return Object.entries(ranking)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);
  }

  async getStaffPerformance(tenantId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { tenantId, status: { not: 'cancelled' } },
      include: { staff: true, service: true },
    });

    const perf: Record<string, { name: string; bookings: number; revenue: number }> = {};
    for (const b of bookings) {
      if (!perf[b.staffId]) perf[b.staffId] = { name: b.staff.name, bookings: 0, revenue: 0 };
      perf[b.staffId].bookings++;
      perf[b.staffId].revenue += b.service?.price || 0;
    }

    return Object.entries(perf)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.bookings - a.bookings);
  }
}
