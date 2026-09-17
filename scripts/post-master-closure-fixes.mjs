import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const replace=(p,from,to,{optional=false}={})=>{
  let s=read(p);
  if(!s.includes(from)){
    if(optional)return false;
    throw new Error(`POST_FIX_ANCHOR_MISSING:${p}:${from.slice(0,80)}`);
  }
  s=s.split(from).join(to);write(p,s);return true;
};

// Visible release truth: one version, one constitutional baseline, later addenda explicitly additive.
replace('apps/web/index.html','Eco-System — 1.3.3 Fairness Lab · AdOps · Doctor','Eco-System — 1.4.0 · Master 2.3.4');
replace('apps/web/index.html','ECO-SYSTEM · 1.3.3','ECO-SYSTEM · 1.4.0');
replace('apps/web/index.html','Eco-System · Cahier Maître 3.2.0','Eco-System · Cahier Maître 2.3.4 + additifs 3.2.0');

// Old regression test was itself stale: it should guard against old shells, not require 1.3.2 forever.
{
  const p='tests/browser-runtime-1.2.test.mjs';let s=read(p);
  s=s.replace("test('current shell identifies 1.3 instead of stale 1.1.2 copy'","test('current shell identifies 1.4 instead of stale copies'");
  s=s.replace(/assert\.match\(html,\/Eco-System 1\\\.3\\\.2\/\);/g,"assert.match(html,/1\\.4\\.0/);");
  if(!s.includes("assert.match(html,/1\\.4\\.0/);"))throw new Error('BROWSER_RELEASE_ASSERTION_NOT_UPDATED');
  write(p,s);
}

// Build output is part of release truth too.
{
  const p='scripts/build.mjs';let s=read(p);
  s=s.split('1.3.4-voice-two-sheet-documents-final').join('1.4.0-master-2.3.4-closure');
  s=s.split('field hardening + voice/two-sheet + dossiers + documents + contextual rubrics').join('Master 2.3.4 closure + member lifecycle + meeting governance + arrears/reports + voice/two-sheet + dossiers + documents');
  write(p,s);
}

console.log('Eco-System 1.4.0 post-patch release truth reconciled.');
