import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExerciseClosingPlan,buildExerciseCarryForwardSeed} from '../.build/packages/exercise/src/index.js';
import {createRelayPairingMaterial,encodePairingQr,decodePairingQr,encryptMemberCapsule,decryptMemberCapsule,createBroadcastBundle,encodeBroadcastFrames,encodeTargetedBroadcastFrames,EcoBroadcastReceiver,EcoTargetedBroadcastReceiver} from '../.build/packages/relay/src/broadcast.js';
import {COMPLETION_WORKFLOWS} from '../.build/packages/completion/src/index.js';
import {encodeLocalRoomSignal,decodeLocalRoomSignal,encodeLocalRoomSignalFrames,EcoLocalRoomSignalReceiver} from '../.build/packages/relay/src/local-room.js';

test('exercise closing distinguishes real cash payout from money carried into next exercise',()=>{
  const plan=buildExerciseClosingPlan({
    closingCash:4300,
    members:[
      {membershipId:'m1',principal:1000,interest:100},
      {membershipId:'m2',principal:2000,interest:200}
    ],
    retainedFunds:[
      {code:'SOLIDARITY_FUND',label:'Fonds Secours',amount:500,carryForward:true},
      {code:'BUREAU',label:'Bureau',amount:200,carryForward:false}
    ],
    principalDisposition:'CARRY_FORWARD',
    interestDisposition:'PAY_OUT',
    unassignedCarryForward:100
  });
  assert.equal(plan.memberCashPayoutTotal,300);
  assert.equal(plan.retainedFundsPayoutTotal,200);
  assert.equal(plan.cashOutTotal,500);
  assert.equal(plan.memberCarryForwardTotal,3000);
  assert.equal(plan.retainedFundsCarryForwardTotal,500);
  assert.equal(plan.plannedCarryForwardTotal,3600);
  assert.equal(plan.requiredCashAtClose,4100);
  assert.equal(plan.unallocatedCash,200);
  assert.equal(plan.nextExerciseOpeningCash,3800);
  assert.equal(plan.nextExerciseOpeningCash,plan.closingCash-plan.cashOutTotal);
  const seed=buildExerciseCarryForwardSeed('exercise-2026','Exercice 2027',plan);
  assert.equal(seed.openingCash,3800);
  assert.deepEqual(seed.memberOpeningPositions.map(x=>x.total),[1000,2000]);
  assert.deepEqual(seed.retainedFunds,[{code:'SOLIDARITY_FUND',label:'Fonds Secours',amount:500}]);
});

test('exercise closing refuses allocations larger than real closing cash',()=>{
  assert.throws(()=>buildExerciseClosingPlan({
    closingCash:1000,members:[{membershipId:'m1',principal:1000,interest:500}],
    principalDisposition:'RETURN_TO_MEMBER',interestDisposition:'PAY_OUT'
  }),/EXERCISE_CLOSING_EXCEEDS_CASH/);
});

test('GROUP_EXERCISE is a canonical completion workflow',()=>{
  const flow=COMPLETION_WORKFLOWS.GROUP_EXERCISE;
  assert.ok(flow);
  assert.deepEqual(flow.transitions.PREPARED,['OPEN']);
  assert.deepEqual(flow.transitions.OPEN,['CLOSING']);
  assert.deepEqual(flow.transitions.CLOSING,['OPEN','CLOSED']);
  assert.deepEqual(flow.transitions.CLOSED,['CARRIED_FORWARD']);
});

test('pairing QR stays compact and preserves the member identity and private key',async()=>{
  const base=await createRelayPairingMaterial('membership-member-number-003');
  const material={...base,groupId:'group-association-long-offline-id',groupName:'Association communautaire très longue de démonstration',displayName:'Jean-Pierre Serge M.',memberNumber:3,groupAuthorityId:'manager-authority-001'};
  const raw=encodePairingQr(material);
  assert.ok(new TextEncoder().encode(raw).length<=271);
  const decoded=decodePairingQr(raw);
  assert.equal(decoded.groupId,material.groupId);
  assert.equal(decoded.membershipId,material.membershipId);
  assert.equal(decoded.keyId,material.keyId);
  assert.equal(decoded.rawKey,material.rawKey);
  assert.equal(decoded.memberNumber,3);
  assert.equal(decoded.groupAuthorityId,'manager-authority-001');
});

