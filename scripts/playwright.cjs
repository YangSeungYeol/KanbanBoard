// 프로젝트 로컬 Chromium과 선택적인 사용자 범위 Linux 라이브러리를 사용합니다.
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0' };
const runtime = path.join(root, 'playwright/.cache/runtime');
const libraries = path.join(runtime, 'usr/lib/x86_64-linux-gnu');
if (process.platform === 'linux' && existsSync(libraries)) {
  env.LD_LIBRARY_PATH = [libraries, env.LD_LIBRARY_PATH].filter(Boolean).join(path.delimiter);
  const fontconfig = path.join(runtime, 'fonts.conf');
  if (existsSync(fontconfig)) env.FONTCONFIG_FILE = fontconfig;
}
const cli = path.join(path.dirname(require.resolve('playwright/package.json')), 'cli.js');
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { cwd: root, env, stdio: 'inherit' });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
