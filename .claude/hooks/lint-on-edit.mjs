// PostToolUse hook: run `eslint --fix` on edited .ts/.html files.
// Remaining lint errors are reported to Claude via stderr + exit code 2.
import { spawnSync } from 'node:child_process';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let filePath = '';
try {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  filePath = input?.tool_response?.filePath ?? input?.tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

const normalized = filePath.replace(/\\/g, '/');
if (!/\.(ts|html)$/.test(normalized) || normalized.includes('/node_modules/')) process.exit(0);

const result = spawnSync('npx', ['eslint', '--fix', filePath], {
  cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
  encoding: 'utf8',
  shell: true,
});

if (result.status !== 0) {
  console.error(`${result.stdout ?? ''}${result.stderr ?? ''}`.trim());
  process.exit(2);
}
