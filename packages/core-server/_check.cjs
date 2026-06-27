const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const r = await p.aiRule.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log('規則數量:', r.length);
  r.forEach((x, i) => console.log((i + 1) + '. ' + (x.rule || '').substring(0, 50)));
  await p.$disconnect();
})();
