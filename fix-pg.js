const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';
function run(cmd) {
  try {
    const o = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 30000 });
    if (o.trim()) console.log(o.trim().substring(0, 300));
    return o.trim();
  } catch (e) {
    const m = e.stderr ? e.stderr.toString().trim() : e.message;
    if (m) console.log('>>', m.substring(0, 200));
    return '';
  }
}

const migDir = path.join(cwd, 'packages', 'core-server', 'prisma', 'migrations');
const migDirStat = fs.statSync(migDir);
const entries = fs.readdirSync(migDir);
console.log('migrations 目錄:', entries.length, '個目錄');

// 刪除舊 migration 目錄
for (const entry of entries) {
  const full = path.join(migDir, entry);
  if (fs.statSync(full).isDirectory()) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log('已刪除:', entry);
  }
}

console.log('OK: migrations cleared');

// 修改 start 指令：prisma db push + start
const rootPkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
rootPkg.scripts.start = 'NODE_ENV=production pnpm --filter @shop/core-server db:push && node packages/core-server/dist/main.js';
fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(rootPkg, null, 2) + '\n');
console.log('OK: start script 改為先跑 prisma db push');

// core-server package.json 加入 db:push
const srvPkgPath = path.join(cwd, 'packages', 'core-server', 'package.json');
const srvPkg = JSON.parse(fs.readFileSync(srvPkgPath, 'utf8'));
srvPkg.scripts['db:push'] = 'prisma db push --skip-generate';
fs.writeFileSync(srvPkgPath, JSON.stringify(srvPkg, null, 2) + '\n');
console.log('OK: 加入 db:push 指令');

// git
run('git add -A');
run('git commit -m "fix: 改為 PostgreSQL + prisma db push 部署"');
run('git push');
console.log('\n✅ 到 Render → Manual Deploy');
