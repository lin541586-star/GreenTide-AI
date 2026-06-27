const { execSync } = require('child_process');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';

function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 60000 });
    console.log(r.trim());
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>', msg.substring(0, 300));
    return '';
  }
}

console.log('=== 1. 先 pull 遠端內容 ===');
run('git pull origin main --allow-unrelated-histories -X theirs 2>nul');

console.log('\n=== 2. 加入所有專案檔案 ===');
run('git add -A');

console.log('\n=== 3. 再次 commit ===');
run('git commit -m "feat: 完整專案 - AI 庫存掃描 + PWA + 語氣設定 + LINE 串接"');

console.log('\n=== 4. 推上 GitHub ===');
run('git push -u origin main --force');

console.log('\n=== 完成 ===');
run('git log --oneline -3');
