import fs from 'node:fs';
const [databaseId,out='workers/api/wrangler.ci.toml']=process.argv.slice(2); if(!databaseId||!/^[0-9a-f-]{20,}$/i.test(databaseId)){console.error('Valid D1 database id required');process.exit(2);}
const base=fs.readFileSync('workers/api/wrangler.toml','utf8').trimEnd();
const binding=`\n\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "eco-system-db"\ndatabase_id = "${databaseId}"\nmigrations_dir = "../../cloudflare/migrations"\n`;
fs.writeFileSync(out,base+binding); console.log(`Rendered ${out} with DB binding (database id is non-secret deployment metadata).`);
