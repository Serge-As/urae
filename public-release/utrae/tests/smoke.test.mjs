import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('synthetic mobile-ready page is present', () => {
  const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
  assert.match(html, /<h1>UTRAE<\/h1>/);
  assert.match(html, /Aucune donnée financière réelle/);
});
