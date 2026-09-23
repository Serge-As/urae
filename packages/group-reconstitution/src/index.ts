import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Group,Id,Membership,WorkspaceRecord,CaseRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

const now=()=>new Date().toISOString();
const arr=(v:unknown):string[]=>{try{const x=JSON.parse(String(v??'[]'));return Array.isArray(x)?x.map(String):[];}catch{return[];}};
const clean=(v:unknown,n=2000)=>String(v??'').trim().slice(0,n);

export class GroupReconstitutionService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private async trash(trashId:Id){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,trashId);
    if(!r||r.moduleId!=='TRASH.ITEM'||String(r.data.kind)!=='GROUP')throw new Error('TRASH_ITEM_NOT_FOUND');
    return r;
  }
  private eligible(r:WorkspaceRecord,userId:Id){return arr(r.data.eligibleUserIdsJson).includes(userId);}
  private async signatures(r:WorkspaceRecord){
    const rows=await this.repo.listWorkspaceRecords(r.tenantId,'TRASH.PETITION_SIGNATURE',r.groupId);
    return rows.filter(x=>String(x.data.trashId)===r.id&&x.status!=='ARCHIVED');
  }
  async status(trashId:Id){
    const c=this.ctx(),r=await this.trash(trashId);if(!this.eligible(r,c.actorId)&&r.createdBy!==c.actorId&&String(r.data.deletedBy)!==c.actorId)throw new Error('FORBIDDEN_SCOPE');
    const signatures=await this.signatures(r),threshold=Number(r.data.petitionThreshold??0),count=signatures.length,reached=threshold>0&&count>=threshold;
    return{trashId:r.id,groupId:String(r.data.entityId??r.groupId??''),electorateCount:arr(r.data.eligibleUserIdsJson).length,threshold,signatureCount:count,reached,signedByMe:signatures.some(x=>x.createdBy===c.actorId),state:reached?'RECONSTITUTION_READY':String(r.data.petitionState??'OPEN'),successorGroupId:String(r.data.successorGroupId??'')||undefined};
  }
  async sign(trashId:Id){
    const c=this.ctx(),r=await this.trash(trashId);if(!this.eligible(r,c.actorId))throw new Error('PETITION_ELECTORATE_REQUIRED');
    if(String(r.data.lifecycleState)==='RESTORED')throw new Error('PETITION_CLOSED_BY_RESTORE');
    if(await this.repo.isGroupPurged(c.tenantId,String(r.data.entityId??r.groupId??'')))throw new Error('GROUP_ALREADY_PURGED');
    const id='petition_sig_'+encodeURIComponent(r.id+'|'+c.actorId),existing=await this.repo.getWorkspaceRecord(c.tenantId,id),at=now();
    if(!existing){const sig:WorkspaceRecord={id,tenantId:c.tenantId,groupId:r.groupId,moduleId:'TRASH.PETITION_SIGNATURE',title:'Signature de reconstitution',status:'DONE',tags:['petition','reconstitution','frozen-electorate'],data:{trashId:r.id,userId:c.actorId,signedAt:at},createdBy:c.actorId,createdAt:at,updatedAt:at};await this.repo.saveWorkspaceRecord(sig);}else if(existing.status==='ARCHIVED'){await this.repo.saveWorkspaceRecord({...existing,status:'DONE',data:{...existing.data,signedAt:at,withdrawnAt:''},updatedAt:at});}
    const signatures=await this.signatures(r),threshold=Number(r.data.petitionThreshold??0),reached=threshold>0&&signatures.length>=threshold,next={...r,data:{...r.data,petitionState:reached?'RECONSTITUTION_READY':'OPEN',petitionSignatureCount:signatures.length},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);
    return this.status(trashId);
  }
  async withdraw(trashId:Id){
    const c=this.ctx(),r=await this.trash(trashId),id='petition_sig_'+encodeURIComponent(r.id+'|'+c.actorId),sig=await this.repo.getWorkspaceRecord(c.tenantId,id);
    if(!sig) return this.status(trashId);
    // Workspace records are append/update oriented: withdrawal is explicit, not deletion.
    await this.repo.saveWorkspaceRecord({...sig,status:'ARCHIVED',data:{...sig.data,withdrawnAt:now()},updatedAt:now()});
    const active=await this.signatures(r),threshold=Number(r.data.petitionThreshold??0),reached=threshold>0&&active.length>=threshold;
    await this.repo.saveWorkspaceRecord({...r,data:{...r.data,petitionState:reached?'RECONSTITUTION_READY':'OPEN',petitionSignatureCount:active.length},updatedAt:now()});
    return this.status(trashId);
  }
  async createSuccessor(trashId:Id,input:{name?:string;purpose?:string}={}){
    const c=this.ctx(),r=await this.trash(trashId),state=await this.status(trashId);if(!state.reached)throw new Error('PETITION_THRESHOLD_NOT_REACHED');
    if(state.successorGroupId){const g=await this.repo.getGroup(c.tenantId,state.successorGroupId);if(g)return{group:g,alreadyCreated:true};}
    if(!this.eligible(r,c.actorId))throw new Error('PETITION_ELECTORATE_REQUIRED');
    const snapshot=JSON.parse(String(r.data.snapshotJson??'{}')) as Group;if(!snapshot.id)throw new Error('TRASH_SNAPSHOT_MISSING');
    const groupId=makeId('group_successor'),at=now(),group:Group={...snapshot,id:groupId,name:clean(input.name,240)||snapshot.name+' · reconstitué',status:'active',createdBy:c.actorId,createdAt:at,originMode:'NEW',historicalCreatedAt:snapshot.historicalCreatedAt??snapshot.createdAt,currentExerciseLabel:undefined};
    await this.repo.saveGroup(group);
    const signatures=(await this.signatures(r)).filter(x=>x.status!=='ARCHIVED'),signers=[...new Set(signatures.map(x=>x.createdBy))];
    for(const userId of signers){
      const membership:Membership={id:makeId('membership'),tenantId:c.tenantId,groupId,userId,roles:userId===c.actorId?['founder','manager']:['member'],status:'active',joinedAt:at};await this.repo.saveMembership(membership);
    }
    const [entries,receipts,obligations]=await Promise.all([this.repo.listLedgerEntries(c.tenantId,snapshot.id),this.repo.listContributionReceipts(c.tenantId,snapshot.id),this.repo.listObligations(c.tenantId)]);
    const dossier:WorkspaceRecord={id:makeId('succession_review'),tenantId:c.tenantId,groupId,moduleId:'SUCCESSION.REVIEW_DOSSIER',title:'Dossier de reconstitution à décider',status:'ACTIVE',tags:['succession','no-automatic-transfer'],data:{sourceTrashId:r.id,sourceGroupId:snapshot.id,capturedAt:at,ledgerEntryCount:entries.length,receiptCount:receipts.length,openObligationCount:obligations.filter(x=>x.groupId===snapshot.id&&(x.status==='open'||x.status==='overdue')).length,assetDebtDecisionState:'UNDECIDED_BY_SUCCESSOR',automaticTransfer:false,complaintAvailable:true,purpose:clean(input.purpose,1000)},createdBy:c.actorId,createdAt:at,updatedAt:at};await this.repo.saveWorkspaceRecord(dossier);
    await this.repo.saveWorkspaceRecord({...r,data:{...r.data,petitionState:'SUCCESSOR_CREATED',successorGroupId:group.id,successorReviewDossierId:dossier.id,successorCreatedAt:at},updatedAt:at});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'SUCCESSOR_GROUP_CREATED',targetType:'group',targetId:group.id,requestId:c.requestId,metadata:{sourceTrashId:r.id,signerCount:signers.length,automaticFinancialTransfer:false}}));
    return{group,dossier,signerCount:signers.length,automaticFinancialTransfer:false};
  }
  private async requireSuccessorManager(groupId:Id){
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');if(g.createdBy===c.actorId)return g;
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');if(!m||!m.roles.some(x=>['founder','manager','admin','president','treasurer'].includes(x)))throw new Error('FORBIDDEN_SCOPE');return g;
  }
  async recordDecision(groupId:Id,input:{decision:string;reason:string;nextAction?:string}){
    const c=this.ctx();await this.requireSuccessorManager(groupId);const decision=clean(input.decision,2000),reason=clean(input.reason,2000);if(!decision||!reason)throw new Error('SUCCESSION_DECISION_REQUIRED');
    const at=now(),r:WorkspaceRecord={id:makeId('succession_decision'),tenantId:c.tenantId,groupId,moduleId:'SUCCESSION.DECISION',title:'Décision du groupe successeur',status:'DONE',tags:['succession','decision','no-ledger-write'],data:{decision,reason,nextAction:clean(input.nextAction,1000),decidedAt:at,decidedBy:c.actorId,automaticLedgerWrite:false},createdBy:c.actorId,createdAt:at,updatedAt:at};await this.repo.saveWorkspaceRecord(r);return r;
  }
  async openDispute(groupId:Id,input:{reviewDossierId:Id;summary:string;evidenceRefs?:Id[]}){
    const c=this.ctx();await this.requireSuccessorManager(groupId);const dossier=await this.repo.getWorkspaceRecord(c.tenantId,input.reviewDossierId);if(!dossier||dossier.groupId!==groupId||dossier.moduleId!=='SUCCESSION.REVIEW_DOSSIER')throw new Error('SUCCESSION_DOSSIER_NOT_FOUND');
    const summary=clean(input.summary,2000);if(!summary)throw new Error('CASE_SUMMARY_REQUIRED');const at=now(),record:CaseRecord={id:makeId('case'),tenantId:c.tenantId,groupId,type:'SUCCESSOR_ASSET_DISPUTE',subjectType:'reconstitution_review',subjectId:dossier.id,status:'OPEN',openedBy:c.actorId,openedAt:at,summary};
    await this.repo.saveCase(record);await this.repo.saveWorkspaceRecord({...dossier,data:{...dossier.data,disputeOpen:true,disputeCaseId:record.id,evidenceRefsJson:JSON.stringify(input.evidenceRefs??[])},updatedAt:at});
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:c.tenantId,actorId:c.actorId,action:'SUCCESSOR_DISPUTE_OPENED',targetType:'case',targetId:record.id,requestId:c.requestId,metadata:{reviewDossierId:dossier.id,evidenceCount:(input.evidenceRefs??[]).length}}));return record;
  }
}
