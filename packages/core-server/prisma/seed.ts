import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. 建立預設店家
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant' },
    update: {},
    create: {
      id: 'default-tenant',
      name: '我的店舖',
      industry: 'other',
      plan: 'free',
    },
  });
  console.log(`  ✓ 已建立店家: ${tenant.name} (${tenant.id})`);

  // 2. 建立預設管理員
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: { password: hashedPassword },
    create: {
      tenantId: tenant.id,
      email: 'admin@shop.com',
      password: hashedPassword, // admin123
      name: '管理員',
      role: 'owner',
    },
  });
  console.log(`  ✓ 已建立管理員: ${admin.email}`);
  console.log(`     登入 Email: admin@shop.com`);
  console.log(`     預設密碼: admin123`);

  // 3. 建立範例服務項目
  const services = [
    { name: '基本剪髮', duration: 30, price: 500, color: '#3B82F6' },
    { name: '染髮', duration: 120, price: 2000, color: '#8B5CF6' },
    { name: '全身按摩', duration: 60, price: 1200, color: '#10B981' },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: `default-${svc.name}` },
      update: {},
      create: {
        id: `default-${svc.name}`,
        tenantId: tenant.id,
        ...svc,
      },
    });
  }
  console.log(`  ✓ 已建立 ${services.length} 個服務項目`);

  // 4. 建立範例服務人員（含顏色區別）
  const staffList = [
    { name: '小美', title: '資深設計師', color: '#F59E0B' },
    { name: '阿豪', title: '設計師', color: '#6366F1' },
    { name: '婷婷', title: '助理', color: '#EC4899' },
  ];

  for (const s of staffList) {
    await prisma.staff.upsert({
      where: { id: `default-${s.name}` },
      update: {},
      create: {
        id: `default-${s.name}`,
        tenantId: tenant.id,
        ...s,
      },
    });
  }
  console.log(`  ✓ 已建立 ${staffList.length} 位服務人員（含顏色區別）`);

  // 5. 註冊日曆預約 Plugin
  await prisma.pluginRegistry.upsert({
    where: {
      tenantId_pluginId: { tenantId: tenant.id, pluginId: 'calendar-booking' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      pluginId: 'calendar-booking',
      enabled: true,
      config: '{}',
    },
  });
  console.log('  ✓ 已註冊 Plugin: 日曆預約系統');

  // 6. 建立預設權限角色
  const defaultRoles = [
    {
      name: '管理員',
      level: 10,
      permissions: JSON.stringify(['*']),
      isSystem: true,
    },
    {
      name: '操作員',
      level: 20,
      permissions: JSON.stringify([
        'booking.view', 'booking.create', 'booking.edit',
        'services.view', 'services.create', 'services.edit',
        'staff.view',
        'business-hours.view',
        'plugins.view',
        'reports.view',
      ]),
      isSystem: true,
    },
    {
      name: '使用者',
      level: 30,
      permissions: JSON.stringify([
        'booking.view',
        'services.view',
        'staff.view',
        'business-hours.view',
      ]),
      isSystem: true,
    },
  ];

  for (const role of defaultRoles) {
    await prisma.role.upsert({
      where: {
        tenantId_name: { tenantId: tenant.id, name: role.name },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...role,
      },
    });
  }
  console.log(`  ✓ 已建立 ${defaultRoles.length} 個預設權限角色`);

  // 7. 設定預設營業時間（週一~六 09:00~20:00，週日公休）
  const hours = [
    { dayOfWeek: 0, isOpen: false },  // 日
    { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00', isOpen: true },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00', isOpen: true },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00', isOpen: true },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00', isOpen: true },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '20:00', isOpen: true },
    { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00', isOpen: true }, // 六
  ];

  for (const h of hours) {
    await prisma.businessHour.upsert({
      where: {
        tenantId_dayOfWeek: { tenantId: tenant.id, dayOfWeek: h.dayOfWeek },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...h,
      },
    });
  }
  console.log('  ✓ 已設定預設營業時間');

  // 8. 註冊 Plugin 範本（不啟用）
  await prisma.pluginRegistry.upsert({
    where: {
      tenantId_pluginId: { tenantId: tenant.id, pluginId: 'plugin-template' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      pluginId: 'plugin-template',
      enabled: false,
      config: '{}',
    },
  });
  console.log('  ✓ 已註冊 Plugin: 小工具範本 (未啟用)');

  console.log('\n✅ Seed 完成!');
}

main()
  .catch((e) => {
    console.error('Seed 失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
