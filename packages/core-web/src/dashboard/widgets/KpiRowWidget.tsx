import { KpiCard } from '../../components/ui/kpi-card';
import { WidgetProps } from '../types';

interface KpiRowData {
  value: string | number;
  title: string;
  subtitle?: string;
  delta?: string;
  deltaType?: 'moderateIncrease' | 'moderateDecrease' | 'increase' | 'decrease' | 'unchanged';
}

interface KpiRowConfig {
  items: KpiRowData[];
}

const DEFAULT_KPIS: KpiRowData[] = [
  { title: '今日預約', value: '—', subtitle: '載入中…' },
  { title: '服務人員', value: '—', subtitle: '載入中…' },
  { title: '服務項目', value: '—', subtitle: '載入中…' },
  { title: '本月營收', value: '—', subtitle: '載入中…', deltaType: 'moderateIncrease' },
];

export function KpiRowWidget({ config }: WidgetProps) {
  const kpiConfig: KpiRowConfig = config as KpiRowConfig;
  const items = kpiConfig?.items || DEFAULT_KPIS;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((kpi) => (
        <KpiCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          subtitle={kpi.subtitle}
          delta={kpi.delta}
          deltaType={kpi.deltaType}
        />
      ))}
    </div>
  );
}
