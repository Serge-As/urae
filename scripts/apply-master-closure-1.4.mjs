import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const replaceOnce=(s,from,to,label)=>{if(!s.includes(from))throw new Error(`PATCH_ANCHOR_MISSING:${label}`);return s.replace(from,to)};
const replaceAll=(s,from,to)=>s.split(from).join(to);

// 1) Release identity.
{
  const p='package.json',j=JSON.parse(read(p));
  j.version='1.4.0-master-2.3.4-closure';
  j.description='Eco-System 1.4.0: truthful Master 2.3.4 closure, member lifecycle, meeting governance, arrears/recovery, operational reporting, voice/two-sheet, documents, Premium Live, Fairness Lab, AdOps and Group Doctor.';
  write(p,JSON.stringify(j,null,2)+'\n');
}

// 2) Membership lifecycle contract remains additive because D1 stores the domain document behind the repository port.
{
  const p='packages/contracts/src/index.ts';let s=read(p);
  s=replaceOnce(s,"status: 'invited' | 'active' | 'suspended' | 'left';","status: 'invited' | 'waitlisted' | 'trial' | 'active' | 'suspended' | 'left';",'membership-status');
  s=replaceOnce(s,"  historicalTenureStatus?: 'DECLARED' | 'VALIDATED' | 'CONTESTABLE' | 'HISTORICAL_TENURE_LOCKED';\n}","  historicalTenureStatus?: 'DECLARED' | 'VALIDATED' | 'CONTESTABLE' | 'HISTORICAL_TENURE_LOCKED';\n  probationEndsAt?: string;\n  lifecycleReason?: string;\n  lifecycleUpdatedAt?: string;\n  lifecycleUpdatedBy?: Id;\n  lifecycleRevision?: number;\n  reinstatedAt?: string;\n}\n",'membership-lifecycle-fields');
  write(p,s);
}

// 3) Readiness report and evidence-backed registry reconciliation.
{
  const p='packages/module-registry/src/index.ts';let s=read(p);
  if(!s.includes("from './readiness.js'"))s="export { buildProductReadinessReport, productReadinessItems, MASTER_2_3_4_EXTERNAL_GATES } from './readiness.js';\n"+s;
  s=replaceOnce(s,"  {id:'MEMBERSHIP.RECONCILIATION',labelFr:'Import et rapprochement des membres',labelEn:'Member import & reconciliation',status:'STRUCTURAL_V1',lot:'B',canonicalDependencies:['KERNEL.POLICY','KERNEL.EVIDENCE'],workspace:'UNIVERSAL'},","  {id:'MEMBERSHIP.RECONCILIATION',labelFr:'Import et rapprochement des membres',labelEn:'Member import & reconciliation',status:'STRUCTURAL_V1',lot:'B',canonicalDependencies:['KERNEL.POLICY','KERNEL.EVIDENCE'],workspace:'UNIVERSAL'},\n  {id:'MEMBERSHIP.RUBRIC_PARTICIPATION',labelFr:'Participation des membres par rubrique',labelEn:'Member participation by rubric',status:'FOUNDATION_ACTIVE',lot:'B',canonicalDependencies:['KERNEL.POLICY','KERNEL.CONFIGURATION'],workspace:'SPECIALIZED'},",'participation-capability');
  const evidenceActive=[
    'CORE.IDENTITY','CORE.IDENTITY.CLAIM','CORE.ASSOCIATIONS','CORE.ROTATING_TONTINE','CORE.IN_KIND_TONTINE','GROUP.EVOLUTION',
    'RUBRIC.COLLATION','RUBRIC.ASSISTANCE','RUBRIC.SAVINGS','RUBRIC.LOANS','MEETING.MEMBER_MATRIX','MEETING.ATTENDANCE','MEETING.MINUTES','MEETING.ACTIONS',
    'FINANCE.OBLIGATIONS','FINANCE.ARREARS','FINANCE.LOANS','FINANCE.INTEREST','FINANCE.REPAYMENTS','GOVERNANCE.DOCUMENTS','COMMUNITY.FORUM',
    'MARKETPLACE.CORE','MARKETPLACE.GROUP_BUY','AI.ASSISTANT','PAPER.IMPORT','REPORTING.EXPORTS','SECURITY.AUTH','SECURITY.MULTITENANT','COMPATIBILITY.LEGACY'
  ];
  for(const id of evidenceActive){
    const re=new RegExp(`(\\{id:'${id.replaceAll('.','\\.')}'[^\\n]*status:)'(?:STRUCTURAL_V1|PLANNED_DOMAIN)'`);
    if(re.test(s))s=s.replace(re,"$1'FOUNDATION_ACTIVE'");
  }
  write(p,s);
}

