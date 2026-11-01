import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const migration='cloudflare/migrations/0020_scoped_module_directory_indexes.sql';
const allowed=["CREATE INDEX IF NOT EXISTS idx_platform_workspace_module ON platform_records(record_type,tenant_id,json_extract(data_json,'$.moduleId'),group_id) WHERE record_type='workspace_record'","CREATE INDEX IF NOT EXISTS idx_platform_public_group ON platform_records(record_type,json_extract(data_json,'$.groupId')) WHERE record_type='public_group_listing'"];
const normalize=s=>s.replace(/\s+/g,' ').trim();
export function verifyIndexSql(sql){const statements=sql.replace(/--[^\n]*/g,'').split(';').map(normalize).filter(Boolean);if(statements.length!==allowed.length||statements.some((s,i)=>s!==normalize(allowed[i])))throw Error('ONLY_QUALIFIED_READ_INDEXES_ALLOWED');return statements;}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});if(r.status!==0)throw Error('Qualified index operation failed; no Worker deploy allowed ('+cmd+'). '+String(r.stderr).slice(-500));return r.stdout;};
const copyVerifier=`import hashlib,json,sqlite3,shutil,sys
source,target,migration=sys.argv[1:]
shutil.copy2(source,target)
db=sqlite3.connect(target)
def digest():
 h=hashlib.sha256()
 for line in db.iterdump():
  if line.startswith('INSERT INTO '):h.update(line.encode())
 return h.hexdigest()
before=digest()
db.executescript(open(migration,encoding='utf-8').read())
after=digest()
assert before==after,'INDEX_CHANGED_DATA'
integrity=db.execute('PRAGMA integrity_check').fetchone()[0]
assert integrity=='ok' and not db.execute('PRAGMA foreign_key_check').fetchall()
plan=[r[3] for r in db.execute("EXPLAIN QUERY PLAN SELECT data_json FROM platform_records WHERE record_type='workspace_record' AND tenant_id=? AND group_id=? AND json_extract(data_json,'$.moduleId')=?",('qualification-only','qualification-only','qualification-only'))]
assert any('idx_platform_workspace_module' in r for r in plan),plan
print(json.dumps({'dataHashBefore':before,'dataHashAfter':after,'integrity':integrity,'foreignKeyErrors':0,'plan':plan,'tableCount':db.execute("SELECT count(*) FROM sqlite_master WHERE type='table'").fetchone()[0]}))
db.close()
`;
export function verifyCopy(source,target,sqlPath=migration,python='python3'){verifyIndexSql(fs.readFileSync(sqlPath,'utf8'));return JSON.parse(run(python,['-c',copyVerifier,source,target,sqlPath]));}
async function main(){
 const sha=process.env.GITHUB_SHA;if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('EXACT_DELIVERY_SHA_REQUIRED');
 if(process.env.ECO_SYSTEM_DB!=='eco-system-db'||process.env.R2_BUCKET!=='eco-system-backups')throw Error('CANONICAL_STORAGE_REQUIRED');
 const manifest=JSON.parse(fs.readFileSync('.recovery/manifest.json','utf8'));
 if(manifest.sourceSha!==sha||manifest.scope!=='D1_AND_EXACT_SOURCE_ONLY'||manifest.verification?.integrity!=='ok'||Date.now()-Date.parse(manifest.createdAt)>6*3600000)throw Error('RESTORED_EXACT_SOURCE_BACKUP_REQUIRED');
 const digest=fs.readFileSync('.recovery/recovery.sha256','utf8').split(/\s/)[0];if(hash(fs.readFileSync('.recovery/recovery.tar.gz'))!==digest||hash(fs.readFileSync('.recovery/downloaded.tar.gz'))!==digest)throw Error('PRIVATE_RECOVERY_READBACK_HASH_REQUIRED');
 const sql=fs.readFileSync(migration,'utf8');verifyIndexSql(sql);
 const verified=verifyCopy('.recovery/restored.sqlite','.recovery/qualified-index-copy.sqlite');
 const config='workers/api/wrangler.ci.toml';
 run('npx',['--yes','wrangler@4','d1','execute','eco-system-db','--remote','--config',config,'--file',migration,'--json']);
 const raw=run('npx',['--yes','wrangler@4','d1','execute','eco-system-db','--remote','--config',config,'--command',"SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_platform_workspace_module','idx_platform_public_group')",'--json']);
 const reply=JSON.parse(raw),names=reply.flatMap(r=>r.results??[]).map(r=>r.name).sort();if(JSON.stringify(names)!==JSON.stringify(['idx_platform_public_group','idx_platform_workspace_module']))throw Error('PRODUCTION_INDEX_PROOF_REQUIRED');
 const receipt={schema:1,sourceSha:sha,appliedAt:new Date().toISOString(),migration,sqlSha256:hash(sql),backupArchiveSha256:digest,scope:'TWO_ADDITIVE_READ_INDEXES_ONLY',copiedDataUnchanged:true,copyVerification:verified,productionIndexes:names,rollback:'Code rollback retains these compatible read indexes. Never restore an old database over subsequent financial entries.'};
 fs.writeFileSync('.recovery/index-migration.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({sourceSha:sha,qualified:true,onlyReadIndexes:true,indexes:names}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
