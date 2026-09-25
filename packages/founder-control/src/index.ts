import type {D1DatabaseLike} from '../../repositories/src/index.js';

export type CapabilityHealth='UNKNOWN'|'PASS'|'DEGRADED'|'FAIL';
export interface ControlCapability {
  id:string; labelFr:string; labelEn:string; declaredStatus:string; lot:string; workspace:string;
  health:CapabilityHealth; healthNote?:string; lastCheckedAt?:string; updatedAt:string;
  monitoringState:'TO_CONFIGURE'|'ACTIVE'; codeStage:'SPECIFIED'|'IMPLEMENTED'; deploymentStage:'UNKNOWN'|'DEPLOYED'; fieldStage:'NOT_VERIFIED'|'FIELD_ACCEPTED';
}
export type IncidentStage='DETECTED'|'TRIAGED'|'CONTAINED'|'FIXED'|'VERIFIED'|'CLOSED';
export type KpiAvailability='OBSERVED'|'STALE'|'UNAVAILABLE';
export interface ControlItem {
  id:string; type:'CONTENT'|'INCIDENT'; key:string; title:string; status:string; priority:'LOW'|'NORMAL'|'HIGH'|'CRITICAL';
  data:Record<string,unknown>; createdAt:string; updatedAt:string;
}
export interface ControlKpi {
  id:string; key:string; title:string; source:string; formula:string; period:string;
  actual?:number; forecast?:number; asOf:string; freshness:string; right:string; proof:string;
  availability:KpiAvailability; updatedAt:string;
}
export interface FounderControlSnapshot {
  generatedAt:string;
  platform:{groups:number;memberships:number;workspaceRecords:number;openComplaints:number;audits:number};
  capabilities:ControlCapability[];
  content:ControlItem[];
  incidents:ControlItem[];
  kpis:ControlKpi[];
  complaints:Array<{id:string;tenantId?:string;groupId?:string;status:string;summary:string;openedAt:string;openedBy:string}>;
  supervisionRule:'CATALOG_AUTO_REGISTER';
}
const now=()=>new Date().toISOString();
const clean=(v:string,max=1000)=>v.trim().replace(/\s+/g,' ').slice(0,max);
const validPriority=(v:string):ControlItem['priority']=>['LOW','NORMAL','HIGH','CRITICAL'].includes(v)?v as ControlItem['priority']:'NORMAL';
const validHealth=(v:string):CapabilityHealth=>['UNKNOWN','PASS','DEGRADED','FAIL'].includes(v)?v as CapabilityHealth:'UNKNOWN';
const INCIDENT_FLOW:Record<string,IncidentStage[]>={
  DETECTED:['TRIAGED'],OPEN:['TRIAGED'],TRIAGED:['CONTAINED'],CONTAINED:['FIXED'],FIXED:['VERIFIED'],VERIFIED:['CLOSED'],CLOSED:[]
};
const validAvailability=(v:string):KpiAvailability=>['OBSERVED','STALE','UNAVAILABLE'].includes(v)?v as KpiAvailability:'UNAVAILABLE';
interface Row{[key:string]:unknown}

export class FounderControlStore{
  constructor(public db:D1DatabaseLike){}

