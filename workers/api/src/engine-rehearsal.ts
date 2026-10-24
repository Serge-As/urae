import {InMemoryPlatformRepository,type PlatformRepository} from '../../../packages/repositories/src/index.js';
import {Outbox} from '../../../packages/offline/src/index.js';
import type {OutboxItem} from '../../../packages/contracts/src/index.js';
import {GroupLiveHub} from './group-live-hub.js';
import {starterRubricFacetsForName} from '../../../packages/rubrics/src/index.js';

type HandlerFactory=typeof import('./index.js').createApiHandler;
type RehearsalHost=NonNullable<NonNullable<Parameters<HandlerFactory>[1]>['liveNamespace']>;
// Called only after the Worker's ordinary authentication. Reuse the existing
// SQLite Durable Object host's CPU allowance, without its storage or group IDs.
export function forwardEngineRehearsal(namespace:RehearsalHost,request:Request):Promise<Response>{
  const isolated=new Request('https://rehearsal.internal/internal/engine-rehearsal',request),origin=request.headers.get('origin');
  for(const name of [...isolated.headers.keys()])isolated.headers.delete(name);
  isolated.headers.set('content-type','application/json');isolated.headers.set('x-eco-rehearsal','synthetic-v1');
  if(origin)isolated.headers.set('origin',origin);
  return namespace.get(namespace.idFromName('eco:diagnostics:engine-rehearsal:v1')).fetch(isolated);
}
type Scenario='LOST_ACK'|'LIVE_OUTAGE';
const tenant='rehearsal_t',group='rehearsal_g',actor='rehearsal_a',member='rehearsal_m',meeting='rehearsal_s',rubric='rehearsal_r';
const scenarios=new Set(['LOST_ACK','LIVE_OUTAGE']);
const requireValue=(ok:unknown,code:string):void=>{if(!ok)throw Error('REHEARSAL_INVARIANT_'+code);};
const same=(a:unknown,b:unknown):boolean=>JSON.stringify(a)===JSON.stringify(b);
export function prepareEngineRehearsal(scenario:unknown){
  if(!scenarios.has(String(scenario)))throw Error('REHEARSAL_SCENARIO_INVALID');
  const queue=new Outbox(),stamp=new Date().toISOString();
  const items=[2500,1500].map((amount,i)=>({...queue.enqueue({tenantId:tenant,actorId:actor,type:'FINANCIAL_SHEET_ENTRY_V1',idempotencyKey:'rehearsal-payment-'+i,payload:{groupId:group,membershipId:member,meetingId:meeting,rubricId:rubric,amount,nature:'REPAYMENT',targetAmount:i===0?2500:4000,baselineAmount:i===0?0:2500,baselineVersion:i}}),id:'rehearsal-item-'+i,createdAt:stamp,updatedAt:stamp}));
  return{protocol:'ECO_ENGINE_PLAN_1',recipeVersion:1,scenario:scenario as Scenario,syntheticOnly:true,items};
}
function validateItems(raw:unknown,scenario:Scenario):OutboxItem[]{
  if(!Array.isArray(raw)||raw.length!==2)throw Error('REHEARSAL_ITEMS_INVALID');
  const expected=prepareEngineRehearsal(scenario).items;
  return raw.map((value,index)=>{
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['id','tenantId','actorId','type','idempotencyKey','payload','status','attempts','createdAt','updatedAt'].includes(k)))throw Error('REHEARSAL_ITEMS_INVALID');
    const want=expected[index]!,item=value as OutboxItem;
    for(const key of ['id','tenantId','actorId','type','idempotencyKey','status','attempts']as const)if(item[key]!==want[key])throw Error('REHEARSAL_ITEMS_INVALID');
    const payload=item.payload as Record<string,unknown>,wanted=want.payload as Record<string,unknown>;
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).length!==Object.keys(wanted).length||Object.keys(wanted).some(key=>payload[key]!==wanted[key]))throw Error('REHEARSAL_ITEMS_INVALID');
    for(const date of [item.createdAt,item.updatedAt])if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(date)||!Number.isFinite(Date.parse(date)))throw Error('REHEARSAL_ITEMS_INVALID');
    return{...want,createdAt:item.createdAt,updatedAt:item.updatedAt};
  });
}

