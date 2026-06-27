const { execSync } = require('child_process');
const cwd = 'C:\\Users\\admin\\Desktop\\AI各種專案\\企業管理系統';
function run(cmd) {
  try {
    const r = execSync(cmd, { cwd, encoding: 'utf8', shell: 'cmd.exe', timeout: 60000 });
    console.log(r.substring(0, 800));
    return r.trim();
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : e.message;
    if (msg) console.log('>>', msg.substring(0, 300));
    return '';
  }
}
run('git add packages/core-server/package.json');
run('git commit -m "fix: 將 prisma 移到 dependencies 讓 Render 建置時可用"');
const r = run('git push');
if (r.includes('error')) {
  console.log('\n⚠️ 請手動執行：cmd.exe → cd /d ' + cwd + ' → git push');
} else {
  console.log('\n✅ 推送成功！到 Render → Manual Deploy → Deploy latest commit');
}
