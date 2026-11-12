// 공개 연결 정보로 Provider 활성화 및 테이블 존재 여부만 읽습니다. 계정 생성/변경은 하지 않습니다.
const fs = require('node:fs');
const path = require('node:path');
const config = fs.readFileSync(path.join(__dirname, '../config.js'), 'utf8');
const url = config.match(/supabaseUrl:\s*'([^']+)'/)[1];
const key = config.match(/supabasePublishableKey:\s*'([^']+)'/)[1];
(async () => {
  for (const endpoint of ['/auth/v1/settings', '/rest/v1/kanban_boards?select=user_id&limit=0']) {
    const response = await fetch(url + endpoint, { headers: { apikey: key }, signal: AbortSignal.timeout(10000) });
    const body = await response.json();
    if (endpoint.includes('settings')) console.log(JSON.stringify({ endpoint, status: response.status, google: body.external?.google, github: body.external?.github, email: body.external?.email, signupDisabled: body.disable_signup, confirmEmailRequired: body.mailer_autoconfirm === false }));
    else console.log(JSON.stringify({ endpoint, status: response.status, code: body.code || null, message: typeof body.message === 'string' ? body.message : undefined, rows: Array.isArray(body) ? body.length : undefined }));
  }
})().catch(error => { console.error(error.cause?.code || error.message);process.exit(1); });
