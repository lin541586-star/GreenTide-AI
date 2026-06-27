const { execSync } = require('child_process');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';
function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 60000 });
    console.log(r.substring(0, 500));
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>', msg.substring(0, 300));
    return '';
  }
}
console.log('=== git rm cached + re-add all ===');
run('git rm -r --cached . 2>nul');
run('git add -A');
run('git status --short');
run('git commit -m "feat: 完整專案上線 - 全部檔案"');
run('git push');
console.log('\n=== DONE ===');