// This factory is injected by local qualification only. The HTTP route always
// uses the fresh in-memory default and receives no production bindings.
async function fixture(createHandler:HandlerFactory,repository:()=>PlatformRepository,rate=0,priority='CAPITAL_FIRST',timing='NEXT_SESSION_DUE'){
  const repo=repository(),stamp=new Date().toISOString(),values=new Map<string,unknown>();let unavailable=false;
  for(const id of [actor,'rehearsal_b','rehearsal_outsider'])await repo.saveUser({id,displayName:'Fictional '+id,locale:'fr',createdAt:stamp});
  await repo.saveGroup({id:group,tenantId:tenant,name:'Fictional rehearsal',kind:'association',status:'active',createdBy:actor,createdAt:stamp,governanceModel:'founder_managed'});
  for(const [id,userId]of [[member,actor],['rehearsal_mb','rehearsal_b']])await repo.saveMembership({id:id!,tenantId:tenant,groupId:group,userId:userId!,roles:['manager'],status:'active',joinedAt:stamp});
  for(let i=0;i<3;i++)await repo.saveMeeting({id:i===0?meeting:meeting+i,tenantId:tenant,groupId:group,title:'Fictional session '+i,status:'open',openedAt:new Date(Date.parse(stamp)+i*86400000).toISOString(),openedBy:actor});
  const facets=starterRubricFacetsForName('Prêt')!;
  await repo.saveRubricDefinition({id:rubric,tenantId:tenant,groupId:group,name:'Remboursements',aliases:[],version:1,facets:{...facets,direction:'INFLOW',custom:{systemKey:'REPAYMENT'}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp,updatedAt:stamp});
  await repo.saveRubricDefinition({id:'rehearsal_l',tenantId:tenant,groupId:group,name:'Prêt',aliases:[],version:1,facets:{...facets,custom:{systemKey:'LOAN'}},policies:{loan:{allowed:true,interestBase:'PRINCIPAL_ONLY',noInterestOnInterest:true,rateBasisPointsPerPeriod:rate,paymentPriority:priority as 'CAPITAL_FIRST'|'INTEREST_FIRST',interestTiming:timing as 'NEXT_SESSION_DUE'|'UPFRONT_DEDUCTED'|'UPFRONT_REQUIRED',fundingMode:'AVAILABLE_GROUP_CASH',carryForwardUnusedFunds:true}},status:'ACTIVE',source:'GROUP_CUSTOM',createdAt:stamp,updatedAt:stamp});
  await repo.saveWorkspaceRecord({id:'rehearsal_loan',tenantId:tenant,groupId:group,moduleId:'FINANCE.LOANS',title:'Fictional loan',status:'ACTIVE',tags:['completion','kind:LOAN','state:APPROVED'],data:{completionKind:'LOAN',completionState:'APPROVED',completionVersion:3,principal:10000,rubricId:'rehearsal_l',borrowerMembershipId:member,outstandingPrincipal:0,unpaidInterest:0,currency:'XAF',paymentPriority:priority,interestTiming:timing,rateBasisPointsPerPeriod:rate},createdBy:actor,createdAt:stamp,updatedAt:stamp});
  const storage={get:async(key:string)=>structuredClone(values.get(key)),put:async(key:string,value:unknown)=>{values.set(key,structuredClone(value));},delete:async(key:string)=>values.delete(key),list:async({prefix='',startAfter='',limit=1000}={})=>new Map([...values].filter(([key])=>key.startsWith(prefix)&&key>startAfter).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([key,value])=>[key,structuredClone(value)]))};
  const hub=new GroupLiveHub({storage}as any,{}),liveNamespace={idFromName:(id:string)=>id,get:()=>({fetch:async(request:Request)=>unavailable&&new URL(request.url).pathname.endsWith('/publish')?new Response('Synthetic Live outage',{status:503}):hub.fetch(request)})};
  const handler=createHandler(repo,{premiumLive:true,liveNamespace:liveNamespace as any});
  const send=async(path:string,method='GET',body?:unknown,who=actor)=>{
    const response=await handler(new Request('https://rehearsal.invalid/api/v1/'+path,{method,headers:{'content-type':'application/json','x-tenant-id':tenant,'x-actor-id':who,'x-active-group-id':group,'x-group-roles':'manager'},body:body===undefined?undefined:JSON.stringify(body)}));
    return{status:response.status,body:await response.json()as any};
  };
  const request=async(path:string,method='GET',body?:unknown)=>{const result=await send(path,method,body);if(result.status>=400)throw Error('REHEARSAL_CANONICAL_'+String(result.body.error));return result.body;};
  await request('groups/'+group+'/ledger/opening-balance','POST',{amount:20000,currency:'XAF',idempotencyKey:'rehearsal-opening',note:'Fictional opening'});
  const disbursement=await request('groups/'+group+'/loans/rehearsal_loan/disburse','POST',{amount:10000,expectedVersion:3,meetingId:meeting,rubricId:'rehearsal_l',idempotencyKey:'rehearsal-disburse'});
  return{repo,hub,request,send,disbursement,setUnavailable:(value:boolean)=>{unavailable=value;}};
}

