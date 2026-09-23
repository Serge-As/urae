import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export type SafetySignalCode=
  |'GUARANTEED_RETURN'|'HIGH_RETURN'|'RECRUITMENT_DEPENDENCE'|'NEW_DEPOSIT_DEPENDENCE'
  |'PIN_OTP_REQUEST'|'SECRET_KEY_REQUEST'|'ADVANCE_FEE'|'URGENCY_PRESSURE'
  |'UNVERIFIED_SUPPLIER'|'IDENTITY_MISMATCH'|'REUSED_EVIDENCE'|'SELF_REFERRAL'
  |'MULTI_LEVEL_RECRUITMENT'|'HIDDEN_MEMBER_FUNDING'|'INSUFFICIENT_DOCUMENTED_RESOURCES';
export type SafetySeverity='INFO'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type SafetyCaseState='DETECTED'|'TRIAGED'|'INVESTIGATING'|'ACTIONED'|'APPEALED'|'RESOLVED';
export type SafetyRestriction='NONE'|'WARN'|'LIMIT_VISIBILITY'|'PAUSE_CAMPAIGN'|'REQUIRE_REVIEW';

export interface SafetySignal{
  code:SafetySignalCode;severity:SafetySeverity;reason:string;evidence:string;
}
export interface SafetyAnalysis{
  signals:SafetySignal[];
  highestSeverity:SafetySeverity;
  questions:string[];
  legalVerdict:false;
  automaticFraudVerdict:false;
}

const MODULE='SAFETY.ANTISCAM';
const managers=new Set(['founder','manager','admin','president','treasurer','auditor']);
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=3000)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const normalize=(v:unknown)=>clean(v,12000).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const severityRank:Record<SafetySeverity,number>={INFO:0,LOW:1,MEDIUM:2,HIGH:3,CRITICAL:4};
const maxSeverity=(signals:SafetySignal[]):SafetySeverity=>signals.reduce((best,s)=>severityRank[s.severity]>severityRank[best]?s.severity:best,'INFO' as SafetySeverity);
const signal=(code:SafetySignalCode,severity:SafetySeverity,reason:string,evidence:string):SafetySignal=>({code,severity,reason,evidence:clean(evidence,500)});

