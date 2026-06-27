const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';

function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 120000 });
    const out = r.trim();
    if (out) console.log(out.substring(0, 1000));
    return out;
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>>', msg.substring(0, 300));
    return '';
  }
}

console.log('=== 刪除 .git ===');
fs.rmSync(path.join(cwd, '.git'), { recursive: true, force: true });
console.log('.git deleted');

console.log('=== git init ===');
run('git init');

console.log('=== git config ===');
run('git config user.email "deploy@shop.com"');
run('git config user.name "Deploy"');

console.log('=== .gitignore ===');
const gi = path.join(cwd, '.gitignore');
if (!fs.existsSync(gi)) {
  fs.writeFileSync(gi, 'node_modules\ndist\n.env\n.env.local\n');
}
run('git add .gitignore');

console.log('=== 加入所有檔案（排除 node_modules） ===');
run('git add packages/');
run('git add *.json *.ts *.js *.bat *.ps1 *.vbs *.yaml *.md *.d.ts');
run('git add railway.json tsconfig.base.json start-system.bat start.bat pnpm-workspace.yaml');

console.log('\n=== 確認檔案數量 ===');
run('git ls-files | find /c /v ""');

console.log('\n=== commit ===');
run('git commit -m "feat: 完整專案 - AI 庫存掃描 + PWA + 語氣設定 + LINE 串接"');

console.log('\n=== remote ===');
run('git remote add origin https://github.com/lin541586-star/GreenTide-AI.git');

console.log('\n=== push (可能要求登入) ===');
run('git push -u origin main --force');

console.log('\n=== 完成 ===');