test('Eco Broadcast can carry 80 separately encrypted member capsules with loss-tolerant frame ordering',async()=>{
  const groupId='group-80';
  const encrypted=[];
  const materials=[];
  for(let i=1;i<=80;i++){
    const membershipId='m'+String(i).padStart(3,'0');
    const base=await createRelayPairingMaterial(membershipId);
    const material={...base,groupId,memberNumber:i};
    materials.push(material);
    encrypted.push(await encryptMemberCapsule({
      protocolVersion:1,groupId,membershipId,
      generatedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString(),
      projection:{member:{memberNumber:i,displayName:'Membre '+i},meeting:{id:'meeting-12',title:'Séance 12'},receipts:[{rubric:'Epargne',amount:1000+i}],statementTotal:12000+i}
    },material));
  }
  const bundle=createBroadcastBundle(groupId,encrypted,60);
  const frames=await encodeBroadcastFrames(bundle,180);
  assert.ok(frames.length>1);
  assert.ok(frames.length<9999);
  const receiver=new EcoBroadcastReceiver();
  for(const raw of frames.slice().reverse()){receiver.add(raw);receiver.add(raw);}
  assert.equal(receiver.progress().complete,true);
  const rebuilt=await receiver.assemble();
  assert.equal(rebuilt.capsules.length,80);
  const target=rebuilt.capsules.find(x=>x.membershipId==='m003');
  const capsule=await decryptMemberCapsule(groupId,target,materials[2],rebuilt.expiresAt);
  assert.equal(capsule.membershipId,'m003');
  assert.equal(capsule.projection.member.memberNumber,3);
});

test('targeted Broadcast lets one member ignore the other 79 capsules before storage',async()=>{
  const groupId='group-target-80',encrypted=[],materials=[];
  for(let i=1;i<=80;i++){
    const membershipId='tm'+String(i).padStart(3,'0'),base=await createRelayPairingMaterial(membershipId),material={...base,groupId,memberNumber:i};
    materials.push(material);
    encrypted.push(await encryptMemberCapsule({
      protocolVersion:1,groupId,membershipId,generatedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString(),
      projection:{member:{memberNumber:i,displayName:'Membre '+i},meeting:{id:'s12'},receipts:[{rubric:'Epargne',amount:1000+i}],statementTotal:20000+i}
    },material));
  }
  const bundle=createBroadcastBundle(groupId,encrypted,60),frames=await encodeTargetedBroadcastFrames(bundle,165);
  assert.ok(frames.length>80);assert.ok(frames.every(x=>new TextEncoder().encode(x).length<=271));
  const receiver=new EcoTargetedBroadcastReceiver(materials[26].keyId);
  let forMember=0;
  for(const raw of frames){const state=receiver.add(raw);if(state.forThisMember)forMember++;}
  assert.ok(forMember>0);assert.ok(forMember<frames.length/10);assert.equal(receiver.progress().complete,true);
  const targeted=await receiver.assemble();
  assert.equal(targeted.capsules.length,1);assert.equal(targeted.capsules[0].membershipId,'tm027');
  const capsule=await decryptMemberCapsule(groupId,targeted.capsules[0],materials[26],targeted.expiresAt);
  assert.equal(capsule.projection.member.memberNumber,27);
});

test('Eco Local Room signaling survives out-of-order QR frames without Internet',async()=>{
  const signal=encodeLocalRoomSignal({protocol:'ECO_LOCAL_ROOM_1',roomId:'abcdef123456',role:'OFFER',description:{type:'offer',sdp:'v=0\\r\\no=- 1 1 IN IP4 127.0.0.1\\r\\ns=Eco Local Room\\r\\nt=0 0\\r\\n'},createdAt:new Date().toISOString()});
  assert.equal(decodeLocalRoomSignal(signal).role,'OFFER');
  const frames=await encodeLocalRoomSignalFrames(signal,165),receiver=new EcoLocalRoomSignalReceiver();
  for(const raw of frames.slice().reverse()){receiver.add(raw);receiver.add(raw);}
  const rebuilt=await receiver.assemble();
  assert.equal(rebuilt,signal);
});

