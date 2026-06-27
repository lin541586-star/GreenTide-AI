const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';

function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 30000 });
    console.log(r.trim());
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>', msg.substring(0, 200));
    return '';
  }
}

// 1. 確保 .gitignore
const gi = path.join(cwd, '.gitignore');
if (!fs.existsSync(gi)) {
  fs.writeFileSync(gi, 'node_modules\ndist\n.env\n.env.local\n*.js\n!.env.example\n');
  console.log('created .gitignore');
}

// 2. 先 git init
run('git init');

// 3. 設定 user
run('git config user.email "deploy@shop.com"');
run('git config user.name "Deploy"');

// 4. 加入全部 + commit
run('git add -A');
run('git commit -m "feat: 初始版本 - AI 庫存掃描 + PWA + 語氣設定"');

// 5. 改名 main
run('git branch -m master main');

// 6. 推上 GitHub
console.log('\n=== 推上 GitHub ===');
run('git remote remove origin 2>nul');
run('git remote add origin https://github.com/lin541586-star/GreenTide-AI.git');
const pushResult = run('git push -u origin main');
if (pushResult.includes('error')) {
  console.log('\n⚠️ 需要認證。請手動執行：');
  console.log('在 cmd 中執行：');
  console.log('cd /d ' + cwd);
  console.log('git push -u origin main');
} else {
  console.log('\n✅ 成功推上 GitHub！');
}
