import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {Id,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

type BusinessKind='WORKSPACE'|'MANDATE'|'CLIENT'|'QUOTE'|'CONTRACT'|'INVOICE'|'EXPENSE'|'PAYMENT'|'TIME'|'SCENARIO';
type Money={amount:number;currency:string};
const now=()=>new Date().toISOString();
const managerRoles=new Set(['founder','manager','admin','president','treasurer']);
const int=(v:unknown,name:string,allowZero=true)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<(allowZero?0:1))throw new Error('INVALID_'+name.toUpperCase());return n;};
const required=(v:unknown,name:string,max=240)=>{const s=String(v??'').trim();if(!s)throw new Error(name.toUpperCase()+'_REQUIRED');return s.slice(0,max);};
const json=<T>(v:unknown,fallback:T):T=>{try{return JSON.parse(String(v??'')) as T;}catch{return fallback;}};

export interface BusinessSummary{
  currency:string;quoted:number;invoiced:number;received:number;expenses:number;outstanding:number;margin:number;
  activeMandates:number;activeClients:number;hours:number;breakEvenRevenue:number;
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

  async createQuote(input:{clientId:Id;title:string;items:Array<{label:string;quantity:number;unitPrice:number}>;currency?:string;validUntil?:string}){
    const client=(await this.owned('CLIENT')).find(x=>x.id===input.clientId);if(!client)throw new Error('CLIENT_NOT_FOUND');
    const items=input.items.map(x=>({label:required(x.label,'item_label'),quantity:int(x.quantity,'quantity',false),unitPrice:int(x.unitPrice,'unit_price')}));if(!items.length)throw new Error('QUOTE_ITEMS_REQUIRED');
    const total=items.reduce((n,x)=>n+x.quantity*x.unitPrice,0);
    return this.save('QUOTE',required(input.title,'quote_title'),{clientId:client.id,itemsJson:JSON.stringify(items),total,currency:input.currency??'XAF',validUntil:input.validUntil??'',quoteState:'DRAFT'});
  }
  async quoteDecision(id:Id,state:'SENT'|'ACCEPTED'|'REJECTED'|'EXPIRED'){return this.mutate(id,{quoteState:state,decisionAt:now()},state==='REJECTED'||state==='EXPIRED'?'DONE':'ACTIVE');}

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

  async recordExpense(input:{label:string;amount:number;currency?:string;category:'TRAVEL'|'SUPPLIES'|'TRAINING'|'COMMUNICATION'|'LABOUR'|'OTHER';clientId?:Id;groupId?:Id;collectiveLedgerEntryId?:Id}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.groupId){await this.groupManager(input.groupId);if(input.collectiveLedgerEntryId&&!await this.repo.getLedgerEntry(this.kernel.context.get().tenantId,input.groupId,input.collectiveLedgerEntryId))throw new Error('LEDGER_ENTRY_NOT_FOUND');}
    return this.save('EXPENSE',required(input.label,'expense_label'),{amount:int(input.amount,'expense_amount',false),currency:input.currency??'XAF',category:input.category,clientId:input.clientId??'',groupId:input.groupId??'',collectiveLedgerEntryId:input.collectiveLedgerEntryId??'',occurredAt:now()});
  }

  async recordTime(input:{clientId?:Id;mandateId?:Id;minutes:number;workDate:string;note?:string}){
    if(input.clientId&&!(await this.owned('CLIENT')).some(x=>x.id===input.clientId))throw new Error('CLIENT_NOT_FOUND');
    if(input.mandateId&&!(await this.owned('MANDATE')).some(x=>x.id===input.mandateId))throw new Error('MANDATE_NOT_FOUND');
    if(!Number.isFinite(Date.parse(input.workDate)))throw new Error('INVALID_WORK_DATE');
    return this.save('TIME','Temps de travail',{clientId:input.clientId??'',mandateId:input.mandateId??'',minutes:int(input.minutes,'minutes',false),workDate:new Date(input.workDate).toISOString(),note:input.note?.trim().slice(0,500)??''});
  }

  async scenario(input:{name:string;monthlyRevenue:number;monthlyVariableCosts:number;monthlyFixedCosts:number;months:number}){
    const revenue=int(input.monthlyRevenue,'monthly_revenue'),variable=int(input.monthlyVariableCosts,'monthly_variable_costs'),fixed=int(input.monthlyFixedCosts,'monthly_fixed_costs'),months=int(input.months,'months',false);
    return this.save('SCENARIO',required(input.name,'scenario_name'),{monthlyRevenue:revenue,monthlyVariableCosts:variable,monthlyFixedCosts:fixed,months,projectedProfit:(revenue-variable-fixed)*months,simulationOnly:true});
  }

  async summary():Promise<BusinessSummary>{
    const rows=await this.owned(),workspace=rows.find(x=>x.data.businessKind==='WORKSPACE'),currency=String(workspace?.data.currency??'XAF');
    const sum=(kind:BusinessKind,field:string)=>rows.filter(x=>x.data.businessKind===kind&&String(x.data.currency??currency)===currency).reduce((n,x)=>n+Number(x.data[field]??0),0);
    const quoted=sum('QUOTE','total'),invoiced=sum('INVOICE','amount'),received=sum('PAYMENT','amount'),expenses=sum('EXPENSE','amount'),fixed=Number(workspace?.data.monthlyFixedCosts??0);
    return{currency,quoted,invoiced,received,expenses,outstanding:Math.max(0,invoiced-received),margin:received-expenses,activeMandates:rows.filter(x=>x.data.businessKind==='MANDATE'&&x.data.mandateState==='ACTIVE').length,activeClients:rows.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState==='ACTIVE').length,hours:rows.filter(x=>x.data.businessKind==='TIME').reduce((n,x)=>n+Number(x.data.minutes??0),0)/60,breakEvenRevenue:fixed+expenses};
  }

  async records(){return this.owned();}
}
