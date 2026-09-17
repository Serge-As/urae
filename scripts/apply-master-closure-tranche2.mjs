import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');const write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{if(!s.includes(a))throw Error('TRANCHE2_ANCHOR_MISSING:'+label);return s.replace(a,b)};
const activate=(s,id)=>s.replace(new RegExp(`(\\{id:'${id.replaceAll('.','\\.')}'[^\\n]*status:)'(?:STRUCTURAL_V1|PLANNED_DOMAIN)'`),"$1'FOUNDATION_ACTIVE'");

// Module truth: only capabilities now backed by dedicated/existing tested journeys are promoted.
{
 const p='packages/module-registry/src/index.ts';let s=read(p);
 const participation="  {id:'MEMBERSHIP.RUBRIC_PARTICIPATION',labelFr:'Participation des membres par rubrique',labelEn:'Member participation by rubric',status:'FOUNDATION_ACTIVE',lot:'B',canonicalDependencies:['KERNEL.POLICY','KERNEL.CONFIGURATION'],workspace:'SPECIALIZED'},";
 if(!s.includes("MEMBER.DIGITAL_NOTEBOOK"))s=once(s,participation,participation+"\n  {id:'MEMBER.DIGITAL_NOTEBOOK',labelFr:'Carnet numérique individuel',labelEn:'Individual digital notebook',status:'FOUNDATION_ACTIVE',lot:'B',canonicalDependencies:['KERNEL.POLICY','LEDGER.CANONICAL'],workspace:'SPECIALIZED'},",'notebook-module');
 for(const id of ['MEMBERSHIP.INVITATION','MEETING.CALENDAR','GOVERNANCE.VOTE','ADS.CREATIVES','ADS.PLACEMENTS','NOTIFY.MULTICHANNEL','EXPERIENCE.ORAL','BACKUP.D1_RESTORE'])s=activate(s,id);
 write(p,s);
}

