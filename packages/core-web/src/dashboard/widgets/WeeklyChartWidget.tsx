import { Card, Text, Title, Flex, Metric, Badge } from '@tremor/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WidgetProps } from '../types';

interface WeeklyConfig {
  data?: { date: string; count: number }[];
  total?: number;
}

export function WeeklyChartWidget({ config }: WidgetProps) {
  const weeklyConfig: WeeklyConfig = config || {};
  const data = weeklyConfig?.data?.length
    ? weeklyConfig.data
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          count: 0,
        };
      });
  const total = weeklyConfig?.total ?? data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="rounded-2xl shadow-apple">
      <Flex alignItems="start" justifyContent="between">
        <div>
          <Title className="text-sm font-semibold text-[#1d1d1f]">本週預約</Title>
          <Text className="text-xs text-[#8a8885]">近 7 日預約數量</Text>
        </div>
        <Metric className="text-lg font-semibold text-[#1d1d1f]">{total}</Metric>
      </Flex>
      <div className="mt-4" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0efeb" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#aeaeb2' }}
              axisLine={{ stroke: '#f0efeb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#aeaeb2' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #f0efeb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="count"
              fill="#1d1d1f"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
