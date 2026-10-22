import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import {PRODUCT_MODULES} from '../../module-registry/src/index.js';
import * as practice from './practice.js';
import * as solutions from './forum-solutions.js';

export type KnowledgeKind='OBSERVATION'|'HYPOTHESIS'|'VALIDATED_RULE'|'CASE'|'EXTERNAL_SOURCE'|'PRODUCT_MEMORY';
export type KnowledgeState='DRAFT'|'IN_REVIEW'|'VALIDATED'|'TO_REVALIDATE'|'SUPERSEDED'|'RETIRED';
export type KnowledgeSensitivity='PUBLIC'|'GROUP'|'PRIVATE';
const now=()=>new Date().toISOString();
const clean=(v:unknown,n=2000)=>String(v??'').trim().slice(0,n);
const toks=(v:string)=>v.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const managers=new Set(['founder','manager','admin','president','treasurer','secretary','auditor']);

export class KnowledgeAcademyService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  createPractice(input:Parameters<typeof practice.createPractice>[2]){return practice.createPractice(this.repo,this.kernel,input);}
  practices(){return practice.practices(this.repo,this.kernel);}
  practice(id:string){return practice.readPractice(this.repo,this.kernel,id);}
  updatePractice(id:string,input:Parameters<typeof practice.updatePractice>[3]){return practice.updatePractice(this.repo,this.kernel,id,input);}
  createForumSolution(input:solutions.SolutionInput,load:solutions.SourceLoader){return solutions.createForumSolution(this.repo,this.kernel,input,load);}
  forumSolutions(groupId:string,load:solutions.SourceLoader){return solutions.forumSolutions(this.repo,this.kernel,groupId,load);}
  reviewForumSolution(id:string,input:Parameters<typeof solutions.reviewForumSolution>[3],load:solutions.SourceLoader){return solutions.reviewForumSolution(this.repo,this.kernel,id,input,load);}
  private ctx(){return this.kernel.context.get();}
  private async groupMembership(groupId:Id){
    const c=this.ctx(),g=await this.repo.getGroup(c.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');
    if(g.createdBy===c.actorId)return{group:g,manager:true,member:true};
    const m=(await this.repo.listMemberships(c.tenantId,groupId)).find(x=>x.userId===c.actorId&&x.status==='active');
    return{group:g,manager:Boolean(m?.roles.some(r=>managers.has(r))),member:Boolean(m)};
  }
  private async canManageGroup(groupId?:Id){if(!groupId)return true;const a=await this.groupMembership(groupId);if(!a.manager)throw new Error('FORBIDDEN_SCOPE');return true;}
  private async canReadGroup(groupId?:Id){if(!groupId)return true;const a=await this.groupMembership(groupId);if(!a.member)throw new Error('FORBIDDEN_SCOPE');return true;}
  private async save(moduleId:string,title:string,data:Record<string,string|number|boolean|null>,groupId?:Id,status:WorkspaceRecord['status']='ACTIVE',tags:string[]=[]){
    const c=this.ctx(),at=now(),r:WorkspaceRecord={id:makeId('know'),tenantId:c.tenantId,groupId,moduleId,title,status,tags,data,createdBy:c.actorId,createdAt:at,updatedAt:at};await this.repo.saveWorkspaceRecord(r);return r;
  }

  async createKnowledge(input:{title:string;kind:KnowledgeKind;body:string;groupId?:Id;sourceRef?:string;validFrom?:string;validUntil?:string;nextReviewAt?:string;sensitivity?:KnowledgeSensitivity;consentScope?:string;tags?:string[]}){
    await this.canManageGroup(input.groupId);const title=clean(input.title,240),body=clean(input.body,12000);if(!title||!body)throw new Error('KNOWLEDGE_CONTENT_REQUIRED');
    for(const [name,value] of [['VALID_FROM',input.validFrom],['VALID_UNTIL',input.validUntil],['NEXT_REVIEW_AT',input.nextReviewAt]] as const)if(value&&!Number.isFinite(Date.parse(value)))throw new Error('INVALID_'+name);
    if(input.validFrom&&input.validUntil&&Date.parse(input.validUntil)<=Date.parse(input.validFrom))throw new Error('INVALID_KNOWLEDGE_VALIDITY');
    const sensitivity=input.sensitivity??(input.groupId?'GROUP':'PRIVATE');if(!['PUBLIC','GROUP','PRIVATE'].includes(sensitivity))throw new Error('INVALID_KNOWLEDGE_SENSITIVITY');
    if(sensitivity==='PUBLIC'&&input.groupId)throw new Error('GROUP_KNOWLEDGE_CANNOT_BE_PUBLIC_AUTOMATICALLY');
    const itemId=makeId('knowledge_item');
    return this.save('LEARNING.KNOWLEDGE_BANK',title,{
      knowledgeItemId:itemId,kind:input.kind,body,sourceRef:clean(input.sourceRef,500),validFrom:input.validFrom??now(),validUntil:input.validUntil??'',nextReviewAt:input.nextReviewAt??'',
      sensitivity,consentScope:clean(input.consentScope,500),knowledgeState:'DRAFT',version:1,previousId:'',supersedes:'',reviewedBy:'',reviewedAt:'',revisionReason:''
    },input.groupId,'ACTIVE',['knowledge','item:'+itemId,...(input.tags??[]).map(x=>x.trim().toLowerCase()).filter(Boolean)]);
  }

  async reviseKnowledge(id:Id,input:{body:string;sourceRef?:string;reason:string;validFrom?:string;validUntil?:string;nextReviewAt?:string}){
    const c=this.ctx(),old=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!old||old.moduleId!=='LEARNING.KNOWLEDGE_BANK')throw new Error('KNOWLEDGE_NOT_FOUND');
    if(old.tags.includes('governed-productive'))throw Error('CANONICAL_SOLUTION_ROUTE_REQUIRED');
    await this.canManageGroup(old.groupId);const body=clean(input.body,12000),reason=clean(input.reason,500);if(!body||!reason)throw new Error('REVISION_REASON_REQUIRED');
    for(const value of [input.validFrom,input.validUntil,input.nextReviewAt])if(value&&!Number.isFinite(Date.parse(value)))throw new Error('INVALID_KNOWLEDGE_DATE');
    const itemId=String(old.data.knowledgeItemId??old.id),next=await this.save('LEARNING.KNOWLEDGE_BANK',old.title,{
      ...old.data,knowledgeItemId:itemId,body,sourceRef:clean(input.sourceRef??old.data.sourceRef,500),validFrom:input.validFrom??now(),validUntil:input.validUntil??String(old.data.validUntil??''),
      nextReviewAt:input.nextReviewAt??String(old.data.nextReviewAt??''),knowledgeState:'DRAFT',version:Number(old.data.version??1)+1,previousId:old.id,supersedes:old.id,revisionReason:reason,reviewedBy:'',reviewedAt:''
    },old.groupId,'ACTIVE',[...old.tags.filter(x=>!x.startsWith('item:')),'item:'+itemId]);
    await this.repo.saveWorkspaceRecord({...old,status:'ARCHIVED',data:{...old.data,knowledgeState:'SUPERSEDED',supersededBy:next.id},updatedAt:now()});return next;
  }

  async reviewKnowledge(id:Id,state:'VALIDATED'|'TO_REVALIDATE',note=''){
    const c=this.ctx(),r=await this.repo.getWorkspaceRecord(c.tenantId,id);if(!r||r.moduleId!=='LEARNING.KNOWLEDGE_BANK')throw new Error('KNOWLEDGE_NOT_FOUND');await this.canManageGroup(r.groupId);
    if(r.tags.includes('governed-productive'))throw Error('CANONICAL_SOLUTION_ROUTE_REQUIRED');
    if(String(r.data.knowledgeState)==='SUPERSEDED'||r.status==='ARCHIVED')throw new Error('KNOWLEDGE_VERSION_NOT_REVIEWABLE');
    if(state==='VALIDATED'&&r.data.validUntil&&Date.parse(String(r.data.validUntil))<=Date.now())throw new Error('KNOWLEDGE_ALREADY_EXPIRED');
    const next={...r,data:{...r.data,knowledgeState:state,reviewedBy:c.actorId,reviewedAt:now(),reviewNote:clean(note,800)},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }

  async searchKnowledge(q:string,groupId?:Id){
    const c=this.ctx();if(groupId)await this.canReadGroup(groupId);
    const query=toks(q),rows=(await this.repo.listWorkspaceRecords(c.tenantId,'LEARNING.KNOWLEDGE_BANK')).filter(x=>!x.tags.includes('governed-productive')&&x.status!=='ARCHIVED'&&String(x.data.knowledgeState)!=='SUPERSEDED'&&String(x.data.knowledgeState)!=='RETIRED');
    const scoped=rows.filter(r=>{
      const sensitivity=String(r.data.sensitivity??(r.groupId?'GROUP':'PRIVATE'));
      if(sensitivity==='PRIVATE')return r.createdBy===c.actorId;
      if(r.groupId)return groupId===r.groupId;
      return true;
    });
    return scoped.filter(r=>{const h=toks([r.title,String(r.data.body??''),String(r.data.sourceRef??''),...r.tags].join(' '));return !query.length||query.every(t=>h.some(x=>x.includes(t)));})
      .map((r):WorkspaceRecord=>{
        const expired=Boolean(r.data.validUntil&&Date.parse(String(r.data.validUntil))<=Date.now()),reviewDue=Boolean(r.data.nextReviewAt&&Date.parse(String(r.data.nextReviewAt))<=Date.now());
        const data:WorkspaceRecord['data']={...r.data,stale:expired||reviewDue};
        if(expired||reviewDue)data.knowledgeState='TO_REVALIDATE';
        return{...r,data};
      }).sort((a,b)=>Number(b.data.version??1)-Number(a.data.version??1)||b.updatedAt.localeCompare(a.updatedAt));
  }
  encyclopedia(q=''){
    const query=toks(q);return PRODUCT_MODULES.filter(m=>{const h=toks([m.id,m.labelFr,m.labelEn,m.status,m.lot,m.workspace,...m.canonicalDependencies].join(' '));return !query.length||query.every(t=>h.some(x=>x.includes(t)));})
      .map(m=>({...m,truth:m.status==='FOUNDATION_ACTIVE'?'IMPLEMENTED_FOUNDATION':m.status==='STRUCTURAL_V1'?'STRUCTURAL_NOT_FIELD_ACQUIRED':m.status==='PLANNED_DOMAIN'?'PLANNED':'DECLARED',canSearch:true}));
  }

  async createCourse(input:{title:string;audience:string;description:string;lessons:Array<{id:string;title:string;objective:string}>;requiredEvidenceCount?:number;sourceKnowledgeIds?:Id[]}){
    const lessons=input.lessons.map(x=>({id:clean(x.id,100),title:clean(x.title,240),objective:clean(x.objective,800)})).filter(x=>x.id&&x.title);if(!lessons.length)throw new Error('ACADEMY_LESSONS_REQUIRED');
    const sources=input.sourceKnowledgeIds??[];for(const id of sources){const k=await this.repo.getWorkspaceRecord(this.ctx().tenantId,id);if(!k||k.moduleId!=='LEARNING.KNOWLEDGE_BANK'||String(k.data.knowledgeState)!=='VALIDATED')throw new Error('ACADEMY_SOURCE_KNOWLEDGE_NOT_VALIDATED');}
    return this.save('LEARNING.MANAGER_ACADEMY',clean(input.title,240)||'Parcours Academy',{kind:'COURSE',audience:clean(input.audience,240),description:clean(input.description,3000),lessonsJson:JSON.stringify(lessons),requiredEvidenceCount:Number(input.requiredEvidenceCount??0),sourceKnowledgeIdsJson:JSON.stringify(sources),courseState:'ACTIVE',version:1},undefined,'ACTIVE',['academy','course']);
  }
  async enroll(courseId:Id){
    const c=this.ctx(),course=await this.repo.getWorkspaceRecord(c.tenantId,courseId);if(!course||course.moduleId!=='LEARNING.MANAGER_ACADEMY'||course.data.kind!=='COURSE')throw new Error('ACADEMY_COURSE_NOT_FOUND');
    const id='academy_enroll_'+encodeURIComponent(courseId+'|'+c.actorId),existing=await this.repo.getWorkspaceRecord(c.tenantId,id);if(existing)return existing;
    const at=now(),r:WorkspaceRecord={id,tenantId:c.tenantId,moduleId:'LEARNING.MANAGER_ACADEMY',title:'Parcours · '+course.title,status:'ACTIVE',tags:['academy','enrollment'],data:{kind:'ENROLLMENT',courseId,progressJson:'{}',evidenceJson:'[]',enrollmentState:'IN_PROGRESS',certificateId:'',startedAt:at},createdBy:c.actorId,createdAt:at,updatedAt:at};await this.repo.saveWorkspaceRecord(r);return r;
  }
  async submitLesson(enrollmentId:Id,input:{lessonId:string;score?:number;evidenceRef?:string;reflection?:string}){
    const c=this.ctx(),en=await this.repo.getWorkspaceRecord(c.tenantId,enrollmentId);if(!en||en.createdBy!==c.actorId||en.data.kind!=='ENROLLMENT')throw new Error('ACADEMY_ENROLLMENT_NOT_FOUND');
    const course=await this.repo.getWorkspaceRecord(c.tenantId,String(en.data.courseId));if(!course)throw new Error('ACADEMY_COURSE_NOT_FOUND');
    const lessons=JSON.parse(String(course.data.lessonsJson??'[]')) as Array<{id:string}>;if(!lessons.some(x=>x.id===input.lessonId))throw new Error('ACADEMY_LESSON_NOT_FOUND');
    const score=input.score===undefined?null:Number(input.score);if(score!==null&&(!Number.isFinite(score)||score<0||score>100))throw new Error('INVALID_SCORE');
    const progress=JSON.parse(String(en.data.progressJson??'{}')) as Record<string,unknown>;progress[input.lessonId]={completedAt:now(),score,reflection:clean(input.reflection,1000)};
    const evidence=JSON.parse(String(en.data.evidenceJson??'[]')) as string[];if(input.evidenceRef&&!evidence.includes(input.evidenceRef))evidence.push(clean(input.evidenceRef,500));
    const done=lessons.every(x=>Boolean(progress[x.id])),required=Number(course.data.requiredEvidenceCount??0),complete=done&&evidence.length>=required;
    let certificateId=String(en.data.certificateId??'');if(complete&&!certificateId){
      certificateId=makeId('academy_cert');const issued=now(),cert:WorkspaceRecord={id:certificateId,tenantId:c.tenantId,moduleId:'LEARNING.MANAGER_ACADEMY',title:'Attestation · '+course.title,status:'DONE',tags:['academy','certificate','no-authority-grant'],data:{kind:'CERTIFICATE',courseId:course.id,enrollmentId:en.id,holderAccountId:c.actorId,issuedAt:issued,grantsFinancialRole:false,grantsPermission:false},createdBy:c.actorId,createdAt:issued,updatedAt:issued};await this.repo.saveWorkspaceRecord(cert);
    }
    const next={...en,status:complete?'DONE' as const:'ACTIVE' as const,data:{...en.data,progressJson:JSON.stringify(progress),evidenceJson:JSON.stringify(evidence),enrollmentState:complete?'COMPLETED':'IN_PROGRESS',certificateId},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }
  async academy(){
    const c=this.ctx(),rows=await this.repo.listWorkspaceRecords(c.tenantId,'LEARNING.MANAGER_ACADEMY');return{courses:rows.filter(x=>x.data.kind==='COURSE'),myEnrollments:rows.filter(x=>x.data.kind==='ENROLLMENT'&&x.createdBy===c.actorId),myCertificates:rows.filter(x=>x.data.kind==='CERTIFICATE'&&x.createdBy===c.actorId)};
  }
  async founderContext(q:string){
    const [knowledge,capabilities]=await Promise.all([this.searchKnowledge(q),Promise.resolve(this.encyclopedia(q))]);
    return{query:q,knowledge:knowledge.slice(0,20).map(x=>({id:x.id,itemId:x.data.knowledgeItemId,title:x.title,kind:x.data.kind,state:x.data.knowledgeState,version:x.data.version,sourceRef:x.data.sourceRef,validFrom:x.data.validFrom,validUntil:x.data.validUntil,stale:x.data.stale,updatedAt:x.updatedAt})),capabilities:capabilities.slice(0,30),guardrails:{canExplain:true,canSuggest:true,canActivateRules:false,canWriteLedger:false,requiresAuthorizedSources:true}};
  }
}