// 4) API: readiness, authoritative member lifecycle, participation, arrears/recovery and operational reporting.
{
  const p='workers/api/src/index.ts';let s=read(p);
  s=replaceOnce(s,"import { PRODUCT_MODULES, PRODUCT_CAPABILITY_COUNT } from '../../../packages/module-registry/src/index.js';","import { PRODUCT_MODULES, PRODUCT_CAPABILITY_COUNT, buildProductReadinessReport } from '../../../packages/module-registry/src/index.js';",'registry-import');
  s=replaceAll(s,'1.3.3-fairness-adops-doctor-launch','1.4.0-master-2.3.4-closure');
  s=replaceOnce(s,"return json({version:'1.4.0-master-2.3.4-closure',count:PRODUCT_CAPABILITY_COUNT,capabilities:PRODUCT_MODULES},200,cors);","return json({version:'1.4.0-master-2.3.4-closure',count:PRODUCT_CAPABILITY_COUNT,capabilities:PRODUCT_MODULES,readiness:buildProductReadinessReport(PRODUCT_MODULES)},200,cors);",'capability-readiness');

  const memberAnchor=`    if(members&&request.method==='POST'){
      const group=await repo.getGroup(ctx.tenantId,members[1]!); if(!group) return json({error:'NOT_FOUND'},404,cors);
      const body=await readJson<Record<string,unknown>>(request); const displayName=String(body.displayName??'').trim(); if(!displayName) throw new Error('MEMBER_NAME_REQUIRED');
      const membership=await foundation.addMember(ctx.tenantId,group.id,{id:String(body.userId??makeId('user')),displayName,locale:String(body.locale??ctx.locale),createdAt:new Date().toISOString()}); return json(membership,201,cors);
    }

`;
  const memberRoutes=`    if(members&&request.method==='POST'){
      const group=await repo.getGroup(ctx.tenantId,members[1]!); if(!group) return json({error:'NOT_FOUND'},404,cors);
      const body=await readJson<Record<string,unknown>>(request); const displayName=String(body.displayName??'').trim(); if(!displayName) throw new Error('MEMBER_NAME_REQUIRED');
      const membership=await foundation.addMember(ctx.tenantId,group.id,{id:String(body.userId??makeId('user')),displayName,locale:String(body.locale??ctx.locale),createdAt:new Date().toISOString()}); return json(membership,201,cors);
    }
    const memberLifecycle=url.pathname.match(/^\\/api\\/v1\\/groups\\/([^/]+)\\/members\\/([^/]+)\\/lifecycle$/);
    if(memberLifecycle&&request.method==='PUT'){
      const groupId=memberLifecycle[1]!,membershipId=memberLifecycle[2]!,group=await requireGroup(groupId,true);
      const existing=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!existing)throw new Error('MEMBERSHIP_NOT_FOUND');
      const body=await readJson<Record<string,unknown>>(request),status=String(body.status??existing.status) as import('../../../packages/contracts/src/index.js').Membership['status'];
      if(!['invited','waitlisted','trial','active','suspended','left'].includes(status))throw new Error('INVALID_MEMBERSHIP_STATUS');
      const expected=body.expectedRevision===undefined?Number(existing.lifecycleRevision??0):finite(body.expectedRevision);
      if(expected!==Number(existing.lifecycleRevision??0))throw new Error('STALE_MEMBERSHIP_VERSION');
      const roles=body.roles===undefined?existing.roles:strArray(body.roles);if(existing.userId===group.createdBy&&!roles.includes('founder'))throw new Error('FOUNDER_ROLE_REQUIRED');
      const now=new Date().toISOString(),reinstated=status==='active'&&['suspended','left','waitlisted','trial'].includes(existing.status)?now:existing.reinstatedAt;
      const next={...existing,status,roles,historicalJoinedAt:body.historicalJoinedAt?String(body.historicalJoinedAt):existing.historicalJoinedAt,probationEndsAt:body.probationEndsAt?String(body.probationEndsAt):undefined,lifecycleReason:body.reason?String(body.reason):existing.lifecycleReason,lifecycleUpdatedAt:now,lifecycleUpdatedBy:ctx.actorId,lifecycleRevision:Number(existing.lifecycleRevision??0)+1,reinstatedAt:reinstated};
      await repo.saveMembership(next);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MEMBERSHIP_LIFECYCLE_UPDATED',targetType:'membership',targetId:membershipId,before:{status:existing.status,roles:existing.roles,revision:existing.lifecycleRevision??0},after:{status:next.status,roles:next.roles,revision:next.lifecycleRevision},requestId:ctx.requestId});await repo.saveAudit(audit);return json(next,200,cors);
    }
    const memberParticipation=url.pathname.match(/^\\/api\\/v1\\/groups\\/([^/]+)\\/members\\/([^/]+)\\/participations$/);
    if(memberParticipation&&request.method==='GET'){
      const groupId=memberParticipation[1]!,membershipId=memberParticipation[2]!;await requireGroup(groupId);if(!(await repo.getMembership(ctx.tenantId,groupId,membershipId)))throw new Error('MEMBERSHIP_NOT_FOUND');
      return json((await repo.listWorkspaceRecords(ctx.tenantId,'MEMBERSHIP.RUBRIC_PARTICIPATION',groupId)).filter(x=>String(x.data.membershipId??'')===membershipId),200,cors);
    }
    if(memberParticipation&&request.method==='POST'){
      const groupId=memberParticipation[1]!,membershipId=memberParticipation[2]!;await requireGroup(groupId,true);if(!(await repo.getMembership(ctx.tenantId,groupId,membershipId)))throw new Error('MEMBERSHIP_NOT_FOUND');
      const body=await readJson<Record<string,unknown>>(request),rubricId=String(body.rubricId??''),rubric=await repo.getRubricDefinition(ctx.tenantId,groupId,rubricId);if(!rubric)throw new Error('RUBRIC_NOT_FOUND');
      const status=String(body.status??'ACTIVE');if(!['ACTIVE','PAUSED','OPTED_OUT'].includes(status))throw new Error('INVALID_PARTICIPATION_STATUS');const shareCount=finite(body.shareCount,1);if(!Number.isInteger(shareCount)||shareCount<0)throw new Error('INVALID_SHARE_COUNT');
      const id='member_rubric_'+encodeURIComponent(JSON.stringify([groupId,membershipId,rubricId])),existing=await repo.getWorkspaceRecord(ctx.tenantId,id),now=new Date().toISOString();
      const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:'MEMBERSHIP.RUBRIC_PARTICIPATION',title:rubric.name,summary:'Participation '+status,status:'ACTIVE',tags:['membership','rubric-participation'],data:{membershipId,rubricId,rubricName:rubric.name,status,shareCount,shareNames:String(body.shareNames??'')},createdBy:existing?.createdBy??ctx.actorId,createdAt:existing?.createdAt??now,updatedAt:now};
      await repo.saveWorkspaceRecord(record);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'MEMBERSHIP_RUBRIC_PARTICIPATION_UPDATED',targetType:'workspace_record',targetId:id,before:existing?.data,after:record.data,requestId:ctx.requestId});await repo.saveAudit(audit);return json(record,existing?200:201,cors);
    }

`;
  s=replaceOnce(s,memberAnchor,memberRoutes,'member-routes');

  const obligationAnchor=`    if(obligationRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.createFinancialObligation(obligationRoute[1]!,{
        membershipId:String(body.membershipId??''),type:String(body.type??'CONTRIBUTION_DUE'),title:String(body.title??''),
        dueAt:body.dueAt?String(body.dueAt):undefined,amount:body.amount===undefined?undefined:finite(body.amount),
        currency:String(body.currency??'XAF'),sourceId:body.sourceId?String(body.sourceId):undefined
      }),201,cors);
    }

`;
  const obligationRoutes=`    if(obligationRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await completion.createFinancialObligation(obligationRoute[1]!,{
        membershipId:String(body.membershipId??''),type:String(body.type??'CONTRIBUTION_DUE'),title:String(body.title??''),
        dueAt:body.dueAt?String(body.dueAt):undefined,amount:body.amount===undefined?undefined:finite(body.amount),
        currency:String(body.currency??'XAF'),sourceId:body.sourceId?String(body.sourceId):undefined
      }),201,cors);
    }
    const obligationUpdate=url.pathname.match(/^\\/api\\/v1\\/groups\\/([^/]+)\\/obligations\\/([^/]+)$/);
    if(obligationUpdate&&request.method==='PUT'){
      const groupId=obligationUpdate[1]!,obligationId=obligationUpdate[2]!;await requireGroup(groupId,true);const existing=(await repo.listObligations(ctx.tenantId)).find(x=>x.id===obligationId&&x.groupId===groupId);if(!existing)throw new Error('OBLIGATION_NOT_FOUND');
      const body=await readJson<Record<string,unknown>>(request),status=String(body.status??existing.status) as typeof existing.status;if(!['open','completed','cancelled','overdue'].includes(status))throw new Error('INVALID_OBLIGATION_STATUS');
      const next={...existing,status,title:body.title?String(body.title):existing.title,dueAt:body.dueAt?String(body.dueAt):existing.dueAt,priority:body.priority?String(body.priority) as typeof existing.priority:existing.priority};await repo.saveObligation(next);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'OBLIGATION_UPDATED',targetType:'obligation',targetId:existing.id,before:{status:existing.status,dueAt:existing.dueAt},after:{status:next.status,dueAt:next.dueAt},requestId:ctx.requestId});await repo.saveAudit(audit);return json(next,200,cors);
    }
    const masterArrearsRoute=url.pathname.match(/^\\/api\\/v1\\/groups\\/([^/]+)\\/arrears$/);
    if(masterArrearsRoute&&request.method==='GET'){
      const groupId=masterArrearsRoute[1]!;await requireGroup(groupId,true);const now=Date.now(),rows=(await repo.listObligations(ctx.tenantId)).filter(x=>x.groupId===groupId&&(x.status==='overdue'||(x.status==='open'&&Boolean(x.dueAt)&&Date.parse(x.dueAt!)<now)));return json(rows,200,cors);
    }
    const recoveryCase=url.pathname.match(/^\\/api\\/v1\\/groups\\/([^/]+)\\/arrears\\/([^/]+)\\/recovery-case$/);
    if(recoveryCase&&request.method==='POST'){
      const groupId=recoveryCase[1]!,obligationId=recoveryCase[2]!;await requireGroup(groupId,true);const obligation=(await repo.listObligations(ctx.tenantId)).find(x=>x.id===obligationId&&x.groupId===groupId);if(!obligation)throw new Error('OBLIGATION_NOT_FOUND');const body=await readJson<Record<string,unknown>>(request),now=new Date().toISOString();
      const record={id:makeId('case'),tenantId:ctx.tenantId,groupId,type:'ARREARS_RECOVERY',subjectType:'obligation',subjectId:obligation.id,status:'OPEN' as const,openedBy:ctx.actorId,openedAt:now,summary:String(body.summary??('Régularisation: '+obligation.title))};await repo.saveCase(record);const audit=kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'ARREARS_RECOVERY_OPENED',targetType:'case',targetId:record.id,after:{obligationId:obligation.id,membershipId:obligation.assigneeId},requestId:ctx.requestId});await repo.saveAudit(audit);return json(record,201,cors);
    }
    const operationalReport=url.pathname.match(/^\\/api\\/v1\\/groups\\/([^/]+)\\/reports\\/operational-summary$/);
    if(operationalReport&&request.method==='GET'){
      const groupId=operationalReport[1]!,group=await requireGroup(groupId,true);const [members,meetingRows,rubricRows,obligationRows,ledgerSummary,entries]=await Promise.all([repo.listMemberships(ctx.tenantId,groupId),repo.listMeetings(ctx.tenantId,groupId),repo.listRubricDefinitions(ctx.tenantId,groupId),repo.listObligations(ctx.tenantId),ledger.summary(ctx.tenantId,groupId),repo.listLedgerEntries(ctx.tenantId,groupId)]);const groupObligations=obligationRows.filter(x=>x.groupId===groupId);return json({group:{id:group.id,name:group.name,kind:group.kind,status:group.status},generatedAt:new Date().toISOString(),summary:{members:members.length,activeMembers:members.filter(x=>x.status==='active').length,meetings:meetingRows.length,openMeetings:meetingRows.filter(x=>x.status==='open').length,rubrics:rubricRows.length,openObligations:groupObligations.filter(x=>x.status==='open'||x.status==='overdue').length,cashBalance:ledgerSummary.cashBalance,ledgerEntries:entries.length},members,meetings:meetingRows,rubrics:rubricRows,obligations:groupObligations,ledger:{summary:ledgerSummary,entries}},200,cors);
    }

`;
  s=replaceOnce(s,obligationAnchor,obligationRoutes,'obligation-report-routes');
  write(p,s);
}

