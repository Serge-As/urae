import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FounderAIService} from '../.build/packages/founder-ai/src/index.js';

test('Founder AI synthesizes only grounded priorities and has no autonomous powers',()=>{
 const svc=new FounderAIService(),brief=svc.synthesize({query:'live',knowledgeContext:{knowledge:[{id:'k1',title:'Live policy',state:'VALIDATED'}],capabilities:[{id:'LIVE'}]},control:{generatedAt:'2026-09-27T00:00:00Z',platform:{groups:1,memberships:2,workspaceRecords:3,openComplaints:0,audits:4},capabilities:[{id:'LIVE.CORE',labelFr:'Live Core',labelEn:'Live Core',declaredStatus:'FOUNDATION_ACTIVE',lot:'I',workspace:'SPECIALIZED',health:'FAIL',healthNote:'socket retry failing',updatedAt:'2026-09-27T00:00:00Z',monitoringState:'ACTIVE',codeStage:'IMPLEMENTED',deploymentStage:'UNKNOWN',fieldStage:'NOT_VERIFIED'}],content:[],incidents:[{id:'i1',type:'INCIDENT',key:'live',title:'Live disconnect',status:'OPEN',priority:'CRITICAL',data:{note:'reconnect'},createdAt:'2026-09-27T00:00:00Z',updatedAt:'2026-09-27T00:00:00Z'}],complaints:[],supervisionRule:'CATALOG_AUTO_REGISTER'},learning:{stats:{sanitizedSignals:5,pseudonymousGroups:5,discoveries:1,minGroups:5},discoveries:[{category:'OPERATING_PRACTICE',key:'live-refresh',value:'manager expects no manual refresh',supportingGroups:5,averageConfidence:.9,lastSeenAt:'2026-09-27T00:00:00Z',privacy:'K_ANONYMIZED'}],privacy:'SANITIZED_PSEUDONYMOUS_K_ANONYMIZED'}});
 assert.equal(brief.priorities[0].severity,'CRITICAL');assert.ok(brief.priorities.some(x=>x.kind==='CAPABILITY'));assert.ok(brief.priorities.some(x=>x.kind==='DISCOVERY'));assert.ok(brief.priorities.every(x=>x.evidenceRef));
 assert.equal(brief.guardrails.founderTeamOnly,true);assert.equal(brief.guardrails.canExecute,false);assert.equal(brief.guardrails.canWriteLedger,false);assert.equal(brief.guardrails.canActivateRules,false);assert.equal(brief.guardrails.rawMemberData,false);assert.equal(brief.guardrails.rawGroupLearningData,false);assert.ok(brief.suggestedActions.every(x=>x.canExecute===false));
});
test('Founder AI route and UI remain founder-only and evidence-first',()=>{
 const worker=fs.readFileSync('workers/api/src/index.ts','utf8'),ui=fs.readFileSync('apps/web/src/founder-ai-ui.js','utf8');
 assert.match(worker,/founder-ai\/context[\s\S]{0,900}FOUNDER_TEAM_ONLY/);assert.match(worker,/founderAI\.synthesize/);
 assert.match(ui,/brief stratégique sourcé/);assert.match(ui,/exécution automatique : non/);assert.match(ui,/n’invente pas de signal/);
});
