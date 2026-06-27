const { execSync } = require('child_process');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';

function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe' });
    console.log(r.trim());
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message.substring(0, 200);
    console.log('FAIL:', msg);
    return '';
  }
}

// 1. 設定 remote
run('git remote add origin https://github.com/lin541586-star/GreenTide-AI.git');
console.log('--- remote add done ---');

// 2. 推上 GitHub（需要輸入 GitHub 帳密或裝置授權）
console.log('=== 正在推上 GitHub... ===');
console.log('如果跳出登入視窗請輸入 GitHub 帳號密碼或使用 token');
run('git push -u origin main');
console.log('=== push done ===');

// 3. 確認 remote
run('git remote -v');
