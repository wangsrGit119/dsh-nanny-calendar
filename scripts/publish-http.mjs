// Publish dsh-nanny-calendar straight to the registry over HTTP, so the OTP step can be
// driven from the browser passkey flow.
//
// Why not `npm publish`: when it is not attached to a TTY, npm cannot open the browser for
// the WebAuthn one-time pass. Doing the PUT ourselves means we see the 401 body
// ({ authUrl, doneUrl }), hand authUrl to the user, poll doneUrl for the short-lived token
// and replay the same PUT with `npm-otp`.
//
// Usage: node scripts/publish-http.mjs [--dry-run]

import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REGISTRY = 'https://registry.npmjs.org';
const DRY = process.argv.includes('--dry-run');

const readToken = () => {
  const npmrc = readFileSync(join(homedir(), '.npmrc'), 'utf8');
  const m = npmrc.match(/\/\/registry\.npmjs\.org\/:_authToken=(\S+)/);
  if (!m) throw new Error('no npmjs token in ~/.npmrc');
  return m[1];
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const name = pkg.name;
const version = pkg.version;

console.log(`package: ${name}@${version}`);

// --- pack ---------------------------------------------------------------
const workDir = mkdtempSync(join(tmpdir(), 'npm-pack-'));
const out = execFileSync('npm', ['pack', '--silent', '--pack-destination', workDir], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: true,
}).trim().split('\n').pop();
const tarballPath = join(workDir, out);
const tarball = readFileSync(tarballPath);
console.log(`tarball: ${out} (${tarball.length} bytes)`);

const shasum = createHash('sha1').update(tarball).digest('hex');
const integrity = 'sha512-' + createHash('sha512').update(tarball).digest('base64');
console.log(`shasum: ${shasum}`);
console.log(`integrity: ${integrity}`);

// --- publish document ---------------------------------------------------
const manifest = {
  ...pkg,
  _id: `${name}@${version}`,
  dist: {
    shasum,
    integrity,
    tarball: `${REGISTRY}/${name}/-/${name}-${version}.tgz`,
  },
};

const body = JSON.stringify({
  _id: name,
  name,
  description: pkg.description,
  'dist-tags': { latest: version },
  versions: { [version]: manifest },
  access: 'public',
  _attachments: {
    [`${name}-${version}.tgz`]: {
      content_type: 'application/octet-stream',
      data: tarball.toString('base64'),
      length: tarball.length,
    },
  },
});

console.log(`payload: ${(body.length / 1024).toFixed(1)} kB`);

if (DRY) {
  console.log('dry run, not sending');
  process.exit(0);
}

// --- publish with OTP ---------------------------------------------------
const token = readToken();
const baseHeaders = {
  authorization: `Bearer ${token}`,
  'content-type': 'application/json',
  'user-agent': 'npm/11.15.0',
  'npm-auth-type': 'web',
  'npm-command': 'publish',
};

async function put(otp) {
  const headers = { ...baseHeaders };
  if (otp) headers['npm-otp'] = otp;
  const res = await fetch(`${REGISTRY}/${name}`, { method: 'PUT', headers, body });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { }
  return { status: res.status, json, text };
}

let result = await put(null);
console.log(`first PUT -> ${result.status}`);

if (result.status === 401 && result.json?.authUrl && result.json?.doneUrl) {
  const { authUrl, doneUrl } = result.json;
  console.log(`\nOpen this and approve with your security key:\n  ${authUrl}\n`);
  try {
    spawn('cmd', ['/c', 'start', '', authUrl], { detached: true, stdio: 'ignore' }).unref();
  } catch { }

  const deadline = Date.now() + 8 * 60 * 1000;
  let otp = null;
  while (Date.now() < deadline) {
    const r = await fetch(doneUrl, { headers: { 'user-agent': 'npm/11.15.0' } });
    if (r.status === 200) {
      otp = (await r.json()).token;
      break;
    }
    if (r.status === 404) throw new Error('auth session expired');
    await sleep(3000);
  }
  if (!otp) throw new Error('timed out waiting for browser approval');
  console.log(`got one-time pass (${otp.length} chars), retrying PUT`);

  result = await put(otp);
  console.log(`second PUT -> ${result.status}`);
}

if (result.status >= 200 && result.status < 300) {
  console.log('\nPUBLISHED');
  writeFileSync(join(ROOT, '.publish-ok'), `${name}@${version}\n`);
  process.exit(0);
}

console.error('\nFAILED:', result.status, result.text.slice(0, 600));
process.exit(1);
