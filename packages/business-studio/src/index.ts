import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

type BusinessKind='WORKSPACE'|'MANDATE'|'CLIENT'|'OFFER'|'REQUEST'|'QUOTE'|'ORDER'|'CONTRACT'|'INVOICE'|'EXPENSE'|'PAYMENT'|'REVENUE'|'TIME'|'COMMUNICATION'|'ACTION'|'SCENARIO';
type Money={amount:number;currency:string};
const now=()=>new Date().toISOString();
const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const int=(v:unknown,name:string,allowZero=true)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<(allowZero?0:1))throw new Error('INVALID_'+name.toUpperCase());return n;};
const required=(v:unknown,name:string,max=240)=>{const s=String(v??'').trim();if(!s)throw new Error(name.toUpperCase()+'_REQUIRED');return s.slice(0,max);};
const json=<T>(v:unknown,fallback:T):T=>{try{return JSON.parse(String(v??'')) as T;}catch{return fallback;}};

export interface BusinessSummary{
  currency:string;quoted:number;invoiced:number;received:number;invoicePayments:number;directRevenue:number;expenses:number;outstanding:number;margin:number;
  activeMandates:number;activeClients:number;prospects:number;hours:number;breakEvenRevenue:number;netMarginPerHour:number;
  overdueInvoices:number;openQuotes:number;catalogOffers:number;openRequests:number;openOrders:number;deliveredOrders:number;followUpsDue:number;revenueBySource:Record<string,number>;expenseByCategory:Record<string,number>;
}

