/** @jest-environment node */
const { execFileSync } = require('node:child_process');
const path = require('node:path');
test('실제 PostgreSQL: SQL 2회 적용·todo 보존·RLS·버전 충돌·입력 검증 6개 시나리오', () => {
  const output = execFileSync(process.execPath, [path.join(__dirname, 'schema-runner.cjs')], { encoding: 'utf8', timeout: 30000 });
  const result = JSON.parse(output.trim());
  expect(result.passed).toBe(6);expect(result.checks).toHaveLength(6);
}, 35000);
