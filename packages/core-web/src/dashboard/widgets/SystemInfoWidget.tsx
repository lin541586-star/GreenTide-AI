import { Card, Title, Text, Flex } from '@tremor/react';

export function SystemInfoWidget() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');

  return (
    <Card className="rounded-2xl shadow-apple">
      <Title className="text-sm font-semibold text-[#1d1d1f] mb-3">系統資訊</Title>
      <div className="space-y-3">
        <Flex justifyContent="between" className="pb-2 border-b border-[#f0efeb]">
          <Text className="text-xs text-[#8a8885]">店家名稱</Text>
          <Text className="text-xs font-medium text-[#1d1d1f]">{tenant.name || '未設定'}</Text>
        </Flex>
        <Flex justifyContent="between" className="pb-2 border-b border-[#f0efeb]">
          <Text className="text-xs text-[#8a8885]">行業</Text>
          <Text className="text-xs font-medium text-[#1d1d1f] capitalize">
            {tenant.industry || '未設定'}
          </Text>
        </Flex>
        <Flex justifyContent="between" className="pb-2 border-b border-[#f0efeb]">
          <Text className="text-xs text-[#8a8885]">管理員</Text>
          <Text className="text-xs font-medium text-[#1d1d1f]">{user.name}</Text>
        </Flex>
        <Flex justifyContent="between">
          <Text className="text-xs text-[#8a8885]">方案</Text>
          <Text className="text-xs font-medium text-[#1d1d1f]">免費版</Text>
        </Flex>
      </div>
    </Card>
  );
}
