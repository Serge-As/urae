import fs from 'node:fs';
const p='scripts/apply-master-closure-1.4.mjs';
let s=fs.readFileSync(p,'utf8');
for(const name of ['memberAnchor','obligationAnchor']){
  const re=new RegExp(`const ${name}=\"\"\"([\\s\\S]*?)\"\"\";`);
  const m=s.match(re);if(!m)continue;
  const body=m[1].replaceAll('`','\\`').replaceAll('${','\\${');
  s=s.replace(re,`const ${name}=\`${body}\`;`);
}
// The legacy API already owns an arrearsRoute identifier in another route block.
// Rename only the new Master-closure route inside the patch template.
s=s.replaceAll('const arrearsRoute=url.pathname.match','const masterArrearsRoute=url.pathname.match');
s=s.replaceAll("if(arrearsRoute&&request.method==='GET')", "if(masterArrearsRoute&&request.method==='GET')");
s=s.replaceAll('const groupId=arrearsRoute[1]!','const groupId=masterArrearsRoute[1]!');
fs.writeFileSync(p,s);
console.log('Closure patcher syntax/bootstrap fixes complete.');
