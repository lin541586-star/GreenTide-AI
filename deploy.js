const { execSync } = require('child_process');
const path = require('path');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';

function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe' });
    console.log(r.trim());
    return r.trim();
  } catch (e) {
    console.log('FAIL:', e.message.substring(0, 100));
    return '';
  }
}

// 1. 初始化 git
run('git init');
console.log('--- git init done ---');

// 2. 設定 user（如果沒設過）
run('git config user.email "deploy@shop.com"');
run('git config user.name "Deploy"');
console.log('--- git config done ---');

// 3. 檢查 .gitignore
const fs = require('fs');
const gitignorePath = path.join(cwd, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  fs.writeFileSync(gitignorePath, 'node_modules\ndist\n.env\n.env.local\n');
  console.log('--- .gitignore created ---');
}

// 4. 加入所有檔案
run('git add -A');
console.log('--- git add done ---');

// 5. 檢查狀態
const status = run('git status --short');
console.log('Changes:', status.split('\n').length, 'files');

// 6. commit
run('git commit -m "feat: 初始版本 - AI 庫存掃描 + PWA + 語氣設定"');
console.log('--- commit done ---');
