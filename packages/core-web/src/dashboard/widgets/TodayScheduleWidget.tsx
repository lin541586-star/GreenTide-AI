import { Card, Text, Title, Badge } from '@tremor/react';
import { WidgetProps } from '../types';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface BookingData {
  id: string;
  customerName: string;
  staffName: string;
  serviceName?: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface ScheduleConfig {
  bookings?: BookingData[];
}

export function TodayScheduleWidget({ config }: WidgetProps) {
  const scheduleConfig: ScheduleConfig = config || {};
  const bookings = scheduleConfig?.bookings || [];

  const today = format(new Date(), 'M月d日 (EEE)', { locale: zhTW });

  return (
    <Card className="rounded-2xl shadow-apple">
      <Title className="text-sm font-semibold text-[#1d1d1f]">今日預約</Title>
      <Text className="text-xs text-[#8a8885]">{today}</Text>

      <div className="mt-3 space-y-2">
        {bookings.length === 0 ? (
          <div className="py-6 text-center">
            <Text className="text-xs text-[#aeaeb2]">尚無預約</Text>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between py-2 border-b border-[#f0efeb] last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1d1d1f] truncate">
                    {booking.customerName}
                  </span>
                  <Badge size="xs" color={booking.status === 'confirmed' ? 'emerald' : 'gray'}>
                    {booking.status === 'confirmed' ? '已確認' : booking.status}
                  </Badge>
                </div>
                <Text className="text-xs text-[#8a8885]">
                  {booking.startTime} - {booking.endTime}
                  {booking.staffName && ` · ${booking.staffName}`}
                  {booking.serviceName && ` · ${booking.serviceName}`}
                </Text>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
