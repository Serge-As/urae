import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {QuietWatchService} from '../.build/packages/quiet-watch/src/index.js';

const setCtx=(k,actor='manager')=>k.context.set({actorId:actor,tenantId:'tenant_quiet',activeGroupId:'gq',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req'});
test('Quiet Watch detects canonical signals and requires human governed assistance and evidence to resolve',async()=>{
 const repo=new InMemoryPlatformRepository(),k=new PlatformKernel(),at=new Date().toISOString();setCtx(k);
 await repo.saveUser({id:'manager',displayName:'Manager',locale:'fr',createdAt:at});
 await repo.saveGroup({id:'gq',tenantId:'tenant_quiet',name:'Groupe Q',kind:'association',governanceModel:'community',status:'active',createdBy:'manager',createdAt:at});
 await repo.saveWorkspaceRecord({id:'anom1',tenantId:'tenant_quiet',groupId:'gq',moduleId:'DATA.QUALITY',title:'Écart caisse',summary:'Écart à vérifier',status:'ACTIVE',tags:['completion'],data:{completionKind:'ANOMALY',completionState:'OPEN'},createdBy:'manager',createdAt:at,updatedAt:at});
 await repo.saveWorkspaceRecord({id:'notice1',tenantId:'tenant_quiet',groupId:'gq',moduleId:'FINANCE.MEMBER_CONTROL',title:'Réserve',status:'ACTIVE',tags:[],data:{disputeState:'RESERVED'},createdBy:'manager',createdAt:at,updatedAt:at});
 const service=new QuietWatchService(repo,k),scan=await service.scan('gq');
 assert.equal(scan.guardrails.privateManagersOnly,true);assert.equal(scan.guardrails.publicAccusation,false);assert.equal(scan.guardrails.automaticSanction,false);assert.equal(scan.guardrails.automaticFinancialEffect,false);
 assert.equal(scan.signals.length,2);
 let item=scan.signals.find(x=>x.data.signalType==='DATA_ANOMALY');assert.ok(item);assert.equal(item.data.watchState,'DETECTED');
 item=await service.acknowledge('gq',item.id,'Vérification ouverte');assert.equal(item.data.watchState,'TRIAGED');
 item=await service.proposeAssistance('gq',item.id,{objective:'Comprendre et corriger avec preuves',steps:['Vérifier','Échanger','Décider']});assert.equal(item.data.assistanceState,'PROPOSED');assert.equal(item.data.humanApprovalRequired,true);
 item=await service.approveAssistance('gq',item.id);assert.equal(item.data.assistanceState,'APPROVED');
 await assert.rejects(()=>service.resolve('gq',item.id,{note:'Résolu',evidenceRef:''}),/QUIET_WATCH_RESOLUTION_EVIDENCE_REQUIRED/);
 item=await service.resolve('gq',item.id,{note:'Écart expliqué et corrigé',evidenceRef:'audit://proof'});assert.equal(item.data.watchState,'RESOLVED');assert.equal(item.status,'DONE');
});
test('Quiet Watch UI states its non-punitive and non-financial guardrails',()=>{
 const ui=fs.readFileSync('apps/web/src/quiet-watch-ui.js','utf8');
 assert.match(ui,/aucune accusation/);assert.match(ui,/aucune sanction/);assert.match(ui,/aucune écriture financière/);
 assert.match(ui,/Proposer une assistance/);assert.match(ui,/Approuver le plan/);assert.match(ui,/Résoudre avec preuve/);
});
