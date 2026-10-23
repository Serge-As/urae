from pathlib import Path
import sys,sqlite3,importlib.util,json
root=Path.cwd();folder=Path(sys.argv[1]);spec=importlib.util.spec_from_file_location('restore_check',root/'scripts/verify-d1-backup.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
source=sqlite3.connect(':memory:')
for migration in sorted((root/'cloudflare/migrations').glob('*.sql')):source.executescript(migration.read_text(encoding='utf-8-sig'))
stamp='2026-10-01T08:00:00Z'
def record(kind,value,assignee=None):
 source.execute('INSERT INTO platform_records(record_type,record_id,tenant_id,group_id,assignee_id,data_json,updated_at) VALUES(?,?,?,?,?,?,?)',(kind,value['id'],value.get('tenantId'),value.get('groupId'),assignee,json.dumps(value),stamp))
for actor in ['owner','left']:
 source.execute('INSERT INTO app_user(id,display_name,locale,created_at) VALUES(?,?,?,?)',(actor,'Synthetic '+actor,'fr',stamp));record('user',{'id':actor,'displayName':'Synthetic '+actor,'locale':'fr','createdAt':stamp})
source.execute('INSERT INTO tenant_group(id,tenant_id,name,kind,governance_model,status,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)',('g','t','Synthetic restored group','association','community','active','owner',stamp))
record('group',{'id':'g','tenantId':'t','name':'Synthetic restored group','kind':'association','governanceModel':'community','status':'active','createdBy':'owner','createdAt':stamp})
for actor,status,roles in [('owner','active','["founder"]'),('left','left','["member"]')]:
 source.execute('INSERT INTO membership(id,tenant_id,group_id,user_id,roles_json,status,joined_at) VALUES(?,?,?,?,?,?,?)',('m_'+actor,'t','g',actor,roles,status,stamp));record('membership',{'id':'m_'+actor,'tenantId':'t','groupId':'g','userId':actor,'roles':json.loads(roles),'status':status,'joinedAt':stamp},actor)
for account in ['cash','counterpart']:source.execute('INSERT INTO ledger_account(id,tenant_id,group_id,code,name_code,type,currency,created_at) VALUES(?,?,?,?,?,?,?,?)',(account,'t','g',account,account,'asset'if account=='cash'else'equity','XAF',stamp))
for entry,amount in [('e1',5000),('e2',1500)]:
 source.execute('INSERT INTO ledger_entry(id,tenant_id,group_id,currency,description_code,source_type,source_id,idempotency_key,created_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)',(entry,'t','g','XAF','SYNTHETIC','TEST',entry,entry,stamp,'owner'))
 source.execute('INSERT INTO ledger_line(entry_id,line_no,account_id,debit,credit) VALUES(?,?,?,?,?)',(entry,1,'cash',amount if entry=='e1'else 0,amount if entry=='e2'else 0))
 source.execute('INSERT INTO ledger_line(entry_id,line_no,account_id,debit,credit) VALUES(?,?,?,?,?)',(entry,2,'counterpart',amount if entry=='e2'else 0,amount if entry=='e1'else 0))
 record('ledger_entry',{'id':entry,'tenantId':'t','groupId':'g','currency':'XAF','descriptionCode':'SYNTHETIC','sourceType':'TEST','sourceId':entry,'idempotencyKey':entry,'createdAt':stamp,'createdBy':'owner','lines':[{'accountId':'cash','debit':amount if entry=='e1'else 0,'credit':amount if entry=='e2'else 0},{'accountId':'counterpart','debit':amount if entry=='e2'else 0,'credit':amount if entry=='e1'else 0}]})
source.commit();sql=folder/'source.sql';sql.write_text('\n'.join(source.iterdump()),encoding='utf-8');restored=folder/'restored.sqlite';report=module.verify_restore(sql,restored)
copy=folder/'verified-copy.sqlite';again=module.verify_restore(sql,copy,{'verification':report});assert again['dataSha256']==report['dataSha256']
def refused(name,text,expected=None):
 p=folder/(name+'.sql');p.write_text(text,encoding='utf-8')
 try:module.verify_restore(p,folder/(name+'.sqlite'),expected)
 except Exception:return
 raise AssertionError('Invalid backup unexpectedly accepted: '+name)
refused('partial','CREATE TABLE app_user(id TEXT PRIMARY KEY);')
refused('empty','')
refused('altered',sql.read_text(encoding='utf-8').replace('5000','6000'),report)
refused('broken-foreign-key',sql.read_text(encoding='utf-8')+"\nPRAGMA foreign_keys=OFF;DELETE FROM app_user WHERE id='left';")
source.close();print(json.dumps({'restoredFile':str(restored),'negativeCases':4,'report':{key:report[key]for key in ['expectedSchemaPresent','completeApplicationBackup','dataSha256','tables','expectedTables']}}))
