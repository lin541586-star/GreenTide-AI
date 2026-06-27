import { Card, Text, Title } from '@tremor/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WidgetProps } from '../types';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

interface RevenueConfig {
  data?: { date: string; revenue: number }[];
}

export function RevenueChartWidget({ config }: WidgetProps) {
  const revenueConfig: RevenueConfig = config || {};
  const data = revenueConfig?.data?.length
    ? revenueConfig.data
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          revenue: 0,
        };
      });

  return (
    <Card className="rounded-2xl shadow-apple">
      <Title className="text-sm font-semibold text-[#1d1d1f]">營收趨勢</Title>
      <Text className="text-xs text-[#8a8885]">近 7 日營業額</Text>
      <div className="mt-4" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d1d1f" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#1d1d1f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0efeb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#aeaeb2' }}
              axisLine={{ stroke: '#f0efeb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#aeaeb2' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #f0efeb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: 12,
              }}
              formatter={(val: any) => [`$${val}`, '營收']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#1d1d1f"
              strokeWidth={2}
              fill="url(#revenue-gradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
