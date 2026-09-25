import fs from 'node:fs';
const [file,name='eco-system-db']=process.argv.slice(2); if(!file) process.exit(2);
let data; try{data=JSON.parse(fs.readFileSync(file,'utf8'));}catch{process.exit(1);}
const seen=new Set(); let found;
const walk=v=>{if(found||v==null||typeof v!=='object'||seen.has(v))return;seen.add(v);if(!Array.isArray(v)&&String(v.name??v.database_name??'')===name){const id=v.uuid??v.id??v.database_id;if(typeof id==='string'&&id)found=id;}for(const x of Array.isArray(v)?v:Object.values(v))walk(x);};
walk(data); if(found)process.stdout.write(found); else process.exit(1);