export async function executeEngineRehearsal(createHandler:HandlerFactory,input:{scenario:unknown;items:unknown},repository:()=>PlatformRepository=()=>new InMemoryPlatformRepository()){
  if(!scenarios.has(String(input.scenario)))throw Error('REHEARSAL_SCENARIO_INVALID');
  const scenario=input.scenario as Scenario,items=validateItems(input.items,scenario),f=await fixture(createHandler,repository),checks:Array<{code:string;expected:unknown;actual:unknown;passed:boolean}>=[],timeline:Array<{step:number;state:string}>=[];
  const check=(code:string,expected:unknown,actual:unknown)=>{const passed=same(expected,actual);checks.push({code,expected,actual,passed});requireValue(passed,code);};
  const step=(state:string)=>timeline.push({step:timeline.length+1,state});
  check('DISBURSED_PRINCIPAL',10000,Number(f.disbursement.loan.data.outstandingPrincipal));step('LOAN_DISBURSED');
  let queue=new Outbox();queue.restore(items);step('OFFLINE_QUEUE_RESTORED');
  if(scenario==='LIVE_OUTAGE')f.setUnavailable(true);
  let dropped=false;
  const deliver=async(item:OutboxItem)=>{
    const response=await f.send('outbox/apply','POST',item);
    if(response.status>=400)return{ok:false,conflict:true,error:'REHEARSAL_CANONICAL_REJECTED',result:response.body};
    if(scenario==='LOST_ACK'&&!dropped){dropped=true;step('SERVER_COMMITTED_ACK_LOST');throw Error('SYNTHETIC_ACK_LOST');}
    return{ok:response.body.accepted===true&&response.body.stored!==false,result:response.body};
  };
  await queue.sync(deliver);
  const intermediate=queue.list().map(item=>({index:items.findIndex(x=>x.id===item.id),status:item.status}));
  const projections=await f.repo.listWorkspaceRecords(tenant,'FINANCE.LIVE_PROJECTION',group),pending=projections.filter(row=>row.status==='ACTIVE').length;
  const before=(await f.repo.listLedgerEntries(tenant,group)).map(row=>row.id).sort();
  let faultObserved=false;
  if(scenario==='LOST_ACK'){
    faultObserved=dropped&&queue.list().some(item=>item.status==='FAILED');check('ACK_FAILURE_OBSERVED',true,faultObserved);step('FAILED_QUEUE_SAVED');
    const restored=new Outbox();restored.restore(queue.durableItems());queue=restored;step('FAILED_QUEUE_RELOADED');await queue.sync(deliver);step('SAME_COMMAND_RETRIED');
  }else{
    faultObserved=pending>0;check('DURABLE_LIVE_BACKLOG_OBSERVED',true,faultObserved);f.setUnavailable(false);step('LIVE_TRANSPORT_RESTORED');await f.request('groups/'+group+'/live/retry-pending','POST',{});step('DURABLE_PROJECTIONS_RETRIED');
  }
  check('NO_DUPLICATE_LEDGER',before,(await f.repo.listLedgerEntries(tenant,group)).map(row=>row.id).sort());
  check('ACKNOWLEDGED_QUEUE',['CONFIRMED','CONFIRMED'],queue.list().map(item=>item.status));
  const loan=await f.repo.getWorkspaceRecord(tenant,'rehearsal_loan');check('REMAINING_PRINCIPAL',6000,Number(loan?.data.outstandingPrincipal));
  const ledger=await f.request('groups/'+group+'/ledger');check('CASH_BALANCE',14000,Number(ledger.summary.cashBalance));
  check('BALANCED_LEDGER',true,(await f.repo.listLedgerEntries(tenant,group)).every(row=>row.lines.reduce((sum,line)=>sum+line.debit-line.credit,0)===0));
  const observers=[];
  for(const who of [actor,'rehearsal_b']){
    const response=await f.hub.fetch(new Request('https://rehearsal.invalid/events?after=0&limit=100&manager=1&userId='+who)),page=await response.json()as any;
    const cells=(page.events??[]).filter((row:any)=>row.payload?.rubricId===rubric&&row.payload?.newAmount!==undefined).sort((a:any,b:any)=>Number(a.payload.cellVersion)-Number(b.payload.cellVersion));
    const amount=Number(cells.at(-1)?.payload.newAmount);check(who===actor?'LIVE_OBSERVER_A':'LIVE_OBSERVER_B',4000,amount);observers.push({observer:observers.length+1,amount});
  }
  check('LIVE_BACKLOG_CLEARED',0,(await f.repo.listWorkspaceRecords(tenant,'FINANCE.LIVE_PROJECTION',group)).filter(row=>row.status==='ACTIVE').length);
  const forbidden=await f.send('groups/'+group+'/ledger','GET',undefined,'rehearsal_outsider');check('UNRELATED_ACTOR_DENIED',403,forbidden.status);
  const policies:Array<Awaited<ReturnType<typeof executeLoanPolicyRehearsal>>['policy']>=[];
  for(const priority of ['CAPITAL_FIRST','INTEREST_FIRST'])for(const timing of ['NEXT_SESSION_DUE','UPFRONT_REQUIRED','UPFRONT_DEDUCTED']){
    const probe=await executeLoanPolicyRehearsal(createHandler,{priority,timing},repository);checks.push(...probe.checks);policies.push(probe.policy);
  }
  step('CANONICAL_INVARIANTS_VERIFIED');
  return{protocol:'ECO_ENGINE_REHEARSAL_1',recipeVersion:1,scenario,syntheticOnly:true,realDataRead:false,productionFinancialWrites:false,productionLiveWrites:false,canonicalEngines:['LEDGER','LOANS','SHEET_OUTBOX','OUTBOX','GROUP_LIVE_HUB'],faultInjected:true,faultObserved,recovered:true,currentImplementationHealthy:true,timeline,intermediate,checks,observers,policies,totals:{borrowed:10000,repaid:4000,remainingPrincipal:6000,cashBalance:14000},finalQueue:queue.list(),fieldAcceptance:'NOT_ACCEPTED'};
}

