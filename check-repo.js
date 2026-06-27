const { execSync } = require('child_process');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';
function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 60000 });
    const out = r.trim().substring(0, 3000);
    if (out) console.log(out);
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>', msg.substring(0, 300));
    return '';
  }
}
console.log('=== 檔案數量 ===');
run('git ls-files | wc -l');
console.log('\n=== 前20個檔案 ===');
run('git ls-files | head -20');
console.log('\n=== 目錄結構 ===');
run('git ls-files --full-name | findstr /v "node_modules" | findstr /v /e ".js" | head -30');
console.log('\n=== 未追蹤檔案 ===');
run('git status --short | head -30');