test('sovereign offline surfaces are isolated and iOS fallback assets are part of the coherent shell',()=>{
  const html=fs.readFileSync('apps/web/index.html','utf8');
  const legacy=fs.readFileSync('apps/web/src/resilience-ui.js','utf8');
  const sovereign=fs.readFileSync('apps/web/src/sovereign-offline-ui.js','utf8');
  const sw=fs.readFileSync('apps/web/sw.js','utf8');
  const headers=fs.readFileSync('apps/web/_headers','utf8');
  const app=fs.readFileSync('packages/application/src/index.ts','utf8');
  const worker=fs.readFileSync('workers/api/src/index.ts','utf8');

  assert.match(html,/ecoRelayLegacyWorkspace/);assert.match(html,/ecoRelaySovereignWorkspace/);
  assert.match(html,/ecoLocalLegacyWorkspace/);assert.match(html,/ecoLocalSovereignWorkspace/);
  assert.match(legacy,/ecoRelayLegacyWorkspace/);assert.match(sovereign,/ecoRelaySovereignWorkspace/);
  assert.match(sovereign,/QrScanner/);assert.match(sovereign,/decodePairingQr/);assert.match(sovereign,/EcoTargetedBroadcastReceiver/);assert.match(sovereign,/EcoLocalRoomPeer/);assert.match(sovereign,/visibilitychange/);assert.match(sovereign,/webkit-playsinline/);
  assert.doesNotMatch(sovereign,/BARCODE_DETECTOR_UNAVAILABLE_USE_ECO_PACK/);
  assert.match(sw,/\/src\/vendor\/qr-scanner\.min\.js/);
  assert.match(sw,/\/src\/vendor\/qr-scanner-worker\.min\.js/);assert.match(sw,/\/packages\/relay\/src\/local-room\.js/);assert.match(sw,/\/packages\/eco-numpad\/src\/index\.js/);
  assert.match(headers,/Permissions-Policy: camera=\(self\)/);
  assert.match(headers,/worker-src 'self' blob:/);
  assert.match(app,/pageSize\?\?80/);assert.match(app,/Math\.min\(200/);assert.match(app,/deltaOnly/);
  assert.match(app,/TONTINE_SERVE_V1/);assert.match(app,/LOAN_DISBURSE_V1/);assert.match(app,/LOAN_REPAY_V1/);
  assert.match(app,/GROUP_EXERCISE_LABEL_V1/);assert.match(app,/createEcoVault/);
  assert.match(worker,/TONTINE_SERVE_V1/);assert.match(worker,/LOAN_DISBURSE_V1/);assert.match(worker,/LOAN_REPAY_V1/);
  assert.match(worker,/COMPLETION_CREATE_V1/);assert.match(worker,/GROUP_EXERCISE_LABEL_V1/);
});


test('A01 UI handlers cannot regress to abandoned async functions',()=>{
  const sovereign=fs.readFileSync('apps/web/src/sovereign-offline-ui.js','utf8');
  const governance=fs.readFileSync('apps/web/src/master-governance-ui.ts','utf8');
  assert.doesNotMatch(sovereign,/peer\.onPacket\(packet=>void\(async\(\)=>/);
  assert.doesNotMatch(sovereign,/fileInput\.onchange=\(\)=>void\(async\(\)=>/);
  assert.doesNotMatch(sovereign,/pairImport\.onchange=\(\)=>void\(async\(\)=>/);
  assert.doesNotMatch(sovereign,/vaultExport\.onclick=\(\)=>void\(async\(\)=>/);
  assert.doesNotMatch(sovereign,/vaultRestore\.onclick=\(\)=>void\(async\(\)=>/);
  assert.doesNotMatch(governance,/b\.onclick=\(\)=>void\(async\(\)=>/);
  assert.match(sovereign,/peer\.onPacket\(async packet=>/);
  assert.match(sovereign,/fileInput\.onchange=async\(\)=>/);
  assert.match(sovereign,/pairImport\.onchange=async\(\)=>/);
  assert.match(sovereign,/vaultExport\.onclick=async\(\)=>/);
  assert.match(sovereign,/vaultRestore\.onclick=async\(\)=>/);
  assert.match(governance,/b\.onclick=async\(\)=>/);
});
