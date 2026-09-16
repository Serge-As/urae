import test from 'node:test';
import assert from 'node:assert/strict';
import {PlatformKernel} from '../.build/packages/platform-kernel/src/index.js';
import {InMemoryPlatformRepository} from '../.build/packages/repositories/src/index.js';
import {FoundationService} from '../.build/packages/domain/src/index.js';
import {applyLoanPayment} from '../.build/packages/completion/src/index.js';
import {analyzeGovernanceText,interpretLaunchPrompt} from '../.build/packages/guided-assistant/src/index.js';

const rubric={key:'rotation',name:'Tontine',kind:'TONTINE',nominalAmount:{currency:'XAF',amount:2000},amountBasis:'PER_SHARE',participationMode:'OPTIONAL',contributionMode:'MONEY',memberCount:2,shareCount:2,potCount:1,sessions:2,duration:{value:2,unit:'SESSIONS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0};
const ctx=(kernel,activeGroupId)=>kernel.context.set({tenantId:'tenant_a',actorId:'owner',activeGroupId,groupRoles:['founder','manager'],mandateIds:[],deviceId:'d',sessionId:'s',locale:'fr',timezone:'Africa/Douala',connectivity:'online',requestId:'r'});

test('loan allocation matches the two validated models and never capitalizes unpaid interest',()=>{
  const capital=applyLoanPayment({principalOutstanding:5000,unpaidInterest:0,paymentAmount:1000,rateBasisPointsPerPeriod:500,priority:'CAPITAL_FIRST'});
  assert.equal(capital.interestAccrued,250);assert.equal(capital.principalPaid,1000);assert.equal(capital.interestPaid,0);
  assert.equal(capital.remainingPrincipal,4000);assert.equal(capital.unpaidInterestAfter,250);assert.equal(capital.totalDebtAfter,4250);
  const nextCapital=applyLoanPayment({principalOutstanding:capital.remainingPrincipal,unpaidInterest:capital.unpaidInterestAfter,paymentAmount:0,rateBasisPointsPerPeriod:500,priority:'CAPITAL_FIRST'});
  assert.equal(nextCapital.interestAccrued,200,'only 4000 principal is taxed');assert.equal(nextCapital.totalInterestDue,450);

  const interest=applyLoanPayment({principalOutstanding:5000,unpaidInterest:0,paymentAmount:1000,rateBasisPointsPerPeriod:500,priority:'INTEREST_FIRST'});
  assert.equal(interest.interestAccrued,250);assert.equal(interest.interestPaid,250);assert.equal(interest.principalPaid,750);
  assert.equal(interest.remainingPrincipal,4250);assert.equal(interest.unpaidInterestAfter,0);assert.equal(interest.totalDebtAfter,4250);
  const nextInterest=applyLoanPayment({principalOutstanding:interest.remainingPrincipal,unpaidInterest:0,paymentAmount:0,rateBasisPointsPerPeriod:500,priority:'INTEREST_FIRST'});
  assert.equal(nextInterest.interestAccrued,213,'rounding is applied to 4250 principal only');
});

test('governance assistant returns sourced drafts but no financial action',()=>{
  const text='Le Secours est obligatoire et fixé à 24 000 FCFA par membre. La Collation est de 2 000 FCFA par réunion même en cas absence. Il existe plusieurs Tontines dont une Tontine de 2 000 F et des tontines en nature savon et huile. Le taux intérêt de tout emprunt est 5%. Les droits de timbre sont 100 FCFA.';
  const suggestions=analyzeGovernanceText(text);
  assert.ok(suggestions.some(x=>x.rubric?.kind==='SOLIDARITY'));
  assert.ok(suggestions.some(x=>x.rubric?.kind==='TONTINE'));
  assert.ok(suggestions.some(x=>x.category==='LOAN_RULE'&&x.rule?.noInterestOnInterest===true));
  assert.ok(suggestions.every(x=>x.evidence.length>0));
  const draft=interpretLaunchPrompt('Notre association existe déjà, 25 membres, réunion mensuelle. Je veux parler au lieu de tout écrire et cela doit marcher en 2G.');
  assert.equal(draft.origin?.mode,'IMPORT_EXISTING');assert.equal(draft.family,'association');assert.equal(draft.members?.expectedMembers,25);
  assert.equal(draft.accessibility?.oralAssistant,true);assert.ok(draft.notes.includes('NO_FINANCIAL_WRITE'));
});

test('registered rotating tontine evolves to association without changing group identity',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel);
  const service=new FoundationService(repo,kernel);
  const first=await service.createProject({tenantId:'tenant_a',createdBy:'owner',name:'Amis Rotatifs',kind:'rotating_tontine',governanceModel:'community',rubrics:[rubric],launchProfile:{origin:{mode:'NEW'},previewConfirmed:true}});
  const group=await service.convertProjectToGroup('tenant_a',first.id);assert.equal(group.kind,'rotating_tontine');
  ctx(kernel,group.id);
  const evolutionRubric={...rubric,key:'rotation_2000',name:'Tontine 2 000'};
  const second=await service.createProject({tenantId:'tenant_a',createdBy:'owner',name:'Association des Amis',kind:'association',governanceModel:'community',rubrics:[evolutionRubric],launchProfile:{origin:{mode:'TRANSFORM_REGISTERED',sourceGroupId:group.id,currentExerciseLabel:'2026-2027'},previewConfirmed:true}});
  const evolved=await service.convertProjectToGroup('tenant_a',second.id);
  assert.equal(evolved.id,group.id);assert.equal(evolved.kind,'association');assert.equal(evolved.evolvedFromKind,'rotating_tontine');
  assert.equal(evolved.createdAt,group.createdAt);assert.equal((await repo.listGroups('tenant_a')).length,1);
});


