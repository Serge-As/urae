import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {extractVoiceFinancialEntriesByCandidates,matchVoiceMention,parseVoiceFinancialCommand,sanitizeVoiceFinancialTranscript} from '../.build/packages/voice-commands/src/index.js';

test('financial transcript removes repeated Eco/echo wake-word pollution without streaming text',()=>{
  const raw='Eco echo chez Serge écho secours echo 500 echo épargne echo 1000 echo remboursement echo 5000';
  const cleaned=sanitizeVoiceFinancialTranscript(raw);
  assert.equal(cleaned,'Eco chez Serge secours 500 épargne 1000 remboursement 5000');
  assert.equal(parseVoiceFinancialCommand(raw).wakeWordDetected,true);
});

test('domain-aware parser finds member and multiple real rubric amounts without punctuation',()=>{
  const raw='Eco echo chez Serge écho secours echo 500 echo épargne echo 1000 echo remboursement echo 5000';
  const candidates=[
    {id:'sec',label:'Secours',aliases:['solidarité']},
    {id:'sav',label:'Épargne',aliases:['epargne']},
    {id:'rep',label:'Remboursement',aliases:['rembourser']}
  ];
  const entries=extractVoiceFinancialEntriesByCandidates(raw,candidates);
  assert.deepEqual(entries.map(x=>[x.candidate.id,x.amount]),[['sec',500],['sav',1000],['rep',5000]]);
  const member=matchVoiceMention(raw,[{id:'m1',label:'Serge'},{id:'m2',label:'Benoît'}]);
  assert.equal(member.status,'EXACT');assert.equal(member.candidate?.id,'m1');
});

test('finance voice records first and only transcribes/interprets after Stop',()=>{
  const ui=fs.readFileSync('apps/web/src/voice-entry-ui.ts','utf8');
  const worker=fs.readFileSync('workers/api/src/index.ts','utf8');
  assert.match(ui,/MediaRecorder/);assert.match(ui,/getUserMedia/);assert.match(ui,/\/api\/v1\/voice\/transcribe/);
  assert.match(ui,/interimResults=false/);assert.doesNotMatch(ui,/interimResults=true/);
  assert.doesNotMatch(ui,/setTimeout\(\(\)=>\{try\{recognition\.start/);
  assert.match(ui,/rien ne s’écrit pendant l’enregistrement|nothing is written while recording/);
  assert.match(worker,/@cf\/openai\/whisper-large-v3-turbo/);
  assert.match(worker,/condition_on_previous_text:false/);assert.match(worker,/vad_filter:true/);
  assert.match(worker,/stored:false/);assert.match(worker,/VOICE_AUDIO_TOO_LARGE/);
});