  async isPlatformOwner(accountId:string):Promise<boolean>{
    if(!accountId)return false;
    const row=await this.db.prepare("SELECT account_id FROM platform_control_owners WHERE account_id=? LIMIT 1").bind(accountId).first<{account_id:string}>();
    return Boolean(row?.account_id);
  }

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
    return this.createItem('INCIDENT',input.key,input.title,'DETECTED',input.priority??'HIGH',{source:clean(input.source??'FOUNDER',160),note:clean(input.note??'',2000),detectedAt:now()});
  }

  async recordKpi(input:{key:string;title:string;source:string;formula:string;period:string;actual?:number;forecast?:number;asOf:string;freshness:string;right:string;proof:string;availability?:KpiAvailability}):Promise<ControlKpi>{
    const key=clean(input.key,180),title=clean(input.title,300),source=clean(input.source,500),formula=clean(input.formula,1000),period=clean(input.period,160),asOf=clean(input.asOf,80),freshness=clean(input.freshness,160),right=clean(input.right,300),proof=clean(input.proof,500),availability=validAvailability(input.availability??'OBSERVED');
    if(!key||!title||!source||!formula||!period||!asOf||!freshness||!right||!proof)throw new Error('KPI_CONTRACT_FIELDS_REQUIRED');
    if(!Number.isFinite(Date.parse(asOf)))throw new Error('KPI_ASOF_INVALID');
    if(input.actual!==undefined&&!Number.isFinite(input.actual))throw new Error('KPI_ACTUAL_INVALID');
    if(input.forecast!==undefined&&!Number.isFinite(input.forecast))throw new Error('KPI_FORECAST_INVALID');
    if(availability==='UNAVAILABLE'&&(input.actual!==undefined||input.forecast!==undefined))throw new Error('KPI_UNAVAILABLE_MUST_NOT_FAKE_ZERO');
    const stamp=now(),id='kpi:'+key,data={source,formula,period,actual:input.actual,forecast:input.forecast,asOf,freshness,right,proof,availability};
    await this.db.prepare("INSERT INTO founder_control_items(id,item_type,item_key,title,status,priority,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(item_type,item_key) DO UPDATE SET title=excluded.title,status=excluded.status,data_json=excluded.data_json,updated_at=excluded.updated_at")
      .bind(id,'KPI',key,title,availability,'NORMAL',JSON.stringify(data),stamp,stamp).run();
    return{id,key,title,...data,updatedAt:stamp};
  }

  async recordCapabilityProof(id:string,input:{deploymentStage?:'UNKNOWN'|'DEPLOYED';fieldStage?:'NOT_VERIFIED'|'FIELD_ACCEPTED';evidenceRef:string}):Promise<void>{
    const proof=clean(input.evidenceRef,500);if(!proof)throw new Error('CAPABILITY_PROOF_REQUIRED');
    const row=await this.db.prepare("SELECT data_json FROM founder_control_items WHERE item_type='CAPABILITY' AND item_key=?").bind(id).first<{data_json:string}>();
    if(!row)throw new Error('CONTROL_CAPABILITY_NOT_FOUND');
    const data=JSON.parse(row.data_json) as Record<string,unknown>,stamp=now();
    if(input.deploymentStage)data.deploymentStage=input.deploymentStage;
    if(input.fieldStage)data.fieldStage=input.fieldStage;
    data.stageEvidenceRef=proof;data.stageVerifiedAt=stamp;
    await this.db.prepare("UPDATE founder_control_items SET data_json=?,updated_at=? WHERE item_type='CAPABILITY' AND item_key=?").bind(JSON.stringify(data),stamp,id).run();
  }
  private async createItem(type:'CONTENT'|'INCIDENT',keyValue:string,titleValue:string,status:string,priority:string,data:Record<string,unknown>):Promise<ControlItem>{
    const key=clean(keyValue,180),title=clean(titleValue,300); if(!key||!title)throw new Error('CONTROL_ITEM_FIELDS_REQUIRED');
    const stamp=now(),id=(type==='CONTENT'?'content:':'incident:')+crypto.randomUUID(),p=validPriority(priority);
    await this.db.prepare("INSERT INTO founder_control_items(id,item_type,item_key,title,status,priority,data_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,type,key,title,clean(status,60),p,JSON.stringify(data),stamp,stamp).run();
    return{id,type,key,title,status:clean(status,60),priority:p,data,createdAt:stamp,updatedAt:stamp};
  }
  async transition(id:string,status:string,note='',evidenceRef=''):Promise<ControlItem>{
    const row=await this.db.prepare("SELECT * FROM founder_control_items WHERE id=? AND item_type IN ('CONTENT','INCIDENT')").bind(id).first<Row>();
    if(!row)throw new Error('CONTROL_ITEM_NOT_FOUND');
    const nextStatus=clean(status,60),transitionNote=clean(note,2000),proof=clean(evidenceRef,500),itemType=String(row.item_type),currentStatus=String(row.status);
    if(itemType==='INCIDENT'){
      const allowed=INCIDENT_FLOW[currentStatus]??[];
      if(!allowed.includes(nextStatus as IncidentStage))throw new Error('INCIDENT_STAGE_TRANSITION_INVALID:'+currentStatus+'->'+nextStatus);
      if(['VERIFIED','CLOSED'].includes(nextStatus)&&(!transitionNote||!proof))throw new Error('INCIDENT_EVIDENCE_REQUIRED');
    }else if(['RESOLVED','CLOSED'].includes(nextStatus)&&(!transitionNote||!proof))throw new Error('RESOLUTION_EVIDENCE_REQUIRED');
    const data=JSON.parse(String(row.data_json??'{}')) as Record<string,unknown>; data.transitionNote=transitionNote; data.transitionedAt=now();if(proof)data.resolutionEvidenceRef=proof;
    if(itemType==='INCIDENT')data.incidentStage=nextStatus;
    const stamp=now(); await this.db.prepare("UPDATE founder_control_items SET status=?,data_json=?,updated_at=? WHERE id=?").bind(nextStatus,JSON.stringify(data),stamp,id).run();
    return{id:String(row.id),type:itemType as 'CONTENT'|'INCIDENT',key:String(row.item_key),title:String(row.title),status:nextStatus,priority:validPriority(String(row.priority)),data,createdAt:String(row.created_at),updatedAt:stamp};
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
    const capabilitiesOut:ControlCapability[]=controlRows.results.filter(r=>r.item_type==='CAPABILITY').map(r=>{const d=JSON.parse(String(r.data_json??'{}')) as Record<string,unknown>;const health=validHealth(String(d.health??'UNKNOWN')),declaredStatus=String(d.declaredStatus??'');return{id:String(r.item_key),labelFr:String(d.labelFr??r.title),labelEn:String(d.labelEn??''),declaredStatus,lot:String(d.lot??''),workspace:String(d.workspace??''),health,healthNote:d.healthNote?String(d.healthNote):undefined,lastCheckedAt:d.lastCheckedAt?String(d.lastCheckedAt):undefined,updatedAt:String(r.updated_at),monitoringState:(health==='UNKNOWN'?'TO_CONFIGURE':'ACTIVE') as 'TO_CONFIGURE'|'ACTIVE',codeStage:(['FOUNDATION_ACTIVE','STRUCTURAL_V1'].includes(declaredStatus)?'IMPLEMENTED':'SPECIFIED') as 'SPECIFIED'|'IMPLEMENTED',deploymentStage:(String(d.deploymentStage??'UNKNOWN')==='DEPLOYED'?'DEPLOYED':'UNKNOWN') as 'UNKNOWN'|'DEPLOYED',fieldStage:(String(d.fieldStage??'NOT_VERIFIED')==='FIELD_ACCEPTED'?'FIELD_ACCEPTED':'NOT_VERIFIED') as 'NOT_VERIFIED'|'FIELD_ACCEPTED'};}).sort((a,b)=>a.id.localeCompare(b.id));
    const items=(type:'CONTENT'|'INCIDENT'):ControlItem[]=>controlRows.results.filter(r=>r.item_type===type).map(r=>({id:String(r.id),type,key:String(r.item_key),title:String(r.title),status:String(r.status),priority:validPriority(String(r.priority)),data:JSON.parse(String(r.data_json??'{}')),createdAt:String(r.created_at),updatedAt:String(r.updated_at)}));
    const kpis:ControlKpi[]=controlRows.results.filter(r=>r.item_type==='KPI').map(r=>{const d=JSON.parse(String(r.data_json??'{}')) as Record<string,unknown>;return{id:String(r.id),key:String(r.item_key),title:String(r.title),source:String(d.source??''),formula:String(d.formula??''),period:String(d.period??''),actual:d.actual===undefined?undefined:Number(d.actual),forecast:d.forecast===undefined?undefined:Number(d.forecast),asOf:String(d.asOf??''),freshness:String(d.freshness??''),right:String(d.right??''),proof:String(d.proof??''),availability:validAvailability(String(d.availability??r.status)),updatedAt:String(r.updated_at)};});
    return{generatedAt:now(),platform:{groups,memberships,workspaceRecords,openComplaints:complaints.length,audits},capabilities:capabilitiesOut,content:items('CONTENT'),incidents:items('INCIDENT'),kpis,complaints,supervisionRule:'CATALOG_AUTO_REGISTER'};
  }
}
