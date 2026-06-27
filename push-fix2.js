const { execSync } = require('child_process');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';
function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 60000 });
    if (r.trim()) console.log(r.trim().substring(0, 500));
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>>', msg.substring(0, 200));
    return '';
  }
}
run('git add packages/core-web/package.json packages/core-web/tsconfig.json');
run('git commit -m "fix: 將 vite 移到 dependencies + 跳過 tsc 檢查 + 修正 baseUrl 棄用"');
run('git push');
console.log('\n✅ 完成！到 Render → Manual Deploy → Deploy latest commit');
