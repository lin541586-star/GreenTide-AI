import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    // 平行查詢
    const [
      todayBookings,
      totalStaff,
      activeServices,
      monthBookings,
      allBookings,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          tenantId,
          date: todayStr,
          status: { notIn: ['cancelled'] },
        },
        include: { staff: true, service: true },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.staff.count({
        where: { tenantId, active: true },
      }),
      this.prisma.service.count({
        where: { tenantId, active: true },
      }),
      this.prisma.booking.findMany({
        where: {
          tenantId,
          date: { gte: monthStart, lte: todayStr },
          status: { notIn: ['cancelled'] },
        },
        include: { service: true },
      }),
      this.prisma.booking.findMany({
        where: {
          tenantId,
          status: { notIn: ['cancelled'] },
        },
        orderBy: { date: 'desc' },
        take: 100,
        include: { staff: true, service: true },
      }),
    ]);

    // 本月營收
    const monthlyRevenue = monthBookings.reduce((sum, b) => {
      return sum + (b.service as any)?.price || 0;
    }, 0);

    // 最近 7 日每日預約數
    const weeklyBookings: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const count = allBookings.filter(
        (b) => b.date === ds,
      ).length;
      weeklyBookings.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count,
      });
    }

    // 最近 7 日每日營收
    const revenueByDay: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const revenue = allBookings
        .filter((b) => b.date === ds)
        .reduce((sum, b) => sum + ((b.service as any)?.price || 0), 0);
      revenueByDay.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue,
      });
    }

    return {
      todayBookings: todayBookings.length,
      totalStaff,
      activeServices,
      monthlyRevenue,
      weeklyBookings,
      revenueByDay,
      recentBookings: todayBookings.slice(0, 10).map((b) => ({
        id: b.id,
        customerName: b.customerName,
        staffName: (b.staff as any)?.name || '',
        serviceName: (b.service as any)?.name || null,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      })),
      todayBookingsByHour: [],
    };
  }
}
