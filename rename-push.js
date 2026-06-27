const { execSync } = require('child_process');
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
console.log('=== 重新命名 main ===');
run('git branch -m master main');
console.log('=== push ===');
run('git push -u origin main --force');
console.log('=== 完成 ===');
