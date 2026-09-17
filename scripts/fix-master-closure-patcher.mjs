import fs from 'node:fs';
const p='scripts/apply-master-closure-1.4.mjs';
let s=fs.readFileSync(p,'utf8');
for(const name of ['memberAnchor','obligationAnchor']){
  const re=new RegExp(`const ${name}=\"\"\"([\\s\\S]*?)\"\"\";`);
  const m=s.match(re);if(!m)continue;
  const body=m[1].replaceAll('`','\\`').replaceAll('${','\\${');
  s=s.replace(re,`const ${name}=\`${body}\`;`);
}
fs.writeFileSync(p,s);
console.log('Closure patcher syntax bootstrap complete.');
