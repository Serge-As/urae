import type { PlatformRepository } from '../../repositories/src/index.js';
import { PlatformKernel } from '../../platform-kernel/src/index.js';
import { makeId, type WorkspaceRecord } from '../../contracts/src/index.js';

export type SafetyRiskKind='PYRAMID_PONZI'|'PHISHING'|'MISLEADING_RETURN'|'FAKE_GROUP'|'FAKE_SUPPLIER'|'SCAM'|'OTHER';
export type SafetySeverity='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type SafetyCaseState='SIGNAL'|'TRIAGED'|'RESTRICTED'|'CLEARED'|'CLOSED'|'APPEALED';

const text=(v:unknown,n=4000)=>String(v??'').trim().slice(0,n);
const fold=(v:unknown)=>text(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export interface SafetyAssessment{
  flagged:boolean;
  blocked:boolean;
  riskKind?:SafetyRiskKind;
  severity?:SafetySeverity;
  signals:string[];
  rationale:string[];
}

export class SafetyCenterService{
  constructor(private readonly repo:PlatformRepository,private readonly kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  assessText(value:string):SafetyAssessment{
    const v=fold(value),signals:string[]=[],rationale:string[]=[];
    const hit=(code:string,rx:RegExp,why:string)=>{if(rx.test(v)){signals.push(code);rationale.push(why);return true;}return false;};
    const phishing=hit('CREDENTIAL_OR_OTP_REQUEST',/(?:pin|mot de passe|password|otp|code secret).{0,30}(?:momo|mobile money|orange money|compte|account)|(?:envoie|send).{0,20}(?:pin|otp|code secret)/i,'Demande potentielle de secret, PIN ou code de validation.');
    const pyramid=hit('MULTI_LEVEL_RECRUITMENT',/(?:multi.?niveau|multilevel|multi.?level|downline|upline|filleul.*filleul|recrute.*recrute|commission.{0,25}recrut)/i,'Rémunération ou structure de recrutement à plusieurs niveaux détectée.');
    const guaranteed=hit('GUARANTEED_RETURN',/(?:rendement|benefice|profit|gain|return).{0,30}(?:garanti|garantie|guaranteed|sans risque|risk.?free)|(?:double|doubler|doublez).{0,25}(?:argent|mise|money)/i,'Promesse de rendement garanti ou de doublement de mise détectée.');
    const scam=hit('URGENT_PAYMENT_PRESSURE',/(?:urgent|vite|immediat|maintenant).{0,30}(?:paye|payer|verse|transfere|send money|payment)/i,'Pression inhabituelle pour un paiement immédiat.');
    if(phishing)return{flagged:true,blocked:true,riskKind:'PHISHING',severity:'CRITICAL',signals,rationale};
    if(pyramid)return{flagged:true,blocked:true,riskKind:'PYRAMID_PONZI',severity:'CRITICAL',signals,rationale};
    if(guaranteed)return{flagged:true,blocked:false,riskKind:'MISLEADING_RETURN',severity:'HIGH',signals,rationale};
    if(scam)return{flagged:true,blocked:false,riskKind:'SCAM',severity:'MEDIUM',signals,rationale};
    return{flagged:false,blocked:false,signals:[],rationale:[]};
  }
  async openCase(input:{title:string;summary:string;riskKind:SafetyRiskKind;severity:SafetySeverity;groupId?:string;entityType?:string;entityId?:string;evidenceRefs?:string[];signals?:string[];rationale?:string[]}):Promise<WorkspaceRecord>{
    const c=this.ctx(),now=new Date().toISOString(),id=makeId('safety_case');
    const record:WorkspaceRecord={id,tenantId:c.tenantId,groupId:input.groupId,moduleId:'SAFETY.CASE',title:text(input.title,240)||'Signal de sécurité',summary:text(input.summary,1200),status:'OPEN',tags:['safety-case','risk:'+input.riskKind.toLowerCase(),'severity:'+input.severity.toLowerCase()],data:{caseState:'SIGNAL',riskKind:input.riskKind,severity:input.severity,entityType:text(input.entityType,80),entityId:text(input.entityId,200),evidenceRefs:input.evidenceRefs??[],signals:input.signals??[],rationale:input.rationale??[],openedBy:c.actorId,openedAt:now,reviewHistory:[]},createdBy:c.actorId,createdAt:now,updatedAt:now};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  async screenAndOpen(input:{text:string;title?:string;groupId?:string;entityType?:string;entityId?:string;evidenceRefs?:string[]}):Promise<{assessment:SafetyAssessment;case?:WorkspaceRecord}>{
    const assessment=this.assessText(input.text);if(!assessment.flagged)return{assessment};
    const opened=await this.openCase({title:input.title??'Signal de sécurité détecté',summary:text(input.text,1200),riskKind:assessment.riskKind??'OTHER',severity:assessment.severity??'MEDIUM',groupId:input.groupId,entityType:input.entityType,entityId:input.entityId,evidenceRefs:input.evidenceRefs,signals:assessment.signals,rationale:assessment.rationale});
    return{assessment,case:opened};
  }
  async list(groupId?:string):Promise<WorkspaceRecord[]>{
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'SAFETY.CASE',groupId);return rows.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }
  async review(id:string,input:{decision:'TRIAGE'|'RESTRICT'|'CLEAR'|'CLOSE';note:string;evidenceRefs?:string[]}):Promise<WorkspaceRecord>{
    const c=this.ctx(),record=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!record||record.moduleId!=='SAFETY.CASE')throw Error('SAFETY_CASE_NOT_FOUND');
    const map={TRIAGE:'TRIAGED',RESTRICT:'RESTRICTED',CLEAR:'CLEARED',CLOSE:'CLOSED'} as const,state=map[input.decision],now=new Date().toISOString(),history=Array.isArray(record.data.reviewHistory)?record.data.reviewHistory as any[]:[];
    const next={...record,status:state==='CLOSED'||state==='CLEARED'?'DONE':'OPEN',summary:record.summary,updatedAt:now,data:{...record.data,caseState:state,reviewHistory:[...history,{at:now,by:c.actorId,decision:input.decision,note:text(input.note,1200),evidenceRefs:input.evidenceRefs??[]}]}};
    await this.repo.saveWorkspaceRecord(next);return next;
  }
  async appeal(id:string,note:string,evidenceRefs:string[]=[]):Promise<WorkspaceRecord>{
    const c=this.ctx(),record=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!record||record.moduleId!=='SAFETY.CASE')throw Error('SAFETY_CASE_NOT_FOUND');
    const now=new Date().toISOString(),history=Array.isArray(record.data.reviewHistory)?record.data.reviewHistory as any[]:[];
    const next={...record,status:'OPEN' as const,updatedAt:now,data:{...record.data,caseState:'APPEALED',reviewHistory:[...history,{at:now,by:c.actorId,decision:'APPEAL',note:text(note,1200),evidenceRefs}]}};
    await this.repo.saveWorkspaceRecord(next);return next;
  }
}
