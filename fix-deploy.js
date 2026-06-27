const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';

function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 60000 });
    console.log(r.trim().substring(0, 500));
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>>', msg.substring(0, 300));
    return '';
  }
}

// 1. 刪除舊 lockfile
const lock = path.join(cwd, 'pnpm-lock.yaml');
if (fs.existsSync(lock)) {
  fs.unlinkSync(lock);
  console.log('✅ 已刪除舊 pnpm-lock.yaml');
}

// 2. 修正 pnpm-workspace.yaml — 移除 onlyBuiltDependencies 改用 allowBuilds
const ws = path.join(cwd, 'pnpm-workspace.yaml');
let wsContent = fs.readFileSync(ws, 'utf8');
wsContent = wsContent.replace(/\nonlyBuiltDependencies:.*/, '');
fs.writeFileSync(ws, wsContent);
console.log('✅ 已修正 pnpm-workspace.yaml（移除 onlyBuiltDependencies）');

// 3. 查看目前狀態
console.log('\n=== 目前 pnpm-workspace.yaml ===');
console.log(fs.readFileSync(ws, 'utf8'));

// 4. git 提交
console.log('\n=== git add + commit + push ===');
run('git add -A');
run('git commit -m "fix: 移除 onlyBuiltDependencies 搭配 pnpm@9"');
const pushResult = run('git push');
if (pushResult.includes('error')) {
  console.log('\n⚠️ Git push 失敗，可能需認證。請手動執行：');
  console.log('cd /d ' + cwd);
  console.log('git push');
} else {
  console.log('\n✅ 推送成功！');
}
console.log('\n=== 下一步 ===');
console.log('到 Render → greentide-ai → Manual Deploy → Deploy latest commit');