// The six finite policy probes execute inside the isolated compute host's
// request, without another HTTP call or a production repository.
export async function executeLoanPolicyRehearsal(createHandler:HandlerFactory,input:{priority:unknown;timing:unknown},repository:()=>PlatformRepository=()=>new InMemoryPlatformRepository()){
    const priority=String(input.priority),timing=String(input.timing);
    if(!['CAPITAL_FIRST','INTEREST_FIRST'].includes(priority)||!['NEXT_SESSION_DUE','UPFRONT_REQUIRED','UPFRONT_DEDUCTED'].includes(timing))throw Error('REHEARSAL_POLICY_INVALID');
    const checks:Array<{code:string;expected:unknown;actual:unknown;passed:boolean}>=[];
    const check=(code:string,expected:unknown,actual:unknown)=>{const passed=same(expected,actual);checks.push({code,expected,actual,passed});requireValue(passed,code);};
    const p=await fixture(createHandler,repository,1000,priority,timing),upfront=timing==='NEXT_SESSION_DUE'?0:1000;
    check(priority+'_'+timing+'_UPFRONT',upfront,Number(p.disbursement.upfrontInterest));
    const one=await p.request('groups/'+group+'/loans/rehearsal_loan/repay','POST',{paymentAmount:2500,expectedVersion:4,meetingId:meeting+'1',rubricId:rubric,idempotencyKey:'rehearsal-policy-one'});
    const capital=priority==='CAPITAL_FIRST'?7500:8500,interest=priority==='CAPITAL_FIRST'?1000:0;
    check(priority+'_'+timing+'_CAPITAL',capital,Number(one.loan.data.outstandingPrincipal));check(priority+'_'+timing+'_SEPARATE_INTEREST',interest,Number(one.loan.data.unpaidInterest));
    const two=await p.request('groups/'+group+'/loans/rehearsal_loan/repay','POST',{paymentAmount:1,expectedVersion:Number(one.loan.data.completionVersion),meetingId:meeting+'2',rubricId:rubric,idempotencyKey:'rehearsal-policy-two'});
    const expectedInterest=interest+Math.round(capital/10)-(priority==='INTEREST_FIRST'?1:0);
    check(priority+'_'+timing+'_NO_COMPOUNDING',expectedInterest,Number(two.loan.data.unpaidInterest));
    return{protocol:'ECO_LOAN_POLICY_REHEARSAL_1',syntheticOnly:true,checks,policy:{priority,timing,upfront,principalAfterFirstPayment:capital,unpaidInterestAfterFirstPayment:interest,unpaidInterestAfterNextPeriod:expectedInterest}};
}
