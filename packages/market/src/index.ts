import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const qty=(v:number)=>{if(!Number.isSafeInteger(v)||v<=0)throw Error('INVALID_QUANTITY');return v;};
type MarketKind='SHOP'|'STOCK_ITEM'|'MARKET_ORDER'|'GROUP_BUY'|'SUPPLIER'|'PROCUREMENT'|'SUPPLIER_CREDIT';
type StockOwnership='COMMERCIAL'|'POT_RESERVED'|'CONSIGNMENT'|'DEPOSIT_SALE';
export interface MarketRecord extends WorkspaceRecord{data:WorkspaceRecord['data']&{marketKind:MarketKind;version:number};}

export class MarketService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private async access(groupId:Id,manage=false):Promise<Membership|undefined>{
    const ctx=this.kernel.context.get(),group=await this.repo.getGroup(ctx.tenantId,groupId);if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member)throw Error('FORBIDDEN_SCOPE');
    if(manage&&!member.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');
    return member;
  }
  private async list(groupId:Id,kind?:MarketKind){
    await this.access(groupId,false);const ctx=this.kernel.context.get();
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,undefined,groupId)).filter(r=>r.tags.includes('market-engine')&&(!kind||r.data.marketKind===kind)) as MarketRecord[];
  }
  private async save(groupId:Id,kind:MarketKind,title:string,data:Record<string,string|number|boolean|null>,status:WorkspaceRecord['status']='ACTIVE'){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),stamp=now();
    const record:MarketRecord={id:makeId('market'),tenantId:ctx.tenantId,groupId,moduleId:kind==='GROUP_BUY'?'MARKETPLACE.GROUP_BUY':'MARKETPLACE.CORE',
      title,status,tags:['market-engine','kind:'+kind],data:{...data,marketKind:kind,version:1},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);return record;
  }
  private async update(record:MarketRecord,patch:Record<string,string|number|boolean|null>,status?:WorkspaceRecord['status']){
    const next:MarketRecord={...record,status:status??record.status,data:{...record.data,...patch,version:Number(record.data.version??1)+1},updatedAt:now()};
    await this.repo.saveWorkspaceRecord(next);return next;
  }
  async createOrUpdateShop(groupId:Id,input:{name:string;tagline?:string;visibility?:'GROUP_ONLY'|'PUBLIC';locality?:string;categories?:string[]}){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),name=input.name.trim();if(!name)throw Error('SHOP_NAME_REQUIRED');
    const existing=(await this.list(groupId,'SHOP'))[0],categories=[...new Set((input.categories??[]).map(x=>x.trim().toLowerCase()).filter(Boolean))].slice(0,20),patch={tagline:input.tagline?.trim().slice(0,240)??'',visibility:input.visibility??'GROUP_ONLY',locality:input.locality?.trim().slice(0,160)??'',categoriesJson:JSON.stringify(categories),ownerGroupId:groupId};
    if(existing)return this.update({...existing,title:name},patch);
    return this.save(groupId,'SHOP',name,patch);
  }
  async shop(groupId:Id){await this.access(groupId,false);return (await this.list(groupId,'SHOP'))[0];}
  async createStock(groupId:Id,input:{sku:string;name:string;quantity:number;unit?:string;unitPrice?:number;description?:string;published?:boolean;ownership?:StockOwnership;ownerRef?:string}){
    qty(input.quantity);const sku=input.sku.trim(),name=input.name.trim();if(!sku||!name)throw Error('SKU_AND_NAME_REQUIRED');
    if(input.unitPrice!==undefined&&(!Number.isSafeInteger(input.unitPrice)||input.unitPrice<0))throw Error('INVALID_UNIT_PRICE');
    const duplicate=(await this.list(groupId,'STOCK_ITEM')).find(x=>String(x.data.sku).toLowerCase()===sku.toLowerCase());if(duplicate)throw Error('STOCK_SKU_EXISTS');
    const ownership=input.ownership??'COMMERCIAL';if(!['COMMERCIAL','POT_RESERVED','CONSIGNMENT','DEPOSIT_SALE'].includes(ownership))throw Error('INVALID_STOCK_OWNERSHIP');
    const published=ownership==='POT_RESERVED'?false:Boolean(input.published);
    return this.save(groupId,'STOCK_ITEM',name,{sku,quantity:input.quantity,reserved:0,unit:input.unit?.trim()||'unit',unitPrice:input.unitPrice??0,description:input.description?.trim().slice(0,500)??'',published,ownership,ownerRef:input.ownerRef?.trim()??''});
  }
  async setStockListing(groupId:Id,itemId:Id,input:{published:boolean;unitPrice?:number;description?:string}){
    await this.access(groupId,true);const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===itemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    if(input.unitPrice!==undefined&&(!Number.isSafeInteger(input.unitPrice)||input.unitPrice<0))throw Error('INVALID_UNIT_PRICE');
    if(String(item.data.ownership??'COMMERCIAL')==='POT_RESERVED'&&input.published)throw Error('POT_STOCK_NOT_SELLABLE');
    return this.update(item,{published:input.published,unitPrice:input.unitPrice??Number(item.data.unitPrice??0),description:input.description?.trim().slice(0,500)??String(item.data.description??'')});
  }
  async storefront(groupId:Id){
    const shop=await this.shop(groupId),items=(await this.list(groupId,'STOCK_ITEM')).filter(x=>Boolean(x.data.published)&&String(x.data.ownership??'COMMERCIAL')!=='POT_RESERVED').map(x=>({id:x.id,sku:String(x.data.sku),name:x.title,available:Math.max(0,Number(x.data.quantity)-Number(x.data.reserved??0)),unit:String(x.data.unit??'unit'),unitPrice:Number(x.data.unitPrice??0),description:String(x.data.description??''),ownership:String(x.data.ownership??'COMMERCIAL'),ownerRef:String(x.data.ownerRef??'')}));
    return{shop:shop?{id:shop.id,name:shop.title,tagline:String(shop.data.tagline??''),visibility:String(shop.data.visibility??'GROUP_ONLY'),locality:String(shop.data.locality??''),categories:JSON.parse(String(shop.data.categoriesJson??'[]'))}:undefined,items};
  }
  async adjustStock(groupId:Id,itemId:Id,delta:number,reason:string){
    await this.access(groupId,true);if(!Number.isSafeInteger(delta)||delta===0)throw Error('INVALID_STOCK_DELTA');if(!reason.trim())throw Error('REASON_REQUIRED');
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===itemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    const next=Number(item.data.quantity)+delta,reserved=Number(item.data.reserved??0);if(next<reserved||next<0)throw Error('INSUFFICIENT_STOCK');
    return this.update(item,{quantity:next,lastAdjustmentReason:reason.trim()});
  }
  async createOrder(groupId:Id,input:{stockItemId:Id;quantity:number;customerRef:string;unitPrice?:number}){
    qty(input.quantity);const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===input.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    if(String(item.data.ownership??'COMMERCIAL')==='POT_RESERVED')throw Error('POT_STOCK_NOT_SELLABLE');
    const available=Number(item.data.quantity)-Number(item.data.reserved??0);if(available<input.quantity)throw Error('INSUFFICIENT_STOCK');
    const customerRef=input.customerRef.trim();if(!customerRef)throw Error('CUSTOMER_REFERENCE_REQUIRED');
    const order=await this.save(groupId,'MARKET_ORDER','Order '+String(item.data.sku),{stockItemId:item.id,quantity:input.quantity,customerRef,unitPrice:input.unitPrice??0,
      state:'CONFIRMED',deliveredQuantity:0,returnedQuantity:0,disputed:false});
    await this.update(item,{reserved:Number(item.data.reserved??0)+input.quantity});
    return order;
  }
  async deliver(groupId:Id,orderId:Id,value:number){
    qty(value);const order=(await this.list(groupId,'MARKET_ORDER')).find(x=>x.id===orderId);if(!order)throw Error('ORDER_NOT_FOUND');
    const ordered=Number(order.data.quantity),delivered=Number(order.data.deliveredQuantity??0),returned=Number(order.data.returnedQuantity??0);
    if(delivered+value>ordered)throw Error('DELIVERY_EXCEEDS_ORDER');
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===order.data.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    if(Number(item.data.quantity)<value||Number(item.data.reserved)<value)throw Error('INSUFFICIENT_STOCK');
    await this.update(item,{quantity:Number(item.data.quantity)-value,reserved:Number(item.data.reserved)-value});
    const nextDelivered=delivered+value;return this.update(order,{deliveredQuantity:nextDelivered,state:nextDelivered===ordered?'DELIVERED':'PARTIAL',returnedQuantity:returned});
  }
  async returnItems(groupId:Id,orderId:Id,value:number,reason:string){
    qty(value);if(!reason.trim())throw Error('REASON_REQUIRED');const order=(await this.list(groupId,'MARKET_ORDER')).find(x=>x.id===orderId);if(!order)throw Error('ORDER_NOT_FOUND');
    const delivered=Number(order.data.deliveredQuantity??0),returned=Number(order.data.returnedQuantity??0);if(returned+value>delivered)throw Error('RETURN_EXCEEDS_DELIVERY');
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===order.data.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    await this.update(item,{quantity:Number(item.data.quantity)+value});
    return this.update(order,{returnedQuantity:returned+value,state:'RETURNED',returnReason:reason.trim()});
  }
  async dispute(groupId:Id,orderId:Id,summary:string){
    const order=(await this.list(groupId,'MARKET_ORDER')).find(x=>x.id===orderId);if(!order)throw Error('ORDER_NOT_FOUND');
    if(!summary.trim())throw Error('DISPUTE_SUMMARY_REQUIRED');return this.update(order,{disputed:true,state:'DISPUTED',disputeSummary:summary.trim()});
  }
  async createGroupBuy(groupId:Id,input:{title:string;stockItemId?:Id;thresholdQuantity:number;deadline:string}){
    qty(input.thresholdQuantity);if(!Number.isFinite(Date.parse(input.deadline))||Date.parse(input.deadline)<=Date.now())throw Error('INVALID_DEADLINE');
    return this.save(groupId,'GROUP_BUY',input.title.trim()||'Group buy',{stockItemId:input.stockItemId??null,thresholdQuantity:input.thresholdQuantity,
      deadline:new Date(input.deadline).toISOString(),committedQuantity:0,state:'OPEN',commitments:'[]'});
  }
  async commitGroupBuy(groupId:Id,campaignId:Id,membershipId:Id,value:number){
    qty(value);await this.access(groupId,false);const ctx=this.kernel.context.get(),member=await this.repo.getMembership(ctx.tenantId,groupId,membershipId);
    if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
    const campaign=(await this.list(groupId,'GROUP_BUY')).find(x=>x.id===campaignId);if(!campaign)throw Error('GROUP_BUY_NOT_FOUND');
    if(String(campaign.data.state)!=='OPEN'||Date.parse(String(campaign.data.deadline))<=Date.now())throw Error('GROUP_BUY_CLOSED');
    const commitments=JSON.parse(String(campaign.data.commitments??'[]')) as Array<{membershipId:Id;quantity:number}>;
    const existing=commitments.find(x=>x.membershipId===membershipId);if(existing)existing.quantity+=value;else commitments.push({membershipId,quantity:value});
    const total=commitments.reduce((n,x)=>n+x.quantity,0),threshold=Number(campaign.data.thresholdQuantity);
    return this.update(campaign,{commitments:JSON.stringify(commitments),committedQuantity:total,state:total>=threshold?'THRESHOLD_MET':'OPEN'});
  }
  async registerSupplier(groupId:Id,input:{name:string;locality?:string;contactRef?:string;paymentTerms?:string;verifiedEvidenceRef?:string}){
    const name=input.name.trim();if(!name)throw Error('SUPPLIER_NAME_REQUIRED');
    return this.save(groupId,'SUPPLIER',name,{locality:input.locality?.trim()??'',contactRef:input.contactRef?.trim()??'',paymentTerms:input.paymentTerms?.trim()??'',verifiedEvidenceRef:input.verifiedEvidenceRef?.trim()??'',supplierState:'ACTIVE'});
  }
  async suppliers(groupId:Id){return this.list(groupId,'SUPPLIER');}

  async createProcurement(groupId:Id,input:{supplierId:Id;debtorType:'GROUP'|'BUSINESS';debtorRef:Id;lines:Array<{sku?:string;label:string;quantity:number;unitCost:number}>;freight?:number;otherCosts?:number;currency?:string;creditDueAt?:string}){
    await this.access(groupId,true);
    const supplier=(await this.list(groupId,'SUPPLIER')).find(x=>x.id===input.supplierId);if(!supplier)throw Error('SUPPLIER_NOT_FOUND');
    if(input.debtorType==='GROUP'&&input.debtorRef!==groupId)throw Error('SUPPLIER_CREDIT_DEBTOR_MISMATCH');
    if(!input.debtorRef.trim())throw Error('DEBTOR_REFERENCE_REQUIRED');
    const lines=input.lines.map(x=>({sku:x.sku?.trim()??'',label:x.label.trim(),quantity:qty(x.quantity),unitCost:Number(x.unitCost)}));
    if(!lines.length||lines.some(x=>!x.label||!Number.isSafeInteger(x.unitCost)||x.unitCost<0))throw Error('INVALID_PROCUREMENT_LINES');
    const goodsCost=lines.reduce((n,x)=>n+x.quantity*x.unitCost,0),freight=Number(input.freight??0),other=Number(input.otherCosts??0);
    if(!Number.isSafeInteger(freight)||freight<0||!Number.isSafeInteger(other)||other<0)throw Error('INVALID_LANDED_COST');
    if(input.creditDueAt&&(!Number.isFinite(Date.parse(input.creditDueAt))||Date.parse(input.creditDueAt)<=Date.now()))throw Error('INVALID_CREDIT_DUE_AT');
    return this.save(groupId,'PROCUREMENT','Approvisionnement · '+supplier.title,{supplierId:supplier.id,debtorType:input.debtorType,debtorRef:input.debtorRef,linesJson:JSON.stringify(lines),goodsCost,freight,otherCosts:other,landedCost:goodsCost+freight+other,currency:input.currency??'XAF',creditDueAt:input.creditDueAt?new Date(input.creditDueAt).toISOString():'',state:'ORDERED',receivedLinesJson:'[]',returnedLinesJson:'[]'});
  }
  async receiveProcurement(groupId:Id,procurementId:Id,input:{lines:Array<{lineIndex:number;quantity:number}>;stockOwnership?:StockOwnership}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');
    const ordered=JSON.parse(String(p.data.linesJson??'[]')) as Array<{sku:string;label:string;quantity:number;unitCost:number}>,received=JSON.parse(String(p.data.receivedLinesJson??'[]')) as Array<{lineIndex:number;quantity:number}>;
    for(const row of input.lines){if(!Number.isSafeInteger(row.lineIndex)||row.lineIndex<0||row.lineIndex>=ordered.length)throw Error('PROCUREMENT_LINE_NOT_FOUND');qty(row.quantity);const prior=received.filter(x=>x.lineIndex===row.lineIndex).reduce((n,x)=>n+x.quantity,0);if(prior+row.quantity>ordered[row.lineIndex]!.quantity)throw Error('RECEIPT_EXCEEDS_ORDER');received.push({lineIndex:row.lineIndex,quantity:row.quantity});}
    const fully=ordered.every((x,i)=>received.filter(r=>r.lineIndex===i).reduce((n,r)=>n+r.quantity,0)>=x.quantity);
    const next=await this.update(p,{receivedLinesJson:JSON.stringify(received),state:fully?'RECEIVED':'PARTIAL_RECEIPT',receivedAt:now()});
    const ownership=input.stockOwnership??'COMMERCIAL';
    for(const row of input.lines){const line=ordered[row.lineIndex]!,sku=line.sku||('proc-'+procurementId+'-'+row.lineIndex),existing=(await this.list(groupId,'STOCK_ITEM')).find(x=>String(x.data.sku)===sku);if(existing)await this.update(existing,{quantity:Number(existing.data.quantity)+row.quantity});else await this.createStock(groupId,{sku,name:line.label,quantity:row.quantity,unitPrice:line.unitCost,published:false,ownership});}
    if(fully&&String(p.data.creditDueAt??'')){const existing=(await this.list(groupId,'SUPPLIER_CREDIT')).find(x=>String(x.data.procurementId)===procurementId);if(!existing)await this.createSupplierCredit(groupId,{procurementId,amount:Number(p.data.landedCost),dueAt:String(p.data.creditDueAt)});}
    return next;
  }
  async returnProcurement(groupId:Id,procurementId:Id,input:{lineIndex:number;quantity:number;reason:string}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');qty(input.quantity);if(!input.reason.trim())throw Error('REASON_REQUIRED');
    const ordered=JSON.parse(String(p.data.linesJson??'[]')) as Array<{quantity:number}>,received=JSON.parse(String(p.data.receivedLinesJson??'[]')) as Array<{lineIndex:number;quantity:number}>,returned=JSON.parse(String(p.data.returnedLinesJson??'[]')) as Array<{lineIndex:number;quantity:number;reason:string}>;
    if(!ordered[input.lineIndex])throw Error('PROCUREMENT_LINE_NOT_FOUND');const have=received.filter(x=>x.lineIndex===input.lineIndex).reduce((n,x)=>n+x.quantity,0)-returned.filter(x=>x.lineIndex===input.lineIndex).reduce((n,x)=>n+x.quantity,0);if(input.quantity>have)throw Error('RETURN_EXCEEDS_RECEIPT');
    returned.push({lineIndex:input.lineIndex,quantity:input.quantity,reason:input.reason.trim()});return this.update(p,{returnedLinesJson:JSON.stringify(returned),state:'RETURN_RECORDED'});
  }
  async createSupplierCredit(groupId:Id,input:{procurementId:Id;amount:number;dueAt:string}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===input.procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');if(!Number.isSafeInteger(input.amount)||input.amount<=0||input.amount>Number(p.data.landedCost))throw Error('INVALID_SUPPLIER_CREDIT_AMOUNT');if(!Number.isFinite(Date.parse(input.dueAt)))throw Error('INVALID_CREDIT_DUE_AT');
    return this.save(groupId,'SUPPLIER_CREDIT','Crédit fournisseur · '+p.title,{procurementId:p.id,supplierId:String(p.data.supplierId),debtorType:String(p.data.debtorType),debtorRef:String(p.data.debtorRef),principal:input.amount,paidAmount:0,currency:String(p.data.currency??'XAF'),dueAt:new Date(input.dueAt).toISOString(),state:'OPEN'});
  }
  async paySupplierCredit(groupId:Id,creditId:Id,input:{amount:number;ledgerEntryId?:Id;reference?:string}){
    await this.access(groupId,true);const c=(await this.list(groupId,'SUPPLIER_CREDIT')).find(x=>x.id===creditId);if(!c)throw Error('SUPPLIER_CREDIT_NOT_FOUND');if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_PAYMENT_AMOUNT');
    if(String(c.data.debtorType)==='GROUP'&&!input.ledgerEntryId)throw Error('LEDGER_ENTRY_REQUIRED');
    if(input.ledgerEntryId&&!await this.repo.getLedgerEntry(this.kernel.context.get().tenantId,groupId,input.ledgerEntryId))throw Error('LEDGER_ENTRY_NOT_FOUND');
    const paid=Number(c.data.paidAmount??0)+input.amount,principal=Number(c.data.principal);if(paid>principal)throw Error('PAYMENT_EXCEEDS_CREDIT');
    return this.update(c,{paidAmount:paid,state:paid===principal?'PAID':'PARTIAL',lastPaymentAt:now(),lastPaymentReference:input.reference?.trim()??'',ledgerEntryId:input.ledgerEntryId??''},paid===principal?'DONE':'ACTIVE');
  }
  async procurement(groupId:Id){return{procurements:await this.list(groupId,'PROCUREMENT'),credits:await this.list(groupId,'SUPPLIER_CREDIT'),suppliers:await this.list(groupId,'SUPPLIER')};}

}
