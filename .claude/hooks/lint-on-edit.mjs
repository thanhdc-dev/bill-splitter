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

const MAX_OUTPUT_LINES = 30;

// --quiet: report errors only (skip warnings) to keep the feedback small
const result = spawnSync('npx', ['eslint', '--fix', '--quiet', filePath], {
  cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
  encoding: 'utf8',
  shell: true,
});

if (result.status !== 0) {
  const lines = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n');
  const shown = lines.slice(0, MAX_OUTPUT_LINES).join('\n');
  const omitted = lines.length - MAX_OUTPUT_LINES;
  console.error(omitted > 0 ? `${shown}\n... (${omitted} more lines omitted; run \`npx eslint ${filePath}\`)` : shown);
  process.exit(2);
}
