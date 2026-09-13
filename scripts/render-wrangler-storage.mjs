import fs from 'node:fs';
const [databaseId,bucketName='eco-system-backups',out='workers/api/wrangler.ci.toml']=process.argv.slice(2);
if(!databaseId||!/^[0-9a-f-]{20,}$/i.test(databaseId)){console.error('Valid D1 database id required');process.exit(2);}
if(!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucketName)){console.error('Valid private R2 bucket name required');process.exit(2);}
const base=fs.readFileSync('workers/api/wrangler.toml','utf8').trimEnd();
const bindings=`
[[d1_databases]]
binding = "DB"
database_name = "eco-system-db"
database_id = "${databaseId}"
migrations_dir = "../../cloudflare/migrations"

[[r2_buckets]]
binding = "ARTIFACTS"
bucket_name = "${bucketName}"
`;
fs.writeFileSync(out,base+'\n\n'+bindings);
console.log(`Rendered ${out} with existing D1 and private R2 binding ${bucketName}.`);
