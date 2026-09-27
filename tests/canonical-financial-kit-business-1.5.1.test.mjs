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
const groupHome=fs.readFileSync('apps/web/src/group-home-ui.js','utf8');

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
  assert.doesNotMatch(detail,/buildExerciseMatrix/);
  assert.doesNotMatch(detail,/buildMeetingMatrix/);
  assert.doesNotMatch(detail,/quickEntry/);
  assert.match(main,/canonicalFinancialObservers=new WeakMap/);
  assert.match(main,/protectCanonicalFinancialHost/);
  assert.match(main,/canonicalFinancialOwner='main-v151'/);
});

test('legacy voice layer no longer mounts any competing matrix owner',()=>{
  const mount=voice.slice(voice.indexOf('export function mountVoiceEntryUI()'));
  assert.match(mount,/voice augments inputs but never owns\/re-renders/);
  for(const forbidden of ['hardenLegacyMatrix','watchDetailSheets','installTwoSheetChooser','renderCanonicalMeetingMatrix','renderIndividualSheetWorkspace','buildSheetCellEditor']) assert.ok(!voice.includes(forbidden),forbidden);
  assert.match(mount,/installFinancialVoicePanel\(\)/);
  assert.match(mount,/installFocusedFieldDictation\(\)/);
});

test('ready-to-use kit is a real generated pack rather than a catalog card',()=>{
  for(const token of [
    'Kit prêt à l’emploi · réellement généré pour ce brouillon','Checklist de lancement','Règlement type adaptable',
    'Calendrier de démarrage','Message d’invitation','Modèle de PV','Guide première réunion','Guide trésorerie',
    'Paper Bridge · pack papier/hybride/numérique','Modèle recommandé — à valider','Montant indicatif de référence','Ordre / tirage','Politique de retard','Simulation de préparation · prudent / central / optimiste','Conseils de démarrage et plan d’action','Exemple de frais et séparation des montants','OBLIGATOIRE','RECOMMANDÉ','CONFIGURABLE','TOTAL'
  ]) assert.ok(launch.includes(token),token);
  for(const token of ['Feuille mensuelle / feuille de séance membres × rubriques','Fiches individuelles','Émargement','Prêts / remboursements / intérêts','Assistances / secours','Cartes ou fiches membres'])
    assert.ok(launch.includes(token),token);
  assert.match(launch,/localStorage\.setItem\(key,JSON\.stringify\(saved\)\)/);
  assert.match(launch,/printStarterKit/);
  for(const token of ['recommendedModel','indicativeAmount','feeExampleJson','orderPolicy','latePolicyJson','simulationJson','adviceJson']) assert.ok(launch.includes(token),token);
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

test('starter kit is persisted by its dedicated owner and surfaced from group home',()=>{
  assert.match(launch,/const persistStarterKit=async\(groupId\)=>/);
  assert.match(launch,/app\.saveStarterKit\(groupId,data\)/);
  assert.doesNotMatch(launch,/GROUP\.STARTER_KIT/);
  assert.match(main,/launchStudio\.persistStarterKit\?\.\(group\.id\)/);
  assert.match(groupHome,/app\.starterKit\(group\.id\)/);
  assert.doesNotMatch(groupHome,/GROUP\.STARTER_KIT/);
  assert.match(groupHome,/Kit prêt à l’emploi du groupe/);
  assert.match(groupHome,/Ouvrir \/ imprimer le Kit/);
  assert.match(groupHome,/Ouvrir Business Studio/);
});

test('Business Studio supports catalog demand order communication actions and bounded agent',async()=>{
  const {service}=await setupBusiness();
  const client=await service.createClient({name:'Client A',type:'BUSINESS'});
  const offer=await service.createOffer({name:'Gestion mensuelle',unitPrice:25000,category:'GESTION'});
  assert.equal(offer.data.offerState,'ACTIVE');
  const request=await service.createRequest({title:'Besoin de gestion',need:'Structurer un nouveau groupe',clientId:client.id,estimatedBudget:30000});
  assert.equal(request.data.requestState,'OPEN');
  const quote=await service.createQuote({clientId:client.id,title:'Devis gestion',items:[{label:'Gestion',quantity:1,unitPrice:25000}]});
  await service.quoteDecision(quote.id,'ACCEPTED');
  const order=await service.createOrder({clientId:client.id,quoteId:quote.id,title:'Commande gestion',amount:25000});
  await service.setOrderState(order.id,'CONFIRMED');await service.setOrderState(order.id,'IN_PROGRESS');await service.setOrderState(order.id,'DELIVERED');
  await service.logCommunication({clientId:client.id,channel:'WHATSAPP',direction:'OUTBOUND',subject:'Relance devis',nextActionAt:'2026-09-22T10:00:00Z'});
  const action=await service.createAction({title:'Préparer réunion',clientId:client.id,priority:'HIGH'});await service.completeAction(action.id);
  const summary=await service.summary();
  assert.equal(summary.catalogOffers,1);assert.equal(summary.deliveredOrders,1);assert.ok(summary.followUpsDue>=1);
  const brief=await service.operatingBrief();
  assert.ok(Array.isArray(brief.actions)&&brief.actions.length>0);
  assert.ok(brief.guardrails.some(x=>/n’invente jamais un prix/.test(x)));
  assert.ok(brief.guardrails.some(x=>/paiement non enregistré/.test(x)));
});

test('Business Studio UI exposes a complete prospect-to-cash operating path',()=>{
  for(const token of ['Ajouter une offre au catalogue','Enregistrer une demande client','Créer une commande','Journaliser un échange / une relance','Créer une action de pilotage','Business Agent · plan d’action','Visibilité / publicité','Fournisseurs / approvisionnements','Créer un devis','Créer un contrat','Émettre une facture','Encaisser une facture','Saisir mon temps','Importer un honoraire validé du groupe','Plan de rentabilité complet'])
    assert.ok(businessUi.includes(token),token);
  for(const token of ['Taux d’impayés estimé','Membres minimum','Marge nette réelle','Offres catalogue','Demandes ouvertes','Commandes en cours','Relances dues','Rentabilité réelle par client / groupe','Fournisseurs connus','Approvisionnements','Prudent','Central','Optimiste'])
    assert.ok(businessUi.includes(token),token);
});