export class BusinessStudioService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}

  private async actorWorkspace():Promise<WorkspaceRecord>{
    const ctx=this.kernel.context.get(),id='business_workspace_'+encodeURIComponent(ctx.actorId),existing=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(existing&&existing.createdBy!==ctx.actorId)throw new Error('FORBIDDEN_SCOPE');
    if(existing)return existing;
    const at=now(),record:WorkspaceRecord={id,tenantId:ctx.tenantId,moduleId:'MANAGER.BUSINESS_STUDIO',title:'Mon activité professionnelle',summary:'Cockpit privé du gestionnaire.',status:'ACTIVE',tags:['business-studio','private'],data:{businessKind:'WORKSPACE',currency:'XAF',version:1},createdBy:ctx.actorId,createdAt:at,updatedAt:at};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  private async owned(kind?:BusinessKind){
    const ctx=this.kernel.context.get();await this.actorWorkspace();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId)).filter(r=>r.createdBy===ctx.actorId&&r.tags.includes('business-studio')&&(!kind||r.data.businessKind===kind));
  }
  private async groupManager(groupId:Id){
    const ctx=this.kernel.context.get(),g=await this.repo.getGroup(ctx.tenantId,groupId);if(!g)throw new Error('GROUP_NOT_FOUND');
    if(g.createdBy===ctx.actorId)return g;
    const m=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
    if(!m||!m.roles.some(r=>managerRoles.has(r)))throw new Error('FORBIDDEN_SCOPE');return g;
  }
  private async save(kind:BusinessKind,title:string,data:Record<string,string|number|boolean|null>,status:WorkspaceRecord['status']='ACTIVE'){
    const ctx=this.kernel.context.get(),at=now(),record:WorkspaceRecord={id:makeId('biz'),tenantId:ctx.tenantId,moduleId:'MANAGER.BUSINESS_STUDIO',title,status,tags:['business-studio','kind:'+kind.toLowerCase()],data:{...data,businessKind:kind,version:1},createdBy:ctx.actorId,createdAt:at,updatedAt:at};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  private async mutate(id:Id,patch:Record<string,string|number|boolean|null>,status?:WorkspaceRecord['status']){
    const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!r||r.createdBy!==ctx.actorId||!r.tags.includes('business-studio'))throw new Error('BUSINESS_RECORD_NOT_FOUND');
    const next={...r,status:status??r.status,data:{...r.data,...patch,version:Number(r.data.version??1)+1},updatedAt:now()};await this.repo.saveWorkspaceRecord(next);return next;
  }

  async configure(input:{name:string;currency?:string;services?:string[];locality?:string;monthlyFixedCosts?:number}){
    const w=await this.actorWorkspace(),name=required(input.name,'business_name'),currency=required(input.currency??'XAF','currency',12);
    const next={...w,title:name,summary:input.locality?.trim()||w.summary,data:{...w.data,currency,servicesJson:JSON.stringify([...new Set(input.services??[])].slice(0,50)),locality:input.locality?.trim()??'',monthlyFixedCosts:int(input.monthlyFixedCosts??0,'monthly_fixed_costs'),version:Number(w.data.version??1)+1},updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);return next;
  }

  async createMandate(input:{groupId:Id;services:string[];startsAt:string;endsAt?:string;feeModel:'FIXED'|'PER_SESSION'|'PERCENT_SANDBOX'|'CUSTOM';feeAmount?:number;currency?:string;approvalsRequired?:string[]}){
    const g=await this.groupManager(input.groupId),starts=new Date(input.startsAt);if(!Number.isFinite(starts.getTime()))throw new Error('INVALID_STARTS_AT');
    if(input.endsAt&&Date.parse(input.endsAt)<=starts.getTime())throw new Error('INVALID_ENDS_AT');
    const services=[...new Set(input.services.map(x=>x.trim()).filter(Boolean))];if(!services.length)throw new Error('MANDATE_SERVICES_REQUIRED');
    return this.save('MANDATE','Mandat · '+g.name,{groupId:g.id,servicesJson:JSON.stringify(services),startsAt:starts.toISOString(),endsAt:input.endsAt?new Date(input.endsAt).toISOString():'',feeModel:input.feeModel,feeAmount:int(input.feeAmount??0,'fee_amount'),currency:input.currency??'XAF',approvalsRequiredJson:JSON.stringify(input.approvalsRequired??[]),mandateState:'DRAFT'});
  }
  async activateMandate(id:Id){
    const ctx=this.kernel.context.get(),r=await this.repo.getWorkspaceRecord(ctx.tenantId,id);if(!r||r.createdBy!==ctx.actorId||r.data.businessKind!=='MANDATE')throw new Error('MANDATE_NOT_FOUND');
    await this.groupManager(String(r.data.groupId));return this.mutate(id,{mandateState:'ACTIVE',activatedAt:now()});
  }
  async endMandate(id:Id,reason:string){return this.mutate(id,{mandateState:'ENDED',endedAt:now(),endReason:required(reason,'reason',500)},'DONE');}

  async createClient(input:{name:string;type:'GROUP'|'PERSON'|'BUSINESS'|'NGO'|'OTHER';groupId?:Id;contactRef?:string;consentToContact?:boolean}){
    if(input.groupId)await this.groupManager(input.groupId);
    return this.save('CLIENT',required(input.name,'client_name'),{clientType:input.type,groupId:input.groupId??'',contactRef:input.contactRef?.trim()??'',consentToContact:Boolean(input.consentToContact),clientState:'PROSPECT'});
  }
  async setClientState(id:Id,state:'PROSPECT'|'ACTIVE'|'PAUSED'|'CLOSED'){return this.mutate(id,{clientState:state},state==='CLOSED'?'DONE':'ACTIVE');}

  async createOffer(input:{name:string;description?:string;category?:string;unitPrice?:number;currency?:string;active?:boolean}){
    return this.save('OFFER',required(input.name,'offer_name'),{
      description:input.description?.trim().slice(0,2000)??'',category:input.category?.trim().slice(0,120)??'SERVICE',
      unitPrice:int(input.unitPrice??0,'unit_price'),currency:input.currency??'XAF',offerState:input.active===false?'PAUSED':'ACTIVE'
    },'ACTIVE');
  }
  async setOfferState(id:Id,state:'ACTIVE'|'PAUSED'|'ARCHIVED'){return this.mutate(id,{offerState:state},state==='ARCHIVED'?'ARCHIVED':'ACTIVE');}

  async createRequest(input:{title:string;need:string;clientId?:Id;estimatedBudget?:number;dueAt?:string;source?:string}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.dueAt&&!Number.isFinite(Date.parse(input.dueAt)))throw new Error('INVALID_DUE_AT');
    return this.save('REQUEST',required(input.title,'request_title'),{
      need:required(input.need,'need',3000),clientId:input.clientId??'',estimatedBudget:int(input.estimatedBudget??0,'estimated_budget'),
      dueAt:input.dueAt?new Date(input.dueAt).toISOString():'',source:input.source?.trim().slice(0,120)??'DIRECT',requestState:'OPEN'
    });
  }
  async setRequestState(id:Id,state:'OPEN'|'QUALIFIED'|'QUOTED'|'WON'|'LOST'|'CLOSED'){return this.mutate(id,{requestState:state},['LOST','CLOSED'].includes(state)?'DONE':'ACTIVE');}

  async createQuote(input:{clientId:Id;title:string;items:Array<{label:string;quantity:number;unitPrice:number}>;currency?:string;validUntil?:string}){
    const client=(await this.owned('CLIENT')).find(x=>x.id===input.clientId);if(!client)throw new Error('CLIENT_NOT_FOUND');
    const items=input.items.map(x=>({label:required(x.label,'item_label'),quantity:int(x.quantity,'quantity',false),unitPrice:int(x.unitPrice,'unit_price')}));if(!items.length)throw new Error('QUOTE_ITEMS_REQUIRED');
    const total=items.reduce((n,x)=>n+x.quantity*x.unitPrice,0);
    return this.save('QUOTE',required(input.title,'quote_title'),{clientId:client.id,itemsJson:JSON.stringify(items),total,currency:input.currency??'XAF',validUntil:input.validUntil??'',quoteState:'DRAFT'});
  }
  async quoteDecision(id:Id,state:'SENT'|'ACCEPTED'|'REJECTED'|'EXPIRED'){return this.mutate(id,{quoteState:state,decisionAt:now()},state==='REJECTED'||state==='EXPIRED'?'DONE':'ACTIVE');}

  async createOrder(input:{clientId:Id;title:string;amount:number;currency?:string;quoteId?:Id;contractId?:Id;dueAt?:string}){
    const client=(await this.owned('CLIENT')).find(x=>x.id===input.clientId);if(!client)throw new Error('CLIENT_NOT_FOUND');
    if(input.quoteId&&!(await this.owned('QUOTE')).some(x=>x.id===input.quoteId))throw new Error('QUOTE_NOT_FOUND');
    if(input.contractId&&!(await this.owned('CONTRACT')).some(x=>x.id===input.contractId))throw new Error('CONTRACT_NOT_FOUND');
    if(input.dueAt&&!Number.isFinite(Date.parse(input.dueAt)))throw new Error('INVALID_DUE_AT');
    return this.save('ORDER',required(input.title,'order_title'),{
      clientId:client.id,quoteId:input.quoteId??'',contractId:input.contractId??'',amount:int(input.amount,'order_amount',false),currency:input.currency??'XAF',
      dueAt:input.dueAt?new Date(input.dueAt).toISOString():'',orderState:'DRAFT'
    });
  }
  async setOrderState(id:Id,state:'DRAFT'|'CONFIRMED'|'IN_PROGRESS'|'DELIVERED'|'CANCELLED'){
    const r=(await this.owned('ORDER')).find(x=>x.id===id);if(!r)throw new Error('ORDER_NOT_FOUND');
    const current=String(r.data.orderState??'DRAFT'),allowed:Record<string,string[]>={DRAFT:['CONFIRMED','CANCELLED'],CONFIRMED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['DELIVERED','CANCELLED'],DELIVERED:[],CANCELLED:[]};
    if(current!==state&&!allowed[current]?.includes(state))throw new Error('INVALID_ORDER_TRANSITION');
    return this.mutate(id,{orderState:state,stateChangedAt:now()},['DELIVERED','CANCELLED'].includes(state)?'DONE':'ACTIVE');
  }

  async createContract(input:{clientId:Id;quoteId?:Id;title:string;startsAt:string;endsAt?:string;scope:string}){
    const client=(await this.owned('CLIENT')).find(x=>x.id===input.clientId);if(!client)throw new Error('CLIENT_NOT_FOUND');
    if(input.quoteId&&!(await this.owned('QUOTE')).some(x=>x.id===input.quoteId))throw new Error('QUOTE_NOT_FOUND');
    return this.save('CONTRACT',required(input.title,'contract_title'),{clientId:client.id,quoteId:input.quoteId??'',startsAt:required(input.startsAt,'starts_at'),endsAt:input.endsAt??'',scope:required(input.scope,'scope',2000),contractState:'ACTIVE'});
  }

  async issueInvoice(input:{clientId:Id;contractId?:Id;amount:number;currency?:string;dueAt:string;collectiveLedgerEntryId?:Id;groupId?:Id}){
    const client=(await this.owned('CLIENT')).find(x=>x.id===input.clientId);if(!client)throw new Error('CLIENT_NOT_FOUND');
    if(input.contractId&&!(await this.owned('CONTRACT')).some(x=>x.id===input.contractId))throw new Error('CONTRACT_NOT_FOUND');
    if(input.groupId){await this.groupManager(input.groupId);if(input.collectiveLedgerEntryId&&!await this.repo.getLedgerEntry(this.kernel.context.get().tenantId,input.groupId,input.collectiveLedgerEntryId))throw new Error('LEDGER_ENTRY_NOT_FOUND');}
    const amount=int(input.amount,'invoice_amount',false),due=new Date(input.dueAt);if(!Number.isFinite(due.getTime()))throw new Error('INVALID_DUE_AT');
    return this.save('INVOICE','Facture · '+client.title,{clientId:client.id,contractId:input.contractId??'',amount,currency:input.currency??'XAF',dueAt:due.toISOString(),invoiceState:'ISSUED',receivedAmount:0,groupId:input.groupId??'',collectiveLedgerEntryId:input.collectiveLedgerEntryId??''});
  }

  async recordPayment(input:{invoiceId:Id;amount:number;method:'CASH'|'MOMO'|'OM'|'BANK'|'OTHER';reference?:string}){
    const invoice=(await this.owned('INVOICE')).find(x=>x.id===input.invoiceId);if(!invoice)throw new Error('INVOICE_NOT_FOUND');
    const amount=int(input.amount,'payment_amount',false),received=Number(invoice.data.receivedAmount??0),total=Number(invoice.data.amount??0);if(received+amount>total)throw new Error('PAYMENT_EXCEEDS_INVOICE');
    const payment=await this.save('PAYMENT','Paiement · '+invoice.title,{invoiceId:invoice.id,amount,currency:String(invoice.data.currency??'XAF'),method:input.method,reference:input.reference?.trim()??'',receivedAt:now()});
    await this.mutate(invoice.id,{receivedAmount:received+amount,invoiceState:received+amount===total?'PAID':'PARTIAL'},received+amount===total?'DONE':'ACTIVE');return payment;
  }

  async recordExpense(input:{label:string;amount:number;currency?:string;category:'TRAVEL'|'TRANSPORT'|'SUPPLIES'|'TRAINING'|'COMMUNICATION'|'INTERNET_DATA'|'LABOUR'|'PERSONNEL'|'RENT'|'ADVERTISING'|'PROCUREMENT'|'LOSS'|'FEES'|'OTHER';clientId?:Id;groupId?:Id;collectiveLedgerEntryId?:Id}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.groupId){await this.groupManager(input.groupId);if(input.collectiveLedgerEntryId&&!await this.repo.getLedgerEntry(this.kernel.context.get().tenantId,input.groupId,input.collectiveLedgerEntryId))throw new Error('LEDGER_ENTRY_NOT_FOUND');}
    return this.save('EXPENSE',required(input.label,'expense_label'),{amount:int(input.amount,'expense_amount',false),currency:input.currency??'XAF',category:input.category,clientId:input.clientId??'',groupId:input.groupId??'',collectiveLedgerEntryId:input.collectiveLedgerEntryId??'',occurredAt:now()});
  }

  async recordRevenue(input:{label:string;amount:number;currency?:string;source:'MANAGEMENT_FEE'|'HONORARIUM'|'COMMISSION'|'SUPPLIER_DISCOUNT'|'SERVICE'|'OTHER';clientId?:Id;groupId?:Id;collectiveLedgerEntryId?:Id;reference?:string}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.groupId){
      await this.groupManager(input.groupId);
      if(!input.collectiveLedgerEntryId)throw new Error('COLLECTIVE_REVENUE_LEDGER_REFERENCE_REQUIRED');
      if(!await this.repo.getLedgerEntry(this.kernel.context.get().tenantId,input.groupId,input.collectiveLedgerEntryId))throw new Error('LEDGER_ENTRY_NOT_FOUND');
    }
    return this.save('REVENUE',required(input.label,'revenue_label'),{amount:int(input.amount,'revenue_amount',false),currency:input.currency??'XAF',source:input.source,clientId:input.clientId??'',groupId:input.groupId??'',collectiveLedgerEntryId:input.collectiveLedgerEntryId??'',reference:input.reference?.trim().slice(0,240)??'',receivedAt:now()});
  }

  async logCommunication(input:{clientId?:Id;channel:'CALL'|'WHATSAPP'|'SMS'|'EMAIL'|'IN_PERSON'|'OTHER';direction:'OUTBOUND'|'INBOUND';subject:string;note?:string;nextActionAt?:string}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.nextActionAt&&!Number.isFinite(Date.parse(input.nextActionAt)))throw new Error('INVALID_NEXT_ACTION_AT');
    return this.save('COMMUNICATION','Échange · '+required(input.subject,'subject'),{
      clientId:input.clientId??'',channel:input.channel,direction:input.direction,note:input.note?.trim().slice(0,3000)??'',
      nextActionAt:input.nextActionAt?new Date(input.nextActionAt).toISOString():'',contactedAt:now()
    });
  }

  async createAction(input:{title:string;clientId?:Id;groupId?:Id;dueAt?:string;priority?:'LOW'|'NORMAL'|'HIGH'|'URGENT';note?:string}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.groupId)await this.groupManager(input.groupId);
    if(input.dueAt&&!Number.isFinite(Date.parse(input.dueAt)))throw new Error('INVALID_DUE_AT');
    return this.save('ACTION',required(input.title,'action_title'),{
      clientId:input.clientId??'',groupId:input.groupId??'',dueAt:input.dueAt?new Date(input.dueAt).toISOString():'',
      priority:input.priority??'NORMAL',note:input.note?.trim().slice(0,2000)??'',actionState:'OPEN'
    });
  }
  async completeAction(id:Id){return this.mutate(id,{actionState:'DONE',completedAt:now()},'DONE');}

  async recordTime(input:{clientId?:Id;mandateId?:Id;minutes:number;workDate:string;note?:string}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.mandateId&&!(await this.owned('MANDATE')).some(x=>x.id===input.mandateId))throw new Error('MANDATE_NOT_FOUND');
    if(!Number.isFinite(Date.parse(input.workDate)))throw new Error('INVALID_WORK_DATE');
    return this.save('TIME','Temps de travail',{clientId:input.clientId??'',mandateId:input.mandateId??'',minutes:int(input.minutes,'minutes',false),workDate:new Date(input.workDate).toISOString(),note:input.note?.trim().slice(0,500)??''});
  }

  async scenario(input:{
    name:string;months?:number;monthlyRevenue?:number;monthlyVariableCosts?:number;monthlyFixedCosts?:number;
    nominalContribution?:number;addedFeePerMemberSession?:number;members?:number;sessions?:number;pots?:number;durationMonths?:number;
    transferFees?:number;withdrawalFees?:number;transport?:number;internet?:number;communication?:number;personnel?:number;rent?:number;advertising?:number;
    purchases?:number;supplierDiscounts?:number;commissions?:number;managementFees?:number;otherRevenue?:number;losses?:number;expectedDefaultRate?:number;
  }){
    const v=(x:unknown,name:string)=>int(x??0,name),months=int(input.durationMonths??input.months??1,'months',false),members=int(input.members??1,'members',false),sessions=int(input.sessions??1,'sessions',false),pots=int(input.pots??1,'pots',false);
    const nominal=v(input.nominalContribution,'nominal_contribution'),added=v(input.addedFeePerMemberSession,'added_fee'),defaultRate=Number(input.expectedDefaultRate??0);if(!Number.isFinite(defaultRate)||defaultRate<0||defaultRate>100)throw new Error('INVALID_EXPECTED_DEFAULT_RATE');
    const collectiveContributionVolume=nominal*members*sessions;
    const memberFeePotential=added*members*sessions+v(input.managementFees,'management_fees');
    const collectionRate=(100-defaultRate)/100;
    const memberFeeCollected=Math.round(memberFeePotential*collectionRate);
    const invoiceLikeRevenue=v(input.monthlyRevenue,'monthly_revenue')*months;
    const otherRevenue=v(input.commissions,'commissions')+v(input.supplierDiscounts,'supplier_discounts')+v(input.otherRevenue,'other_revenue')+invoiceLikeRevenue;
    const revenuePotential=memberFeePotential+otherRevenue,realizedRevenue=memberFeeCollected+otherRevenue;
    const variableCosts=v(input.monthlyVariableCosts,'monthly_variable_costs')*months+v(input.transferFees,'transfer_fees')+v(input.withdrawalFees,'withdrawal_fees')+v(input.transport,'transport')+v(input.internet,'internet')+v(input.communication,'communication')+v(input.purchases,'purchases')+v(input.losses,'losses');
    const fixedCosts=v(input.monthlyFixedCosts,'monthly_fixed_costs')*months+v(input.personnel,'personnel')+v(input.rent,'rent')+v(input.advertising,'advertising');
    const totalCosts=variableCosts+fixedCosts,grossMargin=realizedRevenue-variableCosts,netMargin=grossMargin-fixedCosts;
    const unitFeeAfterDefaults=added*collectionRate;
    const fixedRevenueWithoutMemberFees=otherRevenue+Math.round(v(input.managementFees,'management_fees')*collectionRate);
    const memberContributionToMarginPerCycle=Math.max(0,unitFeeAfterDefaults*sessions);
    const breakEvenMembers=memberContributionToMarginPerCycle>0?Math.max(0,Math.ceil((totalCosts-fixedRevenueWithoutMemberFees)/memberContributionToMarginPerCycle)):null;
    const breakEvenRevenue=totalCosts;
    const project=(revenueFactor:number,costFactor:number,defaultDelta:number)=>{
      const dr=Math.min(100,Math.max(0,defaultRate+defaultDelta)),cr=(100-dr)/100;
      const rev=Math.round((memberFeePotential*cr+otherRevenue)*revenueFactor),cost=Math.round(totalCosts*costFactor);
      return{revenue:rev,costs:cost,netMargin:rev-cost,defaultRate:dr};
    };
    const prudent=project(.9,1.1,5),central=project(1,1,0),optimistic=project(1.1,.95,-5);
    const late5=project(1,1,5),late10=project(1,1,10);
    return this.save('SCENARIO',required(input.name,'scenario_name'),{
      months,members,sessions,pots,nominalContribution:nominal,addedFeePerMemberSession:added,collectiveContributionVolume,revenuePotential,realizedRevenue,
      variableCosts,fixedCosts,totalCosts,grossMargin,netMargin,marginPerMember:Math.round(netMargin/members),marginPerSession:Math.round(netMargin/sessions),marginPerCycle:netMargin,
      monthlyNetMargin:Math.round(netMargin/months),annualizedNetMargin:Math.round(netMargin/months*12),breakEvenRevenue,breakEvenMembers:breakEvenMembers??-1,
      expectedDefaultRate:defaultRate,memberValueAtRisk:Math.round(collectiveContributionVolume*defaultRate/100),
      prudentJson:JSON.stringify(prudent),centralJson:JSON.stringify(central),optimisticJson:JSON.stringify(optimistic),late5Json:JSON.stringify(late5),late10Json:JSON.stringify(late10),
      transferFees:v(input.transferFees,'transfer_fees'),withdrawalFees:v(input.withdrawalFees,'withdrawal_fees'),transport:v(input.transport,'transport'),internet:v(input.internet,'internet'),communication:v(input.communication,'communication'),
      personnel:v(input.personnel,'personnel'),rent:v(input.rent,'rent'),advertising:v(input.advertising,'advertising'),purchases:v(input.purchases,'purchases'),supplierDiscounts:v(input.supplierDiscounts,'supplier_discounts'),
      commissions:v(input.commissions,'commissions'),managementFees:v(input.managementFees,'management_fees'),otherRevenue:v(input.otherRevenue,'other_revenue'),losses:v(input.losses,'losses'),
      simulationOnly:true,assumptionNote:'Cotisations collectives exclues du revenu privé ; scénarios prudent/central/optimiste explicitent uniquement des hypothèses de sensibilité.'
    });
  }

  async profitability(){
    const rows=await this.owned(),payments=rows.filter(x=>x.data.businessKind==='PAYMENT'),invoices=new Map(rows.filter(x=>x.data.businessKind==='INVOICE').map(x=>[x.id,x]));
    const buckets=new Map<string,{clientId:string;groupId:string;revenue:number;expenses:number;minutes:number}>();
    const bucket=(clientId='',groupId='')=>{const key=clientId+'|'+groupId;let b=buckets.get(key);if(!b){b={clientId,groupId,revenue:0,expenses:0,minutes:0};buckets.set(key,b);}return b;};
    for(const p of payments){const invoice=invoices.get(String(p.data.invoiceId??''));const b=bucket(String(invoice?.data.clientId??''),String(invoice?.data.groupId??''));b.revenue+=Number(p.data.amount??0);}
    for(const r of rows.filter(x=>x.data.businessKind==='REVENUE'))bucket(String(r.data.clientId??''),String(r.data.groupId??'')).revenue+=Number(r.data.amount??0);
    for(const x of rows.filter(x=>x.data.businessKind==='EXPENSE'))bucket(String(x.data.clientId??''),String(x.data.groupId??'')).expenses+=Number(x.data.amount??0);
    for(const x of rows.filter(x=>x.data.businessKind==='TIME'))bucket(String(x.data.clientId??''),'').minutes+=Number(x.data.minutes??0);
    return [...buckets.values()].map(x=>({...x,margin:x.revenue-x.expenses,hours:Math.round(x.minutes/6)/10,marginPerHour:x.minutes>0?Math.round((x.revenue-x.expenses)/(x.minutes/60)):0})).sort((a,b)=>b.margin-a.margin);
  }

  async operatingBrief(){
    const [summary,rows,profitability]=await Promise.all([this.summary(),this.owned(),this.profitability()]),actions:string[]=[];
    if(summary.overdueInvoices>0)actions.push('Relancer les factures en retard avant d’engager de nouvelles dépenses non essentielles.');
    if(summary.prospects>0)actions.push('Qualifier les prospects ouverts puis préparer un devis avec prix validé.');
    if(summary.openQuotes>0)actions.push('Suivre les devis ouverts : relance, décision client et prochaine action datée.');
    if(summary.openOrders>0)actions.push('Suivre les commandes confirmées/en cours jusqu’à livraison, preuve et facturation.');
    if(summary.followUpsDue>0)actions.push('Traiter les relances arrivées à échéance dans le journal de communication.');
    if(summary.margin<0)actions.push('Analyser les catégories de coûts dominantes et la tarification : la marge réelle est négative.');
    if(!rows.some(x=>x.data.businessKind==='SCENARIO'))actions.push('Créer un scénario prudent / central / optimiste avant de fixer durablement les frais ou honoraires.');
    if(!rows.some(x=>x.data.businessKind==='OFFER'&&x.data.offerState==='ACTIVE'))actions.push('Formaliser au moins une offre/service du catalogue avec périmètre et prix validé.');
    if(!actions.length)actions.push('Aucune urgence déterministe détectée : poursuivre le suivi clients, fournisseurs, coûts, trésorerie privée et qualité de service.');
    return{
      generatedAt:now(),actions,profitability,
      guardrails:[
        'Le Business Agent prépare et explique ; il ne confirme jamais un paiement non enregistré.',
        'Il n’invente jamais un prix : un devis ou une offre doit contenir un prix saisi/validé par le gestionnaire.',
        'Les cotisations collectives ne sont jamais du chiffre d’affaires privé.',
        'Toute recette privée provenant d’un groupe exige une référence Ledger collective immuable.',
        'Aucune suggestion ne crée de transaction ni n’engage un client sans validation humaine.'
      ]
    };
  }

  async summary():Promise<BusinessSummary>{
    const rows=await this.owned(),workspace=rows.find(x=>x.data.businessKind==='WORKSPACE'),currency=String(workspace?.data.currency??'XAF');
    const by=(kind:BusinessKind)=>rows.filter(x=>x.data.businessKind===kind&&String(x.data.currency??currency)===currency),sum=(kind:BusinessKind,field:string)=>by(kind).reduce((n,x)=>n+Number(x.data[field]??0),0);
    const quoted=sum('QUOTE','total'),invoiced=sum('INVOICE','amount'),invoicePayments=sum('PAYMENT','amount'),directRevenue=sum('REVENUE','amount'),received=invoicePayments+directRevenue,expenses=sum('EXPENSE','amount'),fixed=Number(workspace?.data.monthlyFixedCosts??0),hours=by('TIME').reduce((n,x)=>n+Number(x.data.minutes??0),0)/60;
    const revenueBySource:Record<string,number>={};for(const x of by('REVENUE')){const k=String(x.data.source??'OTHER');revenueBySource[k]=(revenueBySource[k]??0)+Number(x.data.amount??0);}
    const expenseByCategory:Record<string,number>={};for(const x of by('EXPENSE')){const k=String(x.data.category??'OTHER');expenseByCategory[k]=(expenseByCategory[k]??0)+Number(x.data.amount??0);}
    const nowMs=Date.now(),overdueInvoices=by('INVOICE').filter(x=>Number(x.data.receivedAmount??0)<Number(x.data.amount??0)&&Date.parse(String(x.data.dueAt??''))<nowMs).length;
    const current=Date.now();
    return{currency,quoted,invoiced,received,invoicePayments,directRevenue,expenses,outstanding:Math.max(0,invoiced-invoicePayments),margin:received-expenses,activeMandates:rows.filter(x=>x.data.businessKind==='MANDATE'&&x.data.mandateState==='ACTIVE').length,activeClients:rows.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState==='ACTIVE').length,prospects:rows.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState==='PROSPECT').length,hours,breakEvenRevenue:fixed+expenses,netMarginPerHour:hours>0?Math.round((received-expenses)/hours):0,overdueInvoices,openQuotes:rows.filter(x=>x.data.businessKind==='QUOTE'&&['DRAFT','SENT'].includes(String(x.data.quoteState??''))).length,catalogOffers:rows.filter(x=>x.data.businessKind==='OFFER'&&x.data.offerState==='ACTIVE').length,openRequests:rows.filter(x=>x.data.businessKind==='REQUEST'&&!['WON','LOST','CLOSED'].includes(String(x.data.requestState??''))).length,openOrders:rows.filter(x=>x.data.businessKind==='ORDER'&&['CONFIRMED','IN_PROGRESS'].includes(String(x.data.orderState??''))).length,deliveredOrders:rows.filter(x=>x.data.businessKind==='ORDER'&&x.data.orderState==='DELIVERED').length,followUpsDue:rows.filter(x=>x.data.businessKind==='COMMUNICATION'&&x.data.nextActionAt&&Date.parse(String(x.data.nextActionAt))<=current).length,revenueBySource,expenseByCategory};
  }

  async records(){return this.owned();}
}