export class SafetyService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async access(groupId?:Id,manage=false){
    if(!groupId)return;
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');
    if(g.createdBy===c.actorId)return;
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    if(!m||manage&&!m.roles.some(r=>managers.has(r)))throw new Error('FORBIDDEN_SCOPE');
  }
  private async record(title:string,kind:string,data:Record<string,string|number|boolean|null>,groupId?:Id,status:WorkspaceRecord['status']='ACTIVE',tags:string[]=[]){
    const c=this.ctx(),stamp=now(),r:WorkspaceRecord={id:makeId('safety'),tenantId:c.tenantId,groupId,moduleId:MODULE,title:clean(title,240)||'Dossier sécurité',status,tags:['safety',kind,...tags],data:{kind,...data},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(r);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'SAFETY_RECORD_CREATED',targetType:'safety_record',targetId:r.id,requestId:c.requestId,metadata:{kind,groupId:groupId??'',moduleId:MODULE}}));
    return r;
  }
  analyze(input:{
    text?:string;mechanism?:string;evidenceRef?:string;promisedRatePercent?:number;
    promisedTotal?:number;documentedResources?:number;newDeposits?:number;
    multiLevel?:boolean;recruitmentReward?:boolean;fundedByMemberContributions?:boolean;
    supplierVerified?:boolean;identityVerified?:boolean;
  }):SafetyAnalysis{
    const body=normalize([input.text,input.mechanism].filter(Boolean).join(' ')),signals:SafetySignal[]=[];
    const rate=Number(input.promisedRatePercent??0),promised=Number(input.promisedTotal??0),documented=Number(input.documentedResources??0),newDeposits=Number(input.newDeposits??0);
    if(/garanti|guaranteed|sans risque|zero risque|0 risque|aucune perte|no loss/.test(body))signals.push(signal('GUARANTEED_RETURN','HIGH','Une promesse de rendement garanti ou sans risque doit être vérifiée et contextualisée.',body.match(/.{0,45}(garanti|guaranteed|sans risque|aucune perte|no loss).{0,45}/)?.[0]??'promesse détectée'));
    if(rate>=20)signals.push(signal('HIGH_RETURN',rate>=50?'HIGH':'MEDIUM','Le rendement saisi est élevé et nécessite des preuves économiques et une explication des risques.',String(rate)+' %'));
    if(input.multiLevel===true||/niveau[xs]?|downline|upline|chaine de parrainage|multi.?level|mlm/.test(body))signals.push(signal('MULTI_LEVEL_RECRUITMENT','CRITICAL','La rémunération de plusieurs niveaux de recrutement n’est pas admise par le garde-fou Eco-System.','structure multi-niveaux'));
    if(input.recruitmentReward===true&&/recrut|parrain|filleul|referral/.test(body))signals.push(signal('RECRUITMENT_DEPENDENCE','HIGH','Le modèle semble dépendre du recrutement ; vérifier la source économique réelle du paiement.','recrutement rémunéré'));
    if(input.fundedByMemberContributions===true)signals.push(signal('HIDDEN_MEMBER_FUNDING','CRITICAL','Un mécanisme de récompense ne doit pas être financé secrètement par les cotisations ou l’épargne des membres.','fonds membres'));
    if(/pin|otp|code secret|mot de passe momo|mobile money pin/.test(body))signals.push(signal('PIN_OTP_REQUEST','CRITICAL','Aucun opérateur, fournisseur ou campagne ne doit demander un PIN/OTP de paiement.','PIN/OTP'));
    if(/seed phrase|phrase secrete|cle privee|private key/.test(body))signals.push(signal('SECRET_KEY_REQUEST','CRITICAL','Une phrase secrète ou clé privée ne doit jamais être demandée.', 'secret cryptographique'));
    if(/frais d.activation|payer d.abord|advance fee|frais de deblocage|debloquer.*paiement/.test(body))signals.push(signal('ADVANCE_FEE','HIGH','Un paiement préalable présenté comme condition de déblocage doit être vérifié.', 'frais préalable'));
    if(/urgent|maintenant ou jamais|derniere chance|vite|immediatement/.test(body))signals.push(signal('URGENCY_PRESSURE','MEDIUM','La pression temporelle peut empêcher une vérification correcte ; demander une preuve et du temps de revue.','pression temporelle'));
    if(promised>0&&documented>=0&&promised>documented){
      signals.push(signal('INSUFFICIENT_DOCUMENTED_RESOURCES',promised>documented*2?'HIGH':'MEDIUM','Les ressources documentées ne couvrent pas la valeur promise ; l’écart doit être expliqué par une activité vérifiable.',String(Math.round(promised-documented))+' XAF'));
      if(newDeposits>0)signals.push(signal('NEW_DEPOSIT_DEPENDENCE','HIGH','Les nouveaux dépôts réduisent l’écart financier ; vérifier qu’ils financent une activité réelle plutôt que des promesses antérieures.',String(Math.round(newDeposits))+' XAF'));
    }
    if(input.supplierVerified===false)signals.push(signal('UNVERIFIED_SUPPLIER','MEDIUM','Le fournisseur n’a pas encore de preuve de vérification suffisante.','fournisseur non vérifié'));
    if(input.identityVerified===false)signals.push(signal('IDENTITY_MISMATCH','MEDIUM','L’identité ou le mandat présenté doit être confirmé avant d’accorder un badge ou un accès sensible.','identité/mandat non confirmé'));
    const questions=[
      'Quelle activité économique réelle finance la promesse ou la récompense ?',
      'Quelles preuves indépendantes et datées permettent de vérifier les revenus, livraisons ou autorisations ?',
      'Qui porte le risque de perte et dans quelles conditions les retraits/remboursements sont-ils possibles ?',
      'Le paiement dépend-il de nouveaux entrants, de cotisations membres ou d’une chaîne de recrutement ?'
    ];
    return{signals,highestSeverity:maxSeverity(signals),questions,legalVerdict:false,automaticFraudVerdict:false};
  }

  async financialLab(input:{
    groupId?:Id;title:string;participants:number;deposit:number;ratePercent:number;months:number;documentedRevenue:number;newDeposits:number;mode:'COMPOUND'|'SIMPLE';mechanism?:string;evidenceRef?:string;
  }){
    await this.access(input.groupId,false);
    const participants=Math.max(1,Math.trunc(Number(input.participants))),deposit=Math.max(0,Number(input.deposit)),months=Math.max(1,Math.trunc(Number(input.months))),rate=Math.max(0,Number(input.ratePercent))/100;
    if(!Number.isFinite(participants)||!Number.isFinite(deposit)||!Number.isFinite(months)||!Number.isFinite(rate))throw new Error('INVALID_FINANCIAL_LAB_INPUT');
    const initial=participants*deposit,promisedPerPerson=input.mode==='SIMPLE'?deposit*(1+rate*months):deposit*Math.pow(1+rate,months),promisedTotal=promisedPerPerson*participants,documentedResources=initial+Math.max(0,Number(input.documentedRevenue))*months,resourcesIncludingNewDeposits=documentedResources+Math.max(0,Number(input.newDeposits))*months,gapWithoutNew=Math.max(0,promisedTotal-documentedResources),gapWithNew=Math.max(0,promisedTotal-resourcesIncludingNewDeposits);
    const analysis=this.analyze({text:input.title,mechanism:input.mechanism,promisedRatePercent:input.ratePercent,promisedTotal,documentedResources,newDeposits:Math.max(0,Number(input.newDeposits))*months});
    const record=await this.record(input.title,'FINANCIAL_LAB_ANALYSIS',{participants,deposit,ratePercent:Number(input.ratePercent),months,documentedRevenue:Number(input.documentedRevenue),newDeposits:Number(input.newDeposits),mode:input.mode,initial:Math.round(initial),promisedTotal:Math.round(promisedTotal),documentedResources:Math.round(documentedResources),resourcesIncludingNewDeposits:Math.round(resourcesIncludingNewDeposits),gapWithoutNew:Math.round(gapWithoutNew),gapWithNew:Math.round(gapWithNew),mechanism:clean(input.mechanism,3000),evidenceRef:clean(input.evidenceRef,1000),highestSeverity:analysis.highestSeverity,signalsJson:JSON.stringify(analysis.signals),questionsJson:JSON.stringify(analysis.questions),legalVerdict:false,automaticFraudVerdict:false,realMoney:false},input.groupId,'DONE',['financial-lab-analysis','educational','not-legal-verdict']);
    return{record,analysis,figures:{initial,promisedTotal,documentedResources,resourcesIncludingNewDeposits,gapWithoutNew,gapWithNew}};
  }

  async report(input:{groupId?:Id;title:string;targetType:string;targetId?:string;summary:string;evidenceRef?:string;channel?:string;contextText?:string}){
    await this.access(input.groupId,false);const analysis=this.analyze({text:[input.summary,input.contextText].filter(Boolean).join(' ')});
    const report=await this.record(input.title,'REPORT',{targetType:clean(input.targetType,100),targetId:clean(input.targetId,240),summary:clean(input.summary,3000),evidenceRef:clean(input.evidenceRef,1000),channel:clean(input.channel,100),signalsJson:JSON.stringify(analysis.signals),highestSeverity:analysis.highestSeverity,reportState:'SUBMITTED',publicAccusation:false},input.groupId,'ACTIVE',['report','private']);
    const c=this.ctx(),caseId=makeId('safetycase'),stamp=now(),caseRecord:WorkspaceRecord={id:caseId,tenantId:c.tenantId,groupId:input.groupId,moduleId:MODULE,title:'Dossier · '+clean(input.title,220),summary:clean(input.summary,500),status:'ACTIVE',tags:['safety','case','state:DETECTED','private'],data:{kind:'CASE',state:'DETECTED',reportId:report.id,targetType:clean(input.targetType,100),targetId:clean(input.targetId,240),highestSeverity:analysis.highestSeverity,restriction:'NONE',signalsJson:JSON.stringify(analysis.signals),publicAccusation:false,reviewNote:'',appealCount:0},createdBy:c.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(caseRecord);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'SAFETY_CASE_OPENED',targetType:'safety_case',targetId:caseId,requestId:c.requestId,metadata:{reportId:report.id,highestSeverity:analysis.highestSeverity}}));
    return{report,case:caseRecord,analysis};
  }

  async cases(groupId?:Id){
    await this.access(groupId,false);const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,MODULE,groupId);
    return rows.filter(x=>x.tags.includes('case')).filter(x=>{
      if(groupId)return true;
      return x.createdBy===c.actorId;
    }).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async analyses(groupId?:Id){
    await this.access(groupId,false);const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,MODULE,groupId);
    return rows.filter(x=>x.tags.includes('financial-lab-analysis')).filter(x=>groupId||x.createdBy===c.actorId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }
  async review(caseId:Id,input:{state:Extract<SafetyCaseState,'TRIAGED'|'INVESTIGATING'|'ACTIONED'|'RESOLVED'>;restriction?:SafetyRestriction;note:string;evidenceRef?:string}){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,caseId);if(!r||r.moduleId!==MODULE||!r.tags.includes('case'))throw new Error('SAFETY_CASE_NOT_FOUND');
    await this.access(r.groupId,true);const state=String(r.data.state??'DETECTED') as SafetyCaseState,allowed:Record<SafetyCaseState,SafetyCaseState[]>={DETECTED:['TRIAGED','RESOLVED'],TRIAGED:['INVESTIGATING','ACTIONED','RESOLVED'],INVESTIGATING:['ACTIONED','RESOLVED'],ACTIONED:['RESOLVED'],APPEALED:['INVESTIGATING','ACTIONED','RESOLVED'],RESOLVED:['INVESTIGATING']};
    if(!allowed[state]?.includes(input.state))throw new Error('INVALID_SAFETY_CASE_TRANSITION');
    const note=clean(input.note,3000);if(!note)throw new Error('SAFETY_REVIEW_NOTE_REQUIRED');
    if(['ACTIONED','RESOLVED'].includes(input.state)&&!clean(input.evidenceRef,1000))throw new Error('SAFETY_REVIEW_EVIDENCE_REQUIRED');
    const restriction=input.restriction??String(r.data.restriction??'NONE') as SafetyRestriction;
    if(!['NONE','WARN','LIMIT_VISIBILITY','PAUSE_CAMPAIGN','REQUIRE_REVIEW'].includes(restriction))throw new Error('INVALID_SAFETY_RESTRICTION');
    const next={...r,status:input.state==='RESOLVED'?'DONE' as const:'ACTIVE' as const,tags:[...r.tags.filter(x=>!x.startsWith('state:')),'state:'+input.state],data:{...r.data,state:input.state,restriction,reviewNote:note,reviewEvidenceRef:clean(input.evidenceRef,1000),reviewedBy:c.actorId,reviewedAt:now()},updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'SAFETY_CASE_REVIEWED',targetType:'safety_case',targetId:caseId,requestId:c.requestId,metadata:{from:state,to:input.state,restriction,evidenceRef:clean(input.evidenceRef,1000)}}));return next;
  }
  async appeal(caseId:Id,summary:string){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,caseId);if(!r||r.moduleId!==MODULE||!r.tags.includes('case'))throw new Error('SAFETY_CASE_NOT_FOUND');
    await this.access(r.groupId,false);const text=clean(summary,3000);if(!text)throw new Error('APPEAL_SUMMARY_REQUIRED');
    const appeal=await this.record('Recours · '+r.title,'APPEAL',{caseId:r.id,summary:text,appealState:'OPEN'},r.groupId,'ACTIVE',['appeal','private']);
    const next={...r,status:'ACTIVE' as const,tags:[...r.tags.filter(x=>!x.startsWith('state:')),'state:APPEALED'],data:{...r.data,state:'APPEALED',appealCount:Number(r.data.appealCount??0)+1,lastAppealId:appeal.id},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return{appeal,case:next};
  }
}
