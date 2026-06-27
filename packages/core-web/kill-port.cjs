const { execSync } = require('child_process');
// 找出佔用 5173 port 的 PID
try {
  const out = execSync('netstat -ano | findstr :5173', { encoding: 'utf8', shell: true });
  const lines = out.trim().split('\n').filter(l => l.includes('LISTENING'));
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    try {
      process.kill(parseInt(pid));
      console.log('Killed PID:', pid);
    } catch (e) {
      console.log('Failed to kill PID:', pid, e.message);
    }
  }
} catch (e) {
  console.log('No process on port 5173');
}
