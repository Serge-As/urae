import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import {prepareDocumentReview,confirmDocumentReview} from './review.js';
export {prepareDocumentReview,confirmDocumentReview,documentNumbers,DOCUMENT_REVIEW_PROTOCOL} from './review.js';

export interface GroupDocumentInput{title:string;content?:string;artifactKey?:string;fingerprint?:string;kind?:string;source?:string;page?:string;reviewSourceText?:string;reviewConfirmation?:{numbersConfirmed:boolean;contentConfirmed:boolean};}
export interface GroupDocumentRecord{id:Id;groupId:Id;title:string;summary?:string;artifactKey?:string;fingerprint?:string;kind?:string;source?:string;page?:string;version:number;status:string;createdAt:string;updatedAt:string;createdBy:Id;}
const MODULE='GOVERNANCE.DOCUMENTS',MANAGERS=new Set(['founder','manager','admin','president','treasurer']);
const clean=(value:unknown,max=240)=>{const v=String(value??'').normalize('NFKC').trim();return v?v.slice(0,max):undefined;};
const parse=(r:WorkspaceRecord):GroupDocumentRecord=>({id:r.id,groupId:String(r.groupId??''),title:r.title,summary:r.summary,artifactKey:r.data.artifactKey?String(r.data.artifactKey):undefined,fingerprint:r.data.fingerprint?String(r.data.fingerprint):undefined,kind:r.data.kind?String(r.data.kind):undefined,source:r.data.source?String(r.data.source):undefined,page:r.data.page?String(r.data.page):undefined,version:Number(r.data.version??1),status:r.status,createdAt:r.createdAt,updatedAt:r.updatedAt,createdBy:r.createdBy});

export class GroupDocumentService{
  constructor(private repo:PlatformRepository,private kernel:PlatformKernel){}
  private async access(groupId:Id,manage=false):Promise<Membership|undefined>{const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');if(group.createdBy===ctx.actorId)return;const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');if(!member)throw Error('FORBIDDEN_SCOPE');if(manage&&!member.roles.some(r=>MANAGERS.has(r)))throw Error('FORBIDDEN_SCOPE');return member;}
  async list(groupId:Id){await this.access(groupId);const ctx=this.kernel.context.get();return (await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId)).filter(x=>x.status!=='ARCHIVED').map(parse).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async read(groupId:Id,id:Id){await this.access(groupId);const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!r||r.groupId!==groupId||r.moduleId!==MODULE||r.status==='ARCHIVED')throw Error('DOCUMENT_NOT_FOUND');return{id:r.id,title:r.title,content:String(r.data.content??''),version:Number(r.data.version??1),groupId,source:r.data.source??null,review:r.data.reviewJson?JSON.parse(String(r.data.reviewJson)):null};}
  async create(groupId:Id,input:GroupDocumentInput):Promise<GroupDocumentRecord>{
    await this.access(groupId,true);const ctx=this.kernel.context.get(),title=clean(input.title,180);if(!title)throw Error('DOCUMENT_TITLE_REQUIRED');
    const content=String(input.content??'').trim();if(content.length>120000)throw Error('DOCUMENT_REVIEW_TEXT_REQUIRED_OR_TOO_LARGE');
    let review:ReturnType<typeof confirmDocumentReview>|undefined;
    if(input.reviewSourceText!==undefined||input.reviewConfirmation!==undefined){const prepared=await prepareDocumentReview(input.reviewSourceText??'',content);review=confirmDocumentReview(prepared,input.reviewConfirmation?.numbersConfirmed===true,input.reviewConfirmation?.contentConfirmed===true);}
    const fingerprint=clean(input.fingerprint,128),existing=fingerprint?(await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId)).find(x=>x.status!=='ARCHIVED'&&x.data.fingerprint===fingerprint&&String(x.data.content??'')===content&&Boolean(x.data.humanReviewDeclared)===Boolean(review)):undefined;if(existing)return parse(existing);
    const stamp=new Date().toISOString(),id=makeId('document'),record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:MODULE,title,summary:content.slice(0,1000)||undefined,status:'ACTIVE',tags:['kind:DOCUMENT','group-document',input.kind?'format:'+String(input.kind).toLowerCase():'format:unknown'],data:{content,artifactKey:clean(input.artifactKey,500)??null,fingerprint:fingerprint??null,kind:clean(input.kind,40)??null,source:clean(input.source,240)??null,page:clean(input.page,40)??null,version:1,humanReviewDeclared:Boolean(review),reviewedTextHash:review?.reviewedTextHash??null,reviewJson:review?JSON.stringify({...review,reviewedAt:stamp,reviewedBy:ctx.actorId}):null},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};await this.repo.saveWorkspaceRecord(record);return parse(record);
  }
  async archive(groupId:Id,id:Id):Promise<GroupDocumentRecord>{await this.access(groupId,true);const ctx=this.kernel.context.get(),record=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!record||record.groupId!==groupId||record.moduleId!==MODULE)throw Error('DOCUMENT_NOT_FOUND');const updated:WorkspaceRecord={...record,status:'ARCHIVED',updatedAt:new Date().toISOString(),data:{...record.data,version:Number(record.data.version??1)+1}};await this.repo.saveWorkspaceRecord(updated);return parse(updated);}
}
