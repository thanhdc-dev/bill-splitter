// REPL driver cho app Angular "bill-splitter". Chạy headless Chromium (Windows, không cần
// xvfb). Thiết kế cho agent: stdin nhận lệnh từng dòng, in kết quả ra stdout.
// Không phải một phần của app — chỉ dùng để /run kiểm tra UI.
import { chromium } from 'playwright';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SHOT_DIR = process.env.SCREENSHOT_DIR || path.resolve(import.meta.dirname, 'screenshots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

let browser = null;
let page = null;

const COMMANDS = {
  async launch(arg) {
    if (browser) return console.log('already launched');
    browser = await chromium.launch({ headless: true });
    const [width, height] = (arg || '1280x800').split('x').map(Number);
    const context = await browser.newContext({ viewport: { width, height: height || 800 } });
    page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('[console.error]', msg.text());
    });
    page.on('pageerror', (err) => console.log('[pageerror]', err.message));
    console.log('launched. viewport', width, 'x', height || 800);
  },

  async viewport(arg) {
    if (!page) return console.log('ERROR: launch first');
    const [width, height] = arg.split('x').map(Number);
    await page.setViewportSize({ width, height });
    console.log('viewport set', width, 'x', height);
  },

  async nav(url) {
    if (!page) return console.log('ERROR: launch first');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    console.log('nav ->', url);
  },

  async 'wait-for'(sel) {
    if (!page) return console.log('ERROR: launch first');
    try {
      if (sel.startsWith('text=')) {
        await page.getByText(sel.slice(5)).first().waitFor({ timeout: 15_000 });
      } else {
        await page.waitForSelector(sel, { timeout: 15_000 });
      }
      console.log('found:', sel);
    } catch {
      console.log('TIMEOUT:', sel);
    }
  },

  async screenshot(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f, fullPage: true });
    console.log('screenshot:', f);
  },

  // "screenshot-clip x,y,w,h [name]" — pixel-exact crop (page coords, not viewport-relative
  // after scroll). Use for inspecting something small (a notch, a focus ring).
  async 'screenshot-clip'(arg) {
    if (!page) return console.log('ERROR: launch first');
    const [coords, name] = arg.split(/\s+/);
    const [x, y, width, height] = coords.split(',').map(Number);
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f, clip: { x, y, width, height } });
    console.log('screenshot-clip:', f);
  },

  async 'screenshot-el'(arg) {
    if (!page) return console.log('ERROR: launch first');
    const [sel, name] = arg.split(/\s+(?=\S+$)/);
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.locator(sel).first().screenshot({ path: f });
    console.log('screenshot-el:', f);
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first');
    try {
      await page.locator(sel).first().click({ timeout: 10_000 });
      console.log('click', sel, '-> OK');
    } catch (e) {
      console.log('click', sel, '-> ERROR:', e.message.split('\n')[0]);
    }
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first');
    try {
      await page.getByText(text, { exact: false }).first().click({ timeout: 10_000 });
      console.log('click-text', JSON.stringify(text), '-> OK');
    } catch (e) {
      console.log('click-text', JSON.stringify(text), '-> ERROR:', e.message.split('\n')[0]);
    }
  },

  // "fill <selector> :: <value>" — the ' :: ' delimiter (not just a space) lets <selector>
  // itself contain descendant combinators, e.g. ".expense-form input[formcontrolname=name]".
  async fill(arg) {
    if (!page) return console.log('ERROR: launch first');
    const sepIdx = arg.indexOf(' :: ');
    const [sel, value] = sepIdx === -1 ? [arg, ''] : [arg.slice(0, sepIdx), arg.slice(sepIdx + 4)];
    await page.locator(sel).first().fill(value);
    console.log('fill', sel, '-> OK');
  },

  async press(key) {
    if (page) await page.keyboard.press(key);
  },

  async 'set-theme'(mode) {
    if (!page) return console.log('ERROR: launch first');
    await page.evaluate((m) => localStorage.setItem('theme', m), mode);
    console.log('localStorage.theme =', mode, '(reload/nav để áp dụng)');
  },

  async 'set-ls'(arg) {
    if (!page) return console.log('ERROR: launch first');
    const sepIdx = arg.indexOf(' :: ');
    const [key, value] = sepIdx === -1 ? [arg, ''] : [arg.slice(0, sepIdx), arg.slice(sepIdx + 4)];
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
    console.log('localStorage.' + key, '=', value);
  },

  async sleep(ms) {
    await new Promise((r) => setTimeout(r, Number(ms) || 300));
    console.log('slept', ms || 300, 'ms');
  },

  // "mock <url-glob> :: <json-body>" — intercepts matching requests and fulfills them with
  // this JSON instead of hitting the real backend. Glob per Playwright's page.route (e.g.
  // "**/auth/me", "**/bills"). Registered mocks apply to all requests from now on.
  async mock(arg) {
    if (!page) return console.log('ERROR: launch first');
    const sepIdx = arg.indexOf(' :: ');
    if (sepIdx === -1) return console.log('ERROR: usage: mock <url-glob> :: <json>');
    const glob = arg.slice(0, sepIdx);
    const body = arg.slice(sepIdx + 4);
    await page.route(glob, (route) => route.fulfill({ contentType: 'application/json', body }));
    console.log('mock', glob, '-> registered');
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try {
      console.log(JSON.stringify(await page.evaluate(expr)));
    } catch (e) {
      console.log('ERROR:', e.message);
    }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    console.log(
      await page.evaluate(
        (s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
        sel || null,
      ),
    );
  },

  async quit() {
    if (browser) await browser.close().catch(() => {});
    browser = null;
    page = null;
  },
  help() {
    console.log('commands:', Object.keys(COMMANDS).join(', '));
  },
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'driver> ' });

// readline emits 'line' for every buffered line as soon as it arrives — it does NOT wait
// for an async handler to finish before firing the next one. A piped heredoc delivers all
// lines in one burst, so without an explicit queue, "launch" (slow) and "nav"/"screenshot"
// (need page ready) would race and run concurrently. Queue + drain-before-exit fixes it.
const lineQueue = [];
let draining = false;

async function drainQueue() {
  if (draining) return;
  draining = true;
  while (lineQueue.length) {
    const line = lineQueue.shift();
    const [cmd, ...rest] = line.trim().split(/\s+/);
    if (!cmd) {
      rl.prompt();
      continue;
    }
    const fn = COMMANDS[cmd];
    if (!fn) {
      console.log('unknown:', cmd, '- try: help');
      rl.prompt();
      continue;
    }
    try {
      await fn(rest.join(' '));
    } catch (e) {
      console.log('ERROR:', e.message);
    }
    if (cmd === 'quit') {
      rl.close();
      process.exit(0);
      return;
    }
    rl.prompt();
  }
  draining = false;
}

rl.on('line', (line) => {
  lineQueue.push(line);
  drainQueue();
});
rl.on('close', async () => {
  while (draining) await new Promise((r) => setTimeout(r, 50));
  await COMMANDS.quit();
  process.exit(0);
});

console.log('bill-splitter web driver - "help" for commands, "launch [WxH]" to start');
rl.prompt();
