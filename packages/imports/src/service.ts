import type {Id,Obligation} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {LedgerService} from '../../domain/src/index.js';
import type {CompletionRecord,CompletionSuiteService} from '../../completion/src/index.js';
import {parseCsvText,previewCsv} from '../../innovation/src/imports.js';
import type {ArtifactStoreLike} from './store.js';

export type HistoricalImportKind='CONTRIBUTIONS'|'OPENING_BALANCE'|'IDENTITY_CLAIMS'|'OBLIGATIONS';
const now=()=>new Date().toISOString();
const integer=(name:string,value:unknown,min=0)=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<min)throw Error('INVALID_'+name.toUpperCase());return n;};
const required=(name:string,value:unknown)=>{const v=String(value??'').trim();if(!v)throw Error(name.toUpperCase()+'_REQUIRED');return v;};

export class HistoricalImportService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel,public ledger:LedgerService,public completion:CompletionSuiteService,public artifacts?:ArtifactStoreLike){}
  private requiredHeaders(kind:HistoricalImportKind){
    if(kind==='CONTRIBUTIONS')return['membershipId','amount'];
    if(kind==='OPENING_BALANCE')return['amount','note'];
    if(kind==='IDENTITY_CLAIMS')return['historicalReference','evidenceReference'];
    return['membershipId','title','dueAt','amount'];
  }
  private async batch(groupId:Id,id:Id):Promise<CompletionRecord>{
    const row=(await this.completion.list(groupId,'IMPORT_BATCH')).find(x=>x.id===id);if(!row)throw Error('IMPORT_BATCH_NOT_FOUND');return row;
  }
  async stage(groupId:Id,input:{title:string;kind:HistoricalImportKind;text:string;delimiter?:string}){
    if(!this.artifacts)throw Error('R2_ARTIFACT_REQUIRED');
    const preview=await previewCsv(input.text,{delimiter:input.delimiter,requiredHeaders:this.requiredHeaders(input.kind)});
    const ctx=this.kernel.context.get(),key='imports/'+ctx.tenantId+'/'+groupId+'/'+preview.fingerprint+'.csv';
    await this.artifacts.put(key,input.text,{httpMetadata:{contentType:'text/csv; charset=utf-8'},customMetadata:{tenantId:ctx.tenantId,groupId,fingerprint:preview.fingerprint,kind:input.kind}});
    const batch=await this.completion.create(groupId,'IMPORT_BATCH',{title:required('title',input.title),data:{
      importKind:input.kind,fingerprint:preview.fingerprint,artifactKey:key,delimiter:preview.delimiter,headers:preview.headers,rowCount:preview.rowCount,
      issueCount:preview.issues.length,issues:preview.issues,approved:false,mapping:'{}',appliedCount:0
    }});
    return{batch,preview};
  }
  async approve(groupId:Id,id:Id,mapping:Record<string,string>={}){
    let batch=await this.batch(groupId,id);if(batch.data.completionState==='APPLIED')return batch;
    if(Number(batch.data.issueCount??0)!==0)throw Error('IMPORT_HAS_UNRESOLVED_ISSUES');
    const requiredHeaders=this.requiredHeaders(String(batch.data.importKind) as HistoricalImportKind);
    for(const logical of requiredHeaders){const source=(mapping[logical]??logical).trim();if(!source)throw Error('IMPORT_MAPPING_REQUIRED');}
    let version=Number(batch.data.completionVersion);
    if(batch.data.completionState==='UPLOADED'){batch=await this.completion.transition(groupId,id,'MAPPED',{expectedVersion:version,patch:{mapping}});version++;}
    if(batch.data.completionState==='MAPPED'){batch=await this.completion.transition(groupId,id,'REVIEWED',{expectedVersion:version});version++;}
    if(batch.data.completionState==='REVIEWED'){batch=await this.completion.transition(groupId,id,'APPROVED',{expectedVersion:version,patch:{approved:true,approvedAt:now()}});}
    return batch;
  }
  async apply(groupId:Id,id:Id){
    if(!this.artifacts)throw Error('R2_ARTIFACT_REQUIRED');
    let batch=await this.batch(groupId,id);if(batch.data.completionState==='APPLIED')return batch;
    if(batch.data.completionState!=='APPROVED'||batch.data.approved!==true)throw Error('IMPORT_NOT_APPROVED');
    const object=await this.artifacts.get(required('artifactKey',batch.data.artifactKey));if(!object)throw Error('IMPORT_ARTIFACT_MISSING');
    const raw=await object.text(),delimiter=String(batch.data.delimiter??';'),parsed=parseCsvText(raw,delimiter),headers=(parsed.shift()??[]).map(x=>x.trim());
    const mapping=JSON.parse(String(batch.data.mapping??'{}')) as Record<string,string>,kind=String(batch.data.importKind) as HistoricalImportKind;
    const value=(row:string[],logical:string)=>row[headers.indexOf(mapping[logical]??logical)]??'';
    let applied=0;
    for(let i=0;i<parsed.length;i++){
      const row=parsed[i]!,rowNumber=i+2,key='import:'+String(batch.data.fingerprint)+':'+rowNumber;
      if(kind==='CONTRIBUTIONS'){
        const membershipId=required('membershipId',value(row,'membershipId')),amount=integer('amount',value(row,'amount'),1);
        const effectiveAt=value(row,'effectiveAt').trim()||undefined;
        await this.ledger.recordCashContribution({tenantId:batch.tenantId,groupId,membershipId,amount,currency:value(row,'currency').trim()||'XAF',
          rubricId:value(row,'rubricId').trim()||undefined,effectiveAt,idempotencyKey:key});
      }else if(kind==='OPENING_BALANCE'){
        const amount=integer('amount',value(row,'amount'),1),note=required('note',value(row,'note')),effectiveAt=value(row,'effectiveAt').trim()||undefined;
        await this.ledger.recordCashMovement({tenantId:batch.tenantId,groupId,amount,currency:value(row,'currency').trim()||'XAF',direction:'in',
          counterAccountCode:'OPENING_EQUITY',counterAccountType:'equity',descriptionCode:'LEDGER_IMPORTED_OPENING_BALANCE',
          sourceType:'historical_import',sourceId:batch.id,idempotencyKey:key,kind:'opening_balance',effectiveAt});
      }else if(kind==='IDENTITY_CLAIMS'){
        const historicalReference=required('historicalReference',value(row,'historicalReference')),evidenceReference=required('evidenceReference',value(row,'evidenceReference'));
        const existing=(await this.completion.list(groupId,'IDENTITY_CLAIM')).find(x=>x.data.importRowKey===key);
        if(!existing)await this.completion.create(groupId,'IDENTITY_CLAIM',{title:'Historical identity '+rowNumber,data:{historicalReference,evidenceReference,
          claimedMembershipId:value(row,'claimedMembershipId').trim()||null,importRowKey:key,importBatchId:batch.id}});
      }else{
        const ctx=this.kernel.context.get(),membershipId=required('membershipId',value(row,'membershipId')),member=await this.repo.getMembership(ctx.tenantId,groupId,membershipId);
        if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
        const amount=integer('amount',value(row,'amount'),1),dueAt=required('dueAt',value(row,'dueAt'));if(!Number.isFinite(Date.parse(dueAt)))throw Error('INVALID_DUE_AT');
        const existing=(await this.repo.listObligations(ctx.tenantId)).find(o=>o.sourceType==='historical_import'&&o.sourceId===key);
        if(!existing){const obligation:Obligation={id:makeId('obligation'),tenantId:ctx.tenantId,groupId,assigneeId:member.userId,type:'EXPECTED_CONTRIBUTION',
          title:required('title',value(row,'title')),dueAt:new Date(dueAt).toISOString(),priority:'normal',status:'open',sourceType:'historical_import',sourceId:key,
          amount:{currency:value(row,'currency').trim()||'XAF',amount}};await this.repo.saveObligation(obligation);}
      }
      applied++;
    }
    batch=await this.batch(groupId,id);
    return this.completion.transition(groupId,id,'APPLIED',{expectedVersion:Number(batch.data.completionVersion),patch:{approved:true,issueCount:0,appliedCount:applied,appliedAt:now()}});
  }
}
