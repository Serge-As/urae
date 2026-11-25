import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deriveLocalPasswordVerifier} from '../.build/packages/offline/src/index.js';

const app=fs.readFileSync('packages/application/src/index.ts','utf8');
const offline=fs.readFileSync('packages/offline/src/index.ts','utf8');
const main=fs.readFileSync('apps/web/src/main.js','utf8');
const html=fs.readFileSync('apps/web/index.html','utf8');
const contracts=fs.readFileSync('packages/contracts/src/index.ts','utf8');

test('first account can be created locally without any previous server session',()=>{
  assert.match(offline,/LOCAL_PENDING_REGISTRATION/);
  assert.match(offline,/IndexedDbLocalAuthAdapter/);
  assert.match(offline,/PBKDF2/);
  assert.match(offline,/passwordVerifier/);
  assert.doesNotMatch(offline,/passwordPlain|plainPassword|storedPassword/);
  assert.match(app,/mode==='register'[\s\S]{0,500}localAuth\.register/);
  assert.match(app,/navigator\.onLine===false[\s\S]{0,300}localFlow/);
  assert.match(app,/authStatus\(\)[\s\S]{0,1000}LOCAL_PENDING_REGISTRATION/);
  assert.match(html,/Première utilisation hors ligne/);
  assert.match(main,/Aucun compte local n’existe encore/);
});

test('local account is later claimed by server and identity-scoped offline state migrates before sync',()=>{
  assert.match(app,/claimLocalAccount/);
  assert.match(app,/ACCOUNT_UNAVAILABLE[\s\S]{0,300}serverAuthenticate\('login'/);
  assert.match(app,/readSnapshots\.migrateIdentity/);
  assert.match(app,/outboxStorage\.migrateIdentity/);
  assert.match(app,/localAuth\.markClaimed/);
  assert.match(app,/this\.outbox\.restore\(migrated\)/);
  assert.match(app,/await this\.syncOutbox\(\)/);
  assert.match(offline,/replaceIdentity/);
});

test('local password verifier is salted and deterministic only for same password and salt',async()=>{
  const saltA=Buffer.alloc(16,1).toString('base64'),saltB=Buffer.alloc(16,2).toString('base64');
  const a=await deriveLocalPasswordVerifier('mot-de-passe-tres-long',saltA,1000);
  const a2=await deriveLocalPasswordVerifier('mot-de-passe-tres-long',saltA,1000);
  const b=await deriveLocalPasswordVerifier('mot-de-passe-tres-long',saltB,1000);
  const c=await deriveLocalPasswordVerifier('autre-mot-de-passe-long',saltA,1000);
  assert.equal(a,a2);assert.notEqual(a,b);assert.notEqual(a,c);
});

test('Android compatibility does not require randomUUID or getAll and logout does not force a reload',()=>{
  assert.match(contracts,/typeof c\.randomUUID==='function'/);
  assert.match(contracts,/c\.getRandomValues/);
  assert.match(offline,/openCursor\(\)/);
  assert.match(offline,/typeof modern\.getAll==='function'/);
  assert.doesNotMatch(main,/logoutBtn[^\n]{0,500}location\.reload/);
  assert.match(main,/window\.structuredClone/);
});

test('offline auth UI clearly separates local use from server finalization',()=>{
  assert.match(html,/id="claimLocalAccountBtn"/);
  assert.match(main,/Finaliser le compte local/);
  assert.match(main,/Vous pouvez commencer sans Internet/);
  assert.match(main,/Internet est nécessaire uniquement pour finaliser le compte/);
});
