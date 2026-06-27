import { Card, Text, Metric, Flex, BadgeDelta, DeltaType } from '@tremor/react';

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaType?: DeltaType;
  subtitle?: string;
}

export function KpiCard({ title, value, delta, deltaType = 'moderateIncrease', subtitle }: KpiCardProps) {
  return (
    <Card className="rounded-2xl shadow-apple">
      <Flex alignItems="start">
        <div className="truncate">
          <Text className="text-xs text-[#8a8885]">{title}</Text>
          <Metric className="text-2xl font-semibold text-[#1d1d1f] mt-1">{value}</Metric>
        </div>
        {delta && (
          <BadgeDelta deltaType={deltaType} className="text-[10px]">
            {delta}
          </BadgeDelta>
        )}
      </Flex>
      {subtitle && (
        <Text className="text-[10px] text-[#aeaeb2] mt-2">{subtitle}</Text>
      )}
    </Card>
  );
}
