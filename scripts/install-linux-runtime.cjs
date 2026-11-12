// Ubuntu 22.04에서 sudo 없이 공식 .deb를 프로젝트 내부에만 풉니다.
const { execFileSync } = require('node:child_process');
const { mkdirSync, readFileSync, readdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
if (process.platform !== 'linux' || !/VERSION_ID="22\.04"/.test(readFileSync('/etc/os-release', 'utf8'))) {
  console.error('이 보조 설치기는 Ubuntu 22.04 전용입니다. 다른 OS는 Playwright 공식 install-deps 절차를 사용하세요.');
  process.exit(1);
}
const packages = path.join(root, 'playwright/.cache/packages');
const runtime = path.join(root, 'playwright/.cache/runtime');
mkdirSync(packages, { recursive: true });
mkdirSync(runtime, { recursive: true });
const run = (cmd, args) => execFileSync(cmd, args, { cwd: packages, stdio: 'inherit' });
const names = ['libnspr4', 'libnss3', 'libasound2', 'fonts-nanum'];
const missing = names.filter(name => !readdirSync(packages).some(file => file.startsWith(`${name}_`) && file.endsWith('.deb')));
if (missing.length) run('apt-get', ['-o', 'Acquire::Retries=0', '-o', 'Acquire::http::Timeout=15', 'download', ...missing]);
for (const file of readdirSync(packages).filter(file => file.endsWith('.deb'))) run('dpkg-deb', ['-x', path.join(packages, file), runtime]);
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
writeFileSync(path.join(runtime, 'fonts.conf'), `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include>/etc/fonts/fonts.conf</include><dir>${escape(path.join(runtime, 'usr/share/fonts/truetype/nanum'))}</dir><cachedir>${escape(path.join(runtime, 'font-cache'))}</cachedir></fontconfig>`);
console.log('Chromium 라이브러리와 한글 폰트를 프로젝트 내부에 준비했습니다.');
