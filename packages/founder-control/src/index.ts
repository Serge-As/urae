import type {D1DatabaseLike} from '../../repositories/src/index.js';

export type CapabilityHealth='UNKNOWN'|'PASS'|'DEGRADED'|'FAIL';
export interface ControlCapability {
  id:string; labelFr:string; labelEn:string; declaredStatus:string; lot:string; workspace:string;
  health:CapabilityHealth; healthNote?:string; lastCheckedAt?:string; updatedAt:string;
}
export interface ControlItem {
  id:string; type:'CONTENT'|'INCIDENT'; key:string; title:string; status:string; priority:'LOW'|'NORMAL'|'HIGH'|'CRITICAL';
  data:Record<string,unknown>; createdAt:string; updatedAt:string;
}
export interface FounderControlSnapshot {
  generatedAt:string;
  platform:{groups:number;memberships:number;workspaceRecords:number;openComplaints:number;audits:number};
  capabilities:ControlCapability[];
  content:ControlItem[];
  incidents:ControlItem[];
  complaints:Array<{id:string;tenantId?:string;groupId?:string;status:string;summary:string;openedAt:string;openedBy:string}>;
  supervisionRule:'CATALOG_AUTO_REGISTER';
}
const now=()=>new Date().toISOString();
const clean=(v:string,max=1000)=>v.trim().replace(/\s+/g,' ').slice(0,max);
const validPriority=(v:string):ControlItem['priority']=>['LOW','NORMAL','HIGH','CRITICAL'].includes(v)?v as ControlItem['priority']:'NORMAL';
const validHealth=(v:string):CapabilityHealth=>['UNKNOWN','PASS','DEGRADED','FAIL'].includes(v)?v as CapabilityHealth:'UNKNOWN';
interface Row{[key:string]:unknown}

export class FounderControlStore{
  constructor(public db:D1DatabaseLike){}

  async syncCapabilities(capabilities:Array<{id:string;labelFr:string;labelEn:string;status:string;lot:string;workspace:string}>):Promise<void>{
    const stamp=now();
    const sql="INSERT INTO founder_control_items (id,item_type,item_key,title,status,priority,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(item_type,item_key) DO UPDATE SET title=excluded.title,data_json=json_set(founder_control_items.data_json,'$.labelFr',json_extract(excluded.data_json,'$.labelFr'),'$.labelEn',json_extract(excluded.data_json,'$.labelEn'),'$.declaredStatus',json_extract(excluded.data_json,'$.declaredStatus'),'$.lot',json_extract(excluded.data_json,'$.lot'),'$.workspace',json_extract(excluded.data_json,'$.workspace')),updated_at=excluded.updated_at";
    const statements=capabilities.map(c=>this.db.prepare(sql).bind('capability:'+c.id,'CAPABILITY',c.id,c.labelFr,'ACTIVE','NORMAL',JSON.stringify({labelFr:c.labelFr,labelEn:c.labelEn,declaredStatus:c.status,lot:c.lot,workspace:c.workspace,health:'UNKNOWN'}),stamp,stamp));
    if(statements.length)await this.db.batch(statements);
  }

  async recordCapabilityCheck(id:string,health:CapabilityHealth,note=''):Promise<void>{
    const h=validHealth(health),stamp=now();
    const row=await this.db.prepare("SELECT data_json FROM founder_control_items WHERE item_type='CAPABILITY' AND item_key=?").bind(id).first<{data_json:string}>();
    if(!row)throw new Error('CONTROL_CAPABILITY_NOT_FOUND');
    const data=JSON.parse(row.data_json) as Record<string,unknown>; data.health=h; data.healthNote=clean(note,1000); data.lastCheckedAt=stamp;
    await this.db.prepare("UPDATE founder_control_items SET data_json=?,updated_at=? WHERE item_type='CAPABILITY' AND item_key=?").bind(JSON.stringify(data),stamp,id).run();
  }

