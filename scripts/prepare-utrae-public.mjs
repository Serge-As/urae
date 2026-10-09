import { mkdir, writeFile, readFile, lstat, realpath } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// No original application source is read, copied, compiled or published here.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public-release', 'utrae');
const allow = ['README.md', 'SECURITY.md', 'package.json',
  'site/index.html', 'tests/smoke.test.mjs',
  '.github/workflows/public-smoke.yml'];
const at = process.argv.indexOf('--out');
if (at < 0 || !process.argv[at + 1])
  throw new Error('Usage: node scripts/prepare-utrae-public.mjs --out ABSOLUTE_FRESH_DIRECTORY');
const arg = process.argv[at + 1];
if (!arg.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(arg))
  throw new Error('ABSOLUTE_PATH_REQUIRED');
const out = resolve(arg);
const rootReal = await realpath(root);
const fromReal = await realpath(source);
const parent = await realpath(dirname(out));
if (out === rootReal || out.startsWith(rootReal + sep) ||
    parent === rootReal || parent.startsWith(rootReal + sep))
  throw new Error('DESTINATION_WITHIN_PRIVATE_REPOSITORY');
await mkdir(out); // fails closed if destination already exists
for (const path of allow) {
  const src = resolve(source, path);
  const info = await lstat(src);
  const real = await realpath(src);
  if (!info.isFile() || !real.startsWith(fromReal + sep))
    throw new Error('SOURCE_IS_NOT_AN_APPROVED_REGULAR_FILE: ' + path);
  const data = await readFile(src, 'utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]{15,}|AKIA[0-9A-Z]{16}/.test(data))
    throw new Error('SUSPECTED_SECRET: ' + path);
  const dst = resolve(out, path);
  await mkdir(dirname(dst), { recursive: true });
  await writeFile(dst, data, { flag: 'wx' });
}
console.log('UTRAE public skeleton exported to ' + out);
console.log('Only ' + allow.length + ' explicitly approved synthetic files. No Git history, secrets or deployment.');