// 5) Mount the new operational center through the already-qualified 1.3.4 bootstrap chain.
{
  const p='apps/web/src/voice-entry-bootstrap.ts';let s=read(p);
  s=replaceOnce(s,"import {mountContextualGroupUI} from './contextual-group-ui.js';","import {mountContextualGroupUI} from './contextual-group-ui.js';\nimport {mountMasterClosureUI} from './master-closure-ui.js';",'ui-import');
  s=replaceOnce(s,'const start=()=>{mountVoiceEntryUI();mountExpenseRecapUI();mountMemberDossierUI();mountDocumentsUI();mountContextualGroupUI();};','const start=()=>{mountVoiceEntryUI();mountExpenseRecapUI();mountMemberDossierUI();mountDocumentsUI();mountContextualGroupUI();mountMasterClosureUI();};','ui-mount');
  write(p,s);
}

// 6) Visible truth. Do not leave a deployed 1.4 shell advertising 1.3.2/1.3.3.
{
  const p='apps/web/index.html';let s=read(p);
  s=replaceAll(s,'1.3.3 FAIRNESS · ADOPS · DOCTOR','1.4.0 MASTER 2.3.4 · CLOSURE');
  s=replaceAll(s,'Eco-System 1.3.2 · Épargne · Control · Forum Live · Cahier Maître 3.0.0','Eco-System 1.4.0 · Cahier Maître 2.3.4 + additifs 3.2.0 · vérité fonctionnelle');
  write(p,s);
}
{
  const p='apps/web/src/main.js';let s=read(p);s=replaceAll(s,"const CAHIER_VERSION = '1.3.2-savings-control-forum-live';","const CAHIER_VERSION = '1.4.0-master-2.3.4-closure';");write(p,s);
}
{
  const p='workers/api/src/production.ts';let s=read(p);s=replaceAll(s,"export const RELEASE_VERSION='1.3.4-voice-two-sheet-documents-final';","export const RELEASE_VERSION='1.4.0-master-2.3.4-closure';");write(p,s);
}

// 7) Existing tests asserting the release string must follow the new branch truth; old deployment workflows remain untouched.
for(const p of fs.readdirSync('tests').filter(x=>x.endsWith('.test.mjs')).map(x=>'tests/'+x)){
  let s=read(p);s=replaceAll(s,'1.3.4-voice-two-sheet-documents-final','1.4.0-master-2.3.4-closure');s=replaceAll(s,'1.3.3-fairness-adops-doctor-launch','1.4.0-master-2.3.4-closure');write(p,s);
}

console.log('Eco-System 1.4.0 Master 2.3.4 closure patch applied.');