test('assistance modalities are deferred from the RI into an event-by-event rulebook draft',()=>{
  const text='Section Assistances. En cas de maladie, le membre reçoit 50 000 FCFA de la caisse Assistance. En cas de deuil, une main levée de 10 000 FCFA par membre est organisée. Pour un mariage, une main levée de 5 000 FCFA par membre est prévue. Pour le baptême, le Bureau décide selon les circonstances.';
  const suggestions=analyzeGovernanceText(text),assistance=suggestions.find(x=>x.rubric?.kind==='ASSISTANCE');
  assert.ok(assistance);
  assert.equal(assistance.rubric.policyDraft.assistance.reviewStatus,'DEFERRED');
  assert.equal(assistance.rubric.policyDraft.assistance.definitionSource,'GOVERNANCE_DOCUMENT');
  const labels=assistance.rubric.policyDraft.assistance.eventRules.map(x=>x.label);
  assert.ok(labels.includes('Maladie'));assert.ok(labels.includes('Deuil / décès'));assert.ok(labels.includes('Mariage'));assert.ok(labels.includes('Baptême'));
});

test('registration pricing can distinguish returning and new members or make re-registration free',()=>{
  const priced=analyzeGovernanceText("Les frais d'inscription sont fixés selon l'ancienneté : les anciens membres paient 500 FCFA et les nouveaux membres paient 1 000 FCFA.");
  const registration=priced.find(x=>x.title==='Inscription')?.rubric?.policyDraft?.registration;
  assert.equal(registration.pricingModel,'BY_MEMBER_STATUS');
  assert.equal(registration.returningMemberAmount.amount,500);
  assert.equal(registration.newMemberAmount.amount,1000);
  const free=analyzeGovernanceText("La réinscription est gratuite pour les anciens membres. Les nouveaux membres paient 2 000 FCFA d'inscription.");
  const freePolicy=free.find(x=>x.title==='Inscription')?.rubric?.policyDraft?.registration;
  assert.equal(freePolicy.pricingModel,'BY_MEMBER_STATUS');assert.equal(freePolicy.freeReturningMembers,true);assert.equal(freePolicy.newMemberAmount.amount,2000);
});

test('converted group preserves launch exercise context for contextual services',async()=>{
  const repo=new InMemoryPlatformRepository(),kernel=new PlatformKernel();ctx(kernel);
  const service=new FoundationService(repo,kernel);
  const project=await service.createProject({tenantId:'tenant_a',createdBy:'owner',name:'Groupe contextualisé',kind:'association',governanceModel:'community',rubrics:[rubric],launchProfile:{origin:{mode:'IMPORT_EXISTING',currentExerciseLabel:'2026-2027'},cycle:{startsAt:'2026-09-01',expectedSessions:12,cadence:'MONTHLY'},accessibility:{lowBandwidthPriority:true},previewConfirmed:true}});
  const group=await service.convertProjectToGroup('tenant_a',project.id);
  assert.equal(group.launchProfileSnapshot.origin.mode,'IMPORT_EXISTING');
  assert.equal(group.launchProfileSnapshot.cycle.expectedSessions,12);
  assert.equal(group.launchProfileSnapshot.accessibility.lowBandwidthPriority,true);
});
