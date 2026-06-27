const { execSync } = require('child_process');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';

function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe' });
    console.log(r.trim());
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    console.log('FAIL:', msg.substring(0, 300));
    return '';
  }
}

console.log('=== 分支 ===');
run('git branch -a');

console.log('=== log ===');
run('git log --oneline -3');

console.log('=== status ===');
run('git status --short -b');
