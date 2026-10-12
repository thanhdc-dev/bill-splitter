// PreToolUse hook: block Edit/Write on .env* files and src/generated/ (auto-generated).
// Exit code 2 blocks the tool call and feeds stderr back to Claude.
import { basename } from 'node:path';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let filePath = '';
try {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  filePath = input?.tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

const normalized = filePath.replace(/\\/g, '/');
const isEnvFile = /^\.env(\..+)?$/.test(basename(normalized)) && basename(normalized) !== '.env.example';
const isGenerated = /(^|\/)src\/generated\//.test(normalized);

if (isEnvFile) {
  console.error(`Blocked: "${filePath}" is an .env file and must not be edited by Claude.`);
  process.exit(2);
}
if (isGenerated) {
  console.error(`Blocked: "${filePath}" is under src/generated/ (auto-generated). Regenerate it instead of editing directly.`);
  process.exit(2);
}