  async createContent(input:{key:string;title:string;status?:string;priority?:string;kind?:string;url?:string;note?:string}):Promise<ControlItem>{
    return this.createItem('CONTENT',input.key,input.title,input.status??'TODO',input.priority??'NORMAL',{kind:clean(input.kind??'ARTICLE',80),url:clean(input.url??'',500),note:clean(input.note??'',2000)});
  }
  async createIncident(input:{key:string;title:string;priority?:string;source?:string;note?:string}):Promise<ControlItem>{
    return this.createItem('INCIDENT',input.key,input.title,'OPEN',input.priority??'HIGH',{source:clean(input.source??'FOUNDER',160),note:clean(input.note??'',2000)});
  }
  private async createItem(type:'CONTENT'|'INCIDENT',keyValue:string,titleValue:string,status:string,priority:string,data:Record<string,unknown>):Promise<ControlItem>{
    const key=clean(keyValue,180),title=clean(titleValue,300); if(!key||!title)throw new Error('CONTROL_ITEM_FIELDS_REQUIRED');
    const stamp=now(),id=(type==='CONTENT'?'content:':'incident:')+crypto.randomUUID(),p=validPriority(priority);
    await this.db.prepare("INSERT INTO founder_control_items(id,item_type,item_key,title,status,priority,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,type,key,title,clean(status,60),p,JSON.stringify(data),stamp,stamp).run();
    return{id,type,key,title,status:clean(status,60),priority:p,data,createdAt:stamp,updatedAt:stamp};
  }
  async transition(id:string,status:string,note=''):Promise<ControlItem>{
    const row=await this.db.prepare("SELECT * FROM founder_control_items WHERE id=? AND item_type IN ('CONTENT','INCIDENT')").bind(id).first<Row>();
    if(!row)throw new Error('CONTROL_ITEM_NOT_FOUND');
    const data=JSON.parse(String(row.data_json??'{}')) as Record<string,unknown>; data.transitionNote=clean(note,2000); data.transitionedAt=now();
    const stamp=now(); await this.db.prepare("UPDATE founder_control_items SET status=?,data_json=?,updated_at=? WHERE id=?").bind(clean(status,60),JSON.stringify(data),stamp,id).run();
    return{id:String(row.id),type:String(row.item_type) as 'CONTENT'|'INCIDENT',key:String(row.item_key),title:String(row.title),status:clean(status,60),priority:validPriority(String(row.priority)),data,createdAt:String(row.created_at),updatedAt:stamp};
  }

  async snapshot(capabilities:Array<{id:string;labelFr:string;labelEn:string;status:string;lot:string;workspace:string}>):Promise<FounderControlSnapshot>{
    await this.syncCapabilities(capabilities);
    const count=async(type:string)=>Number((await this.db.prepare('SELECT COUNT(*) AS n FROM platform_records WHERE record_type=?').bind(type).first<{n:number}>())?.n??0);
    const [groups,memberships,workspaceRecords,audits,caseRows,controlRows]=await Promise.all([
      count('group'),count('membership'),count('workspace_record'),count('audit'),
      this.db.prepare("SELECT record_id,tenant_id,group_id,data_json FROM platform_records WHERE record_type='case' ORDER BY updated_at DESC LIMIT 250").all<Row>(),
      this.db.prepare('SELECT * FROM founder_control_items ORDER BY updated_at DESC LIMIT 2000').all<Row>()
    ]);
    const complaints=caseRows.results.map(r=>{const d=JSON.parse(String(r.data_json??'{}')) as Record<string,unknown>;return{id:String(r.record_id),tenantId:r.tenant_id?String(r.tenant_id):undefined,groupId:r.group_id?String(r.group_id):undefined,status:String(d.status??'OPEN'),summary:String(d.summary??''),openedAt:String(d.openedAt??''),openedBy:String(d.openedBy??'')};}).filter(x=>!['CLOSED','RESOLVED'].includes(x.status));
    const capabilitiesOut:ControlCapability[]=controlRows.results.filter(r=>r.item_type==='CAPABILITY').map(r=>{const d=JSON.parse(String(r.data_json??'{}')) as Record<string,unknown>;return{id:String(r.item_key),labelFr:String(d.labelFr??r.title),labelEn:String(d.labelEn??''),declaredStatus:String(d.declaredStatus??''),lot:String(d.lot??''),workspace:String(d.workspace??''),health:validHealth(String(d.health??'UNKNOWN')),healthNote:d.healthNote?String(d.healthNote):undefined,lastCheckedAt:d.lastCheckedAt?String(d.lastCheckedAt):undefined,updatedAt:String(r.updated_at)};}).sort((a,b)=>a.id.localeCompare(b.id));
    const items=(type:'CONTENT'|'INCIDENT'):ControlItem[]=>controlRows.results.filter(r=>r.item_type===type).map(r=>({id:String(r.id),type,key:String(r.item_key),title:String(r.title),status:String(r.status),priority:validPriority(String(r.priority)),data:JSON.parse(String(r.data_json??'{}')),createdAt:String(r.created_at),updatedAt:String(r.updated_at)}));
    return{generatedAt:now(),platform:{groups,memberships,workspaceRecords,openComplaints:complaints.length,audits},capabilities:capabilitiesOut,content:items('CONTENT'),incidents:items('INCIDENT'),complaints,supervisionRule:'CATALOG_AUTO_REGISTER'};
  }
}