// Worker imports, service wiring and dedicated routes.
{
 const p='workers/api/src/index.ts';let s=read(p);
 const importAnchor="import { HistoricalImportService, RepositoryArtifactStore, type ArtifactStoreLike } from '../../../packages/imports/src/index.js';";
 s=once(s,importAnchor,importAnchor+"\nimport { GovernanceVoteService } from '../../../packages/governance-vote/src/index.js';\nimport { NotificationService } from '../../../packages/notifications/src/index.js';",'service-imports');
 s=once(s,"identityProof?:IdentityProofService;dataUseDefaultMode?:DataUseDefaultMode}","identityProof?:IdentityProofService;dataUseDefaultMode?:DataUseDefaultMode;governanceSecret?:string}",'handler-options');
 const featureAnchor="  if(options.premiumLive)kernel.features.set('premium_live_ledger',true);";
 s=once(s,featureAnchor,"  const governanceVotes=new GovernanceVoteService(repo,kernel,options.governanceSecret??'eco-system-nonproduction-governance-secret');\n  const notifications=new NotificationService(repo,kernel);\n"+featureAnchor,'service-wiring');
 const notFound="    return json({error:'NOT_FOUND'},404,cors);";
 const routes=String.raw`
    const pollsRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls$/);
    if(pollsRoute&&request.method==='GET')return json(await governanceVotes.list(pollsRoute[1]!),200,cors);
    if(pollsRoute&&request.method==='POST'){
      const body=await readJson<Record<string,unknown>>(request);
      return json(await governanceVotes.open(pollsRoute[1]!,{title:String(body.title??''),question:String(body.question??''),options:strArray(body.options),mode:String(body.mode??'NAMED') as any,kind:String(body.kind??'YES_NO') as any,quorumBps:finite(body.quorumBps,5000),majority:String(body.majority??'SIMPLE') as any,qualifiedThresholdBps:body.qualifiedThresholdBps===undefined?undefined:finite(body.qualifiedThresholdBps),closesAt:body.closesAt?String(body.closesAt):undefined}),201,cors);
    }
    const ballotRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls\/([^/]+)\/ballots$/);
    if(ballotRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await governanceVotes.cast(ballotRoute[1]!,ballotRoute[2]!,strArray(body.selections)),201,cors);}
    const tallyRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls\/([^/]+)\/tally$/);
    if(tallyRoute&&request.method==='GET')return json(await governanceVotes.tally(tallyRoute[1]!,tallyRoute[2]!),200,cors);
    const closePollRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/governance\/polls\/([^/]+)\/close$/);
    if(closePollRoute&&request.method==='POST'){const body=await readJson<Record<string,unknown>>(request);return json(await governanceVotes.close(closePollRoute[1]!,closePollRoute[2]!,String(body.state??'CLOSED')==='CANCELLED'?'CANCELLED':'CLOSED'),200,cors);}

    if(url.pathname==='/api/v1/notifications/preferences'&&request.method==='GET')return json(await notifications.preferences(),200,cors);
    if(url.pathname==='/api/v1/notifications/preferences'&&request.method==='PUT'){const body=await readJson<any>(request);return json(await notifications.savePreferences(body),200,cors);}
    const groupNotifications=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/notifications$/);
    if(groupNotifications&&request.method==='GET')return json(await notifications.inbox(groupNotifications[1]!),200,cors);
    if(groupNotifications&&request.method==='POST'){const body=await readJson<any>(request);return json(await notifications.publish(groupNotifications[1]!,body),201,cors);}
    const readNotification=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/notifications\/([^/]+)\/read$/);
    if(readNotification&&request.method==='POST')return json(await notifications.markRead(readNotification[1]!,readNotification[2]!),200,cors);

    const notebookRoute=url.pathname.match(/^\/api\/v1\/groups\/([^/]+)\/members\/([^/]+)\/notebook$/);
    if(notebookRoute&&request.method==='GET'){
      const groupId=notebookRoute[1]!,membershipId=notebookRoute[2]!,group=await requireGroup(groupId),target=await repo.getMembership(ctx.tenantId,groupId,membershipId);if(!target)throw new Error('MEMBERSHIP_NOT_FOUND');
      const viewer=(await repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active'),manager=group.createdBy===ctx.actorId||Boolean(viewer?.roles.some(r=>['founder','manager','admin','president','treasurer'].includes(r)));
      if(!manager&&target.userId!==ctx.actorId)throw new Error('FORBIDDEN_SCOPE');
      const [statement,obligations,attendance,participations,profile,allWorkspace]=await Promise.all([
        ledger.memberStatement(ctx.tenantId,groupId,membershipId,url.searchParams.get('asOf')??undefined),
        repo.listObligations(ctx.tenantId),repo.listWorkspaceRecords(ctx.tenantId,'MEETING.ATTENDANCE',groupId),repo.listWorkspaceRecords(ctx.tenantId,'MEMBERSHIP.RUBRIC_PARTICIPATION',groupId),repo.getWorkspaceRecord(ctx.tenantId,'member_profile_'+membershipId),repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)
      ]);
      const ownObligations=obligations.filter(x=>x.groupId===groupId&&x.assigneeId===membershipId),ownAttendance=attendance.filter(x=>String(x.data.membershipId??'')===membershipId),ownParticipation=participations.filter(x=>String(x.data.membershipId??'')===membershipId),assigned=allWorkspace.filter(x=>String(x.data.assigneeMembershipId??x.data.membershipId??'')===membershipId&&!['MEETING.ATTENDANCE','MEMBERSHIP.RUBRIC_PARTICIPATION'].includes(x.moduleId));
      const timeline=[...statement.receipts.map(x=>({at:x.receivedAt,kind:'RECEIPT',title:String(x.netAmount)+' '+String(x.amount.currency)})),...ownObligations.map(x=>({at:x.dueAt??'',kind:'OBLIGATION',title:x.title})),...ownAttendance.map(x=>({at:x.createdAt,kind:'ATTENDANCE',title:String(x.data.attendance??x.title)})),...assigned.map(x=>({at:x.updatedAt,kind:x.moduleId,title:x.title}))].filter(x=>x.at).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
      return json({group:{id:group.id,name:group.name},membership:target,profile:profile?.data??null,statement,obligations:ownObligations,attendance:ownAttendance,participations:ownParticipation,assignedRecords:assigned,timeline},200,cors);
    }

`;
 s=once(s,notFound,routes+notFound,'routes');
 s=once(s,'identityProof,dataUseDefaultMode})(authenticatedRequest);','identityProof,dataUseDefaultMode,governanceSecret:env.COLLECTIVE_LEARNING_PEPPER??env.IDENTITY_MATCH_PEPPER})(authenticatedRequest);','prod-secret');
 write(p,s);
}

// Mount the governance/life UI in the already-qualified bootstrap.
{
 const p='apps/web/src/voice-entry-bootstrap.ts';let s=read(p);
 const importAnchor="import {mountMasterClosureUI} from './master-closure-ui.js';";
 s=once(s,importAnchor,importAnchor+"\nimport {mountMasterGovernanceUI} from './master-governance-ui.js';",'ui-import');
 s=once(s,'mountContextualGroupUI();mountMasterClosureUI();','mountContextualGroupUI();mountMasterClosureUI();mountMasterGovernanceUI();','ui-mount');write(p,s);
}
console.log('Master 2.3.4 closure tranche 2 applied.');
