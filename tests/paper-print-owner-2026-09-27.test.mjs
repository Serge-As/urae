import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSessionPrintSheet,buildMemberPrintSheet,buildAttendancePrintSheet,buildRoleRegister,buildMemberCards} from '../apps/web/src/print-center.js';

const group={id:'g1',name:'Groupe Papier',kind:'association',status:'active'};
const members=[
 {id:'m1',userId:'u1',displayName:'Alice',status:'active',roles:['president']},
 {id:'m2',userId:'u2',displayName:'Bob',status:'active',roles:['member']},
 {id:'m3',userId:'u3',displayName:'Ancien',status:'inactive',roles:['member']}
];
const meeting={id:'meet1',title:'Séance 1',status:'closed',openedAt:'2026-09-27T08:00:00.000Z',closedAt:'2026-09-27T10:00:00.000Z'};
const rubrics=Array.from({length:40},(_,i)=>({id:'r'+(i+1),name:'Rubrique '+(i+1),status:'ACTIVE'}));
const receipts=[
 {id:'a',membershipId:'m1',meetingId:'meet1',rubricId:'r1',netAmount:1000,amount:{amount:1000,currency:'XAF'},receivedAt:'2026-09-27T08:30:00.000Z'},
 {id:'b',membershipId:'m1',meetingId:'meet1',rubricId:'r2',netAmount:500,amount:{amount:500,currency:'XAF'},receivedAt:'2026-09-27T08:35:00.000Z'},
 {id:'c',membershipId:'m2',meetingId:'meet1',rubricId:'r1',netAmount:2000,amount:{amount:2000,currency:'XAF'},receivedAt:'2026-09-27T08:40:00.000Z'}
];

test('Paper Print handles 40-rubric session matrix from canonical receipts with correct totals',()=>{
 const sheet=buildSessionPrintSheet({group,meeting,members,rubrics,ledger:{receipts}});
 assert.equal(sheet.canonicalProjection,true);assert.equal(sheet.rubrics.length,40);assert.equal(sheet.rows.length,2);
 assert.equal(sheet.rows.find(x=>x.membershipId==='m1').total,1500);
 assert.equal(sheet.columnTotals[0],3000);assert.equal(sheet.columnTotals[1],500);assert.equal(sheet.grandTotal,3500);
 assert.match(sheet.lot,/^ECO-PAPER-/);
});

test('individual print sheet contains only selected member data',()=>{
 const statement={displayName:'Alice',currency:'XAF',totalNetContributions:1500,receipts:receipts.filter(x=>x.membershipId==='m1')};
 const sheet=buildMemberPrintSheet({group,member:members[0],statement,rubrics,meetings:[meeting]});
 assert.equal(sheet.otherMemberDataIncluded,false);assert.equal(sheet.member.id,'m1');assert.equal(sheet.receipts.length,2);assert.equal(sheet.totalNet,1500);
 assert.ok(!JSON.stringify(sheet).includes('m2'));assert.ok(!JSON.stringify(sheet).includes('2000'));
});

test('attendance role register and member cards preserve terrain privacy',()=>{
 const attendance=buildAttendancePrintSheet({group,meeting,members,attendance:[{data:{membershipId:'m1',attendance:'PRESENT',note:'À l’heure'}},{data:{membershipId:'m2',attendance:'LATE',note:'10 min'}}]});
 assert.equal(attendance.signatureColumn,true);assert.equal(attendance.rows.length,2);assert.equal(attendance.rows[0].signature,'');
 const roles=buildRoleRegister({group,members});assert.equal(roles.rows.length,2);assert.ok(roles.rows.some(x=>x.role==='president'));
 const cards=buildMemberCards({group,members});assert.equal(cards.cards.length,2);for(const c of cards.cards){assert.equal(c.privateContactIncluded,false);assert.equal(c.identityDocumentIncluded,false);}
});

test('Paper Print UI exposes all field formats and no second financial engine',()=>{
 const ui=fs.readFileSync('apps/web/src/print-center.js','utf8');
 for(const token of ['Feuille de séance','Émargement / présences','Fiche individuelle','Registre par rôle','Cartes membres','Imprimer / Enregistrer en PDF'])assert.ok(ui.includes(token),token);
 assert.match(ui,/projection canonique/i);assert.match(ui,/aucune nouvelle écriture financière/i);assert.match(ui,/aucune donnée financière d’un autre membre/i);
});
