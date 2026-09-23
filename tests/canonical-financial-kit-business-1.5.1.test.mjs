import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {BusinessStudioService} from '../.build/packages/business-studio/src/index.js';

const main=fs.readFileSync('apps/web/src/main.js','utf8');
const sessions=fs.readFileSync('apps/web/src/sessions-ui.js','utf8');
const detail=fs.readFileSync('apps/web/src/detail-ui.js','utf8');
const voice=fs.readFileSync('apps/web/src/voice-entry-ui.ts','utf8');
const launch=fs.readFileSync('apps/web/src/launch-studio.js','utf8');
const businessUi=fs.readFileSync('apps/web/src/business-studio-ui.js','utf8');

test('one canonical financial table owns meeting individual and member-detail entry',()=>{
  assert.match(main,/const renderCanonicalFinancialTable=/);
  assert.match(main,/renderCanonicalFinancialTable\(\{root:document\.querySelector\('#meetingMatrix'\),mode:'meeting'/);
  assert.match(main,/renderCanonicalFinancialTable\(\{root,mode:'individual'/);
  assert.match(main,/makeFinancialEntryCell\(\{member:m,rubric:r,meetingId:selectedMeeting/);
  assert.match(main,/makeFinancialEntryCell\(\{member,rubric:r,meetingId:meeting\.id/);
  assert.match(main,/TOTAL COLONNES/);
  assert.match(main,/Total membre/);
  assert.match(main,/Total séance/);
  assert.match(sessions,/canonical-financial-table-host/);
  assert.match(sessions,/eco:render-canonical-financial-table/);
  assert.doesNotMatch(sessions,/const sessionNet=/);
  assert.match(detail,/dataset\.canonicalFinancialHost='1'/);
  assert.match(detail,/eco:render-canonical-financial-table/);
  assert.doesNotMatch(detail,/buildExerciseMatrix\(\{member:m,statement,operational,editable:isManager\(\)\}\)/);
});

test('legacy voice layer no longer mounts any competing matrix owner',()=>{
  const mount=voice.slice(voice.indexOf('export function mountVoiceEntryUI()'));
  assert.match(mount,/voice augments inputs but never owns\/re-renders/);
  assert.doesNotMatch(mount,/hardenLegacyMatrix\(\)/);
  assert.doesNotMatch(mount,/watchDetailSheets\(\)/);
  assert.doesNotMatch(mount,/installTwoSheetChooser\(\)/);
  assert.doesNotMatch(mount,/renderCanonicalMeetingMatrix\(/);
  assert.match(mount,/installFinancialVoicePanel\(\)/);
  assert.match(mount,/installFocusedFieldDictation\(\)/);
});

test('ready-to-use kit is a real generated pack rather than a catalog card',()=>{
  for(const token of [
    'Kit prêt à l’emploi · réellement généré pour ce brouillon','Checklist de lancement','Règlement type adaptable',
    'Calendrier de démarrage','Message d’invitation','Modèle de PV','Guide première réunion','Guide trésorerie',
    'Paper Bridge · pack papier/hybride/numérique','OBLIGATOIRE','RECOMMANDÉ','CONFIGURABLE','TOTAL'
  ]) assert.ok(launch.includes(token),token);
  for(const token of ['Feuille mensuelle / feuille de séance membres × rubriques','Fiches individuelles','Émargement','Prêts / remboursements / intérêts','Assistances / secours','Cartes ou fiches membres'])
    assert.ok(launch.includes(token),token);
  assert.match(launch,/localStorage\.setItem\(key,JSON\.stringify\(saved\)\)/);
  assert.match(launch,/printStarterKit/);
});

const ctx=()=>({tenantId:'tenant_biz151',actorId:'manager_151',activeGroupId:'group_151',groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'req-biz151'});
async function setupBusiness(){
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();kernel.context.set(ctx());
  await repo.saveUser({id:'manager_151',displayName:'Manager',locale:'fr',createdAt:new Date().toISOString()});
  await repo.saveGroup({id:'group_151',tenantId:'tenant_biz151',name:'Association rentable',kind:'association',governanceModel:'community',status:'active',createdBy:'manager_151',createdAt:new Date().toISOString()});
  await repo.saveMembership({id:'m_manager',tenantId:'tenant_biz151',groupId:'group_151',userId:'manager_151',roles:['founder','manager'],status:'active',joinedAt:new Date().toISOString()});
  return {repo,kernel,service:new BusinessStudioService(repo,kernel)};
}

test('Business Studio full feasibility separates collective volume from manager private revenue',async()=>{
  const {service}=await setupBusiness();
  const r=await service.scenario({
    name:'Central',nominalContribution:1000,addedFeePerMemberSession:50,members:20,sessions:12,pots:2,durationMonths:12,
    transferFees:500,withdrawalFees:500,transport:1000,internet:1000,communication:500,personnel:2000,rent:1000,advertising:1000,
    purchases:5000,supplierDiscounts:1000,commissions:2000,managementFees:3000,otherRevenue:500,losses:500,expectedDefaultRate:10
  });
  assert.equal(r.data.collectiveContributionVolume,240000);
  assert.equal(r.data.realizedRevenue,17000);
  assert.equal(r.data.totalCosts,13000);
  assert.equal(r.data.grossMargin,8000);
  assert.equal(r.data.netMargin,4000);
  assert.equal(r.data.breakEvenMembers,13);
  assert.equal(r.data.simulationOnly,true);
  assert.match(String(r.data.assumptionNote),/Cotisations collectives exclues du revenu privé/);
  assert.equal(JSON.parse(String(r.data.centralJson)).netMargin,4000);
  assert.ok(JSON.parse(String(r.data.prudentJson)).netMargin<4000);
});

test('Business Studio records private income but rejects undocumented extraction from a group',async()=>{
  const {service}=await setupBusiness();
  await service.recordRevenue({label:'Conseil privé',amount:10000,source:'SERVICE'});
  await service.recordExpense({label:'Data et appels',amount:2000,category:'COMMUNICATION'});
  const summary=await service.summary();
  assert.equal(summary.directRevenue,10000);
  assert.equal(summary.received,10000);
  assert.equal(summary.expenses,2000);
  assert.equal(summary.margin,8000);
  assert.equal(summary.revenueBySource.SERVICE,10000);
  assert.equal(summary.expenseByCategory.COMMUNICATION,2000);
  await assert.rejects(()=>service.recordRevenue({label:'Frais du groupe',amount:5000,source:'MANAGEMENT_FEE',groupId:'group_151'}),/COLLECTIVE_REVENUE_LEDGER_REFERENCE_REQUIRED/);
});

test('Business Studio UI exposes a complete prospect-to-cash operating path',()=>{
  for(const token of ['Créer un devis','Créer un contrat','Émettre une facture','Encaisser une facture','Saisir mon temps','Importer un honoraire validé du groupe','Plan de rentabilité complet'])
    assert.ok(businessUi.includes(token),token);
  for(const token of ['Taux d’impayés estimé','Membres minimum','Marge nette réelle','Fournisseurs connus','Approvisionnements','Prudent','Central','Optimiste'])
    assert.ok(businessUi.includes(token),token);
});
