import { useState, useEffect } from 'react';
import { DashboardStats } from './types';
import client from '../api/client';

const EMPTY_STATS: DashboardStats = {
  todayBookings: 0,
  totalStaff: 0,
  activeServices: 0,
  monthlyRevenue: 0,
  weeklyBookings: [],
  revenueByDay: [],
  recentBookings: [],
  todayBookingsByHour: [],
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await client.get('/dashboard/stats').then((r) => r.data);
        if (!cancelled) {
          setStats(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          // 如果 API 還不存在，使用本地計算的簡易資料
          setError(err.response?.status === 404 ? null : '無法載入儀表板資料');
          // 嘗試從現有 API 取得基本資料
          try {
            const [bookings, staff, services] = await Promise.all([
              client.get('/bookings/by-date', { params: { date: new Date().toISOString().slice(0, 10) } }).then(r => r.data),
              client.get('/staff').then(r => r.data),
              client.get('/services').then(r => r.data),
            ]);
            if (!cancelled) {
              setStats({
                todayBookings: bookings?.length || 0,
                totalStaff: staff?.length || 0,
                activeServices: services?.length || 0,
                monthlyRevenue: 0,
                weeklyBookings: [],
                revenueByDay: [],
                recentBookings: (bookings || []).slice(0, 5).map((b: any) => ({
                  id: b.id,
                  customerName: b.customerName,
                  staffName: b.staff?.name || '',
                  serviceName: b.service?.name,
                  startTime: b.startTime,
                  endTime: b.endTime,
                  status: b.status,
                })),
                todayBookingsByHour: [],
              });
            }
          } catch {
            if (!cancelled) setError('無法載入儀表板資料');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}
