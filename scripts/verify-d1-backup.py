"""Restore only to a fresh local copy. No production repair or membership reactivation."""
import sys,sqlite3,hashlib,json,pathlib
def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=True,separators=(',',':')).encode('utf-8')).hexdigest()
def quote(name):return '"'+name.replace('"','""')+'"'
def expected_columns():
    reference=sqlite3.connect(':memory:')
    try:
        for migration in sorted((pathlib.Path(__file__).resolve().parent.parent/'cloudflare/migrations').glob('*.sql')):
            reference.executescript(migration.read_text(encoding='utf-8-sig'))
        names=[r[0]for r in reference.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        if not names:raise RuntimeError('Expected migration schema unavailable')
        return{name:[r[1]for r in reference.execute('PRAGMA table_info('+quote(name)+')')]for name in names}
    finally:reference.close()
def verify_restore(source,target,expected=None):
    source,target=pathlib.Path(source),pathlib.Path(target)
    if target.exists():raise RuntimeError('Restore target already exists')
    raw=source.read_bytes()
    if not raw:raise RuntimeError('Empty backup')
    sql_hash=hashlib.sha256(raw).hexdigest()
    expected=expected.get('verification',expected)if expected else None
    if expected and expected.get('sqlSha256')!=sql_hash:raise RuntimeError('Backup source checksum mismatch')
    connection=sqlite3.connect(target)
    try:
        connection.executescript(raw.decode('utf-8'))
        if connection.execute('PRAGMA integrity_check').fetchall()!=[('ok',)]:raise RuntimeError('SQLite integrity failure')
        if connection.execute('PRAGMA foreign_key_check').fetchone():raise RuntimeError('Foreign key integrity failure')
        tables=sorted(r[0]for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table'"))
        required=expected_columns();missing=sorted(set(required)-set(tables))
        if missing:raise RuntimeError('Partial database backup: missing expected tables: '+', '.join(missing))
        inventory=[]
        for name in tables:
            columns=[r[1]for r in connection.execute('PRAGMA table_info('+quote(name)+')')]
            if set(required.get(name,[]))-set(columns):raise RuntimeError('Partial database schema: '+name)
            rows=[]
            for row in connection.execute('SELECT * FROM '+quote(name)):
                cells=[{'blobHex':v.hex()}if isinstance(v,bytes)else v for v in row];rows.append(digest(cells))
            inventory.append({'table':name,'columns':columns,'rows':len(rows),'dataSha256':digest(sorted(rows))})
        data_hash=digest(inventory)
        if expected and expected.get('dataSha256') and expected['dataSha256']!=data_hash:raise RuntimeError('Restored data checksum mismatch')
        return{'protocol':'ECO_RESTORE_REPORT_2','integrity':'ok','foreignKeys':'ok','tables':len(tables),'expectedTables':len(required),'expectedSchemaPresent':True,'sqlBytes':len(raw),'sqlSha256':sql_hash,'dataSha256':data_hash,'inventory':inventory,'scope':'D1_DATABASE_ONLY','completeApplicationBackup':False,'excluded':['R2_ATTACHMENT_OBJECTS','DEVICE_INDEXEDDB_AND_PENDING_OUTBOX','EXTERNAL_PROVIDER_STATE'],'automaticRepair':False}
    finally:connection.close()
if __name__=='__main__':
    expected=json.loads(pathlib.Path(sys.argv[3]).read_text(encoding='utf-8'))if len(sys.argv)>3 else None
    print(json.dumps(verify_restore(sys.argv[1],sys.argv[2],expected)))
