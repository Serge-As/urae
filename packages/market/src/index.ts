import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const qty=(v:number)=>{if(!Number.isSafeInteger(v)||v<=0)throw Error('INVALID_QUANTITY');return v;};
type MarketKind='SHOP'|'STOCK_ITEM'|'MARKET_ORDER'|'GROUP_BUY'|'SUPPLIER'|'PROCUREMENT'|'SUPPLIER_CREDIT'|'FLASH_OFFER'|'MARKET_REQUEST'|'MARKET_RESPONSE'|'DEAL'|'LIVE_MARKET';
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
  private async save(groupId:Id,kind:MarketKind,title:string,data:Record<string,string|number|boolean|null>,status:WorkspaceRecord['status']='ACTIVE',manage=true){
    await this.access(groupId,manage);const ctx=this.kernel.context.get(),stamp=now();
    const moduleId=kind==='GROUP_BUY'?'MARKETPLACE.GROUP_BUY'
      :kind==='FLASH_OFFER'?'MARKETPLACE.ECO_NOW'
      :kind==='MARKET_REQUEST'||kind==='MARKET_RESPONSE'?'MARKETPLACE.DEMAND_EXCHANGE'
      :kind==='DEAL'?'MARKETPLACE.DEALS'
      :kind==='LIVE_MARKET'?'MARKETPLACE.LIVE_MARKET'
      :'MARKETPLACE.CORE';
    const record:MarketRecord={id:makeId('market'),tenantId:ctx.tenantId,groupId,moduleId,
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
  async createOrder(groupId:Id,input:{stockItemId:Id;quantity:number;customerRef:string;unitPrice?:number},allowMember=false){
    qty(input.quantity);const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===input.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    if(String(item.data.ownership??'COMMERCIAL')==='POT_RESERVED')throw Error('POT_STOCK_NOT_SELLABLE');
    const available=Number(item.data.quantity)-Number(item.data.reserved??0);if(available<input.quantity)throw Error('INSUFFICIENT_STOCK');
    const customerRef=input.customerRef.trim();if(!customerRef)throw Error('CUSTOMER_REFERENCE_REQUIRED');
    const order=await this.save(groupId,'MARKET_ORDER','Order '+String(item.data.sku),{stockItemId:item.id,quantity:input.quantity,customerRef,unitPrice:input.unitPrice??0,
      state:'CONFIRMED',deliveredQuantity:0,returnedQuantity:0,disputed:false},'ACTIVE',!allowMember);
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

  async createFlashOffer(groupId:Id,input:{
    type:'NOW_LIQUIDATION'|'SURPLUS_NOW'|'RESCUE_DEAL';stockItemId:Id;quantity:number;offerPrice:number;
    originalPrice?:number;reason:string;condition:string;observedAt:string;expiresAt:string;disclosure:string
  }){
    await this.access(groupId,true);qty(input.quantity);
    if(!['NOW_LIQUIDATION','SURPLUS_NOW','RESCUE_DEAL'].includes(input.type))throw Error('INVALID_FLASH_OFFER_TYPE');
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===input.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    if(String(item.data.ownership??'COMMERCIAL')==='POT_RESERVED')throw Error('POT_STOCK_NOT_SELLABLE');
    const available=Math.max(0,Number(item.data.quantity)-Number(item.data.reserved??0));if(input.quantity>available)throw Error('INSUFFICIENT_STOCK');
    const offerPrice=Number(input.offerPrice),originalPrice=input.originalPrice===undefined?Number(item.data.unitPrice??0):Number(input.originalPrice);
    if(!Number.isSafeInteger(offerPrice)||offerPrice<0||!Number.isSafeInteger(originalPrice)||originalPrice<=0||offerPrice>originalPrice)throw Error('INVALID_FLASH_PRICE');
    const reason=input.reason.trim(),condition=input.condition.trim(),disclosure=input.disclosure.trim();if(!reason||!condition||!disclosure)throw Error('FLASH_DISCLOSURE_REQUIRED');
    const observedAt=Date.parse(input.observedAt),expiresAt=Date.parse(input.expiresAt);if(!Number.isFinite(observedAt)||!Number.isFinite(expiresAt)||observedAt>Date.now()+300000||expiresAt<=Date.now()||expiresAt<=observedAt)throw Error('INVALID_FLASH_DATES');
    return this.save(groupId,'FLASH_OFFER',input.type+' · '+item.title,{flashType:input.type,stockItemId:item.id,sku:String(item.data.sku??''),quantity:input.quantity,claimedQuantity:0,offerPrice,originalPrice,reason,condition,observedAt:new Date(observedAt).toISOString(),expiresAt:new Date(expiresAt).toISOString(),disclosure,state:'OPEN',noHiddenDefectConfirmed:true});
  }
  async claimFlashOffer(groupId:Id,id:Id,membershipId:Id,value:number){
    qty(value);await this.access(groupId,false);const ctx=this.kernel.context.get(),member=await this.repo.getMembership(ctx.tenantId,groupId,membershipId);
    if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
    const viewer=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(x=>x.userId===ctx.actorId&&x.status==='active');
    const group=await this.repo.getGroup(ctx.tenantId,groupId),manager=group?.createdBy===ctx.actorId||Boolean(viewer?.roles.some(r=>managers.has(r)));
    if(!manager&&viewer?.id!==membershipId)throw Error('FORBIDDEN_SCOPE');
    const offer=(await this.list(groupId,'FLASH_OFFER')).find(x=>x.id===id);if(!offer)throw Error('FLASH_OFFER_NOT_FOUND');
    if(String(offer.data.state)!=='OPEN'||Date.parse(String(offer.data.expiresAt??''))<=Date.now())throw Error('FLASH_OFFER_CLOSED');
    const claimed=Number(offer.data.claimedQuantity??0),total=Number(offer.data.quantity??0);if(claimed+value>total)throw Error('FLASH_OFFER_QUANTITY_EXCEEDED');
    const order=await this.createOrder(groupId,{stockItemId:String(offer.data.stockItemId??''),quantity:value,customerRef:'membership:'+membershipId,unitPrice:Number(offer.data.offerPrice??0)},true);
    const linked=await this.update(order,{flashOfferId:offer.id,membershipId});
    const nextClaimed=claimed+value;await this.update(offer,{claimedQuantity:nextClaimed,state:nextClaimed===total?'SOLD_OUT':'OPEN'},nextClaimed===total?'DONE':'ACTIVE');
    return{offer:await (async()=>{const rows=await this.list(groupId,'FLASH_OFFER');return rows.find(x=>x.id===offer.id);})(),order:linked};
  }
  async flashOffers(groupId:Id){
    const rows=await this.list(groupId,'FLASH_OFFER'),nowMs=Date.now(),out=[];
    for(const r of rows){if(String(r.data.state)==='OPEN'&&Date.parse(String(r.data.expiresAt??''))<=nowMs){out.push(await this.update(r,{state:'EXPIRED'},'DONE'));}else out.push(r);}
    return out;
  }
  async closeFlashOffer(groupId:Id,id:Id,reason:string){
    await this.access(groupId,true);const row=(await this.list(groupId,'FLASH_OFFER')).find(x=>x.id===id);if(!row)throw Error('FLASH_OFFER_NOT_FOUND');
    if(!reason.trim())throw Error('REASON_REQUIRED');return this.update(row,{state:'CLOSED',closedReason:reason.trim(),closedAt:now()},'DONE');
  }

  async createMarketRequest(groupId:Id,input:{
    title:string;origin:'EXPLICIT'|'PREDICTED';category:string;quantity:number;unit?:string;locality?:string;budgetMax?:number;
    neededBy?:string;deliveryMode?:string;constraints?:string;predictionRef?:string
  }){
    await this.access(groupId,true);const title=input.title.trim(),category=input.category.trim();if(!title||!category)throw Error('MARKET_REQUEST_REQUIRED');
    qty(input.quantity);if(!['EXPLICIT','PREDICTED'].includes(input.origin))throw Error('INVALID_MARKET_REQUEST_ORIGIN');
    if(input.origin==='PREDICTED'){
      const ref=input.predictionRef?.trim();if(!ref)throw Error('PREDICTION_REF_REQUIRED');
      const prediction=await this.repo.getWorkspaceRecord(this.kernel.context.get().tenantId,ref);
      if(!prediction||prediction.groupId!==groupId||prediction.moduleId!=='GROUP.ANTICIPATION')throw Error('PREDICTION_NOT_FOUND');
      if(!['ACTIVE','DONE'].includes(prediction.status)||prediction.data?.humanValidated!==true)throw Error('PREDICTION_NOT_HUMAN_ACCEPTED');
    }
    const budget=input.budgetMax===undefined?0:Number(input.budgetMax);if(!Number.isSafeInteger(budget)||budget<0)throw Error('INVALID_BUDGET');
    if(input.neededBy&&!Number.isFinite(Date.parse(input.neededBy)))throw Error('INVALID_NEEDED_BY');
    const state=input.origin==='PREDICTED'?'PREDICTED':'DRAFT';
    return this.save(groupId,'MARKET_REQUEST',title,{requestOrigin:input.origin,category,quantity:input.quantity,unit:input.unit?.trim()||'unit',locality:input.locality?.trim()??'',budgetMax:budget,neededBy:input.neededBy?new Date(input.neededBy).toISOString():'',deliveryMode:input.deliveryMode?.trim()??'',constraints:input.constraints?.trim().slice(0,2000)??'',predictionRef:input.predictionRef?.trim()??'',humanValidated:false,state,responseCount:0});
  }
  async marketRequests(groupId:Id){return this.list(groupId,'MARKET_REQUEST');}
  async validateMarketRequest(groupId:Id,id:Id){
    await this.access(groupId,true);const row=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===id);if(!row)throw Error('MARKET_REQUEST_NOT_FOUND');
    const state=String(row.data.state??'');if(!['PREDICTED','DRAFT'].includes(state))throw Error('MARKET_REQUEST_NOT_VALIDATABLE');
    return this.update(row,{state:'OPEN',humanValidated:true,validatedAt:now(),openedAt:now()});
  }
  async respondMarketRequest(groupId:Id,requestId:Id,input:{supplierId:Id;unitPrice:number;quantity:number;deliveryCost?:number;delayText:string;conditions:string;availability:string;evidenceRef?:string;variant?:string}){
    await this.access(groupId,true);const request=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===requestId);if(!request)throw Error('MARKET_REQUEST_NOT_FOUND');
    if(!['OPEN','RESPONSES','SHORTLIST'].includes(String(request.data.state)))throw Error('MARKET_REQUEST_NOT_OPEN');
    const supplier=(await this.list(groupId,'SUPPLIER')).find(x=>x.id===input.supplierId);if(!supplier)throw Error('SUPPLIER_NOT_FOUND');
    qty(input.quantity);const unitPrice=Number(input.unitPrice),deliveryCost=Number(input.deliveryCost??0);if(!Number.isSafeInteger(unitPrice)||unitPrice<0||!Number.isSafeInteger(deliveryCost)||deliveryCost<0)throw Error('INVALID_RESPONSE_PRICE');
    if(!input.delayText.trim()||!input.conditions.trim()||!input.availability.trim())throw Error('MARKET_RESPONSE_REQUIRED');
    const landedCost=unitPrice*input.quantity+deliveryCost;
    const response=await this.save(groupId,'MARKET_RESPONSE','Réponse · '+supplier.title+' · '+request.title,{requestId:request.id,supplierId:supplier.id,unitPrice,quantity:input.quantity,deliveryCost,landedCost,delayText:input.delayText.trim(),conditions:input.conditions.trim().slice(0,2000),availability:input.availability.trim(),evidenceRef:input.evidenceRef?.trim()??'',variant:input.variant?.trim()??'',responseState:'SUBMITTED'});
    const count=(await this.list(groupId,'MARKET_RESPONSE')).filter(x=>String(x.data.requestId)===request.id).length;
    await this.update(request,{state:'RESPONSES',responseCount:count});return response;
  }
  async marketResponses(groupId:Id,requestId?:Id){
    const rows=await this.list(groupId,'MARKET_RESPONSE');return requestId?rows.filter(x=>String(x.data.requestId)===requestId):rows;
  }
  async shortlistMarketResponse(groupId:Id,responseId:Id){
    await this.access(groupId,true);const response=(await this.list(groupId,'MARKET_RESPONSE')).find(x=>x.id===responseId);if(!response)throw Error('MARKET_RESPONSE_NOT_FOUND');
    const request=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===String(response.data.requestId));if(!request)throw Error('MARKET_REQUEST_NOT_FOUND');
    await this.update(response,{responseState:'SHORTLISTED',shortlistedAt:now()});return this.update(request,{state:'SHORTLIST'});
  }
  async selectMarketResponse(groupId:Id,responseId:Id){
    await this.access(groupId,true);const response=(await this.list(groupId,'MARKET_RESPONSE')).find(x=>x.id===responseId);if(!response)throw Error('MARKET_RESPONSE_NOT_FOUND');
    const request=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===String(response.data.requestId));if(!request)throw Error('MARKET_REQUEST_NOT_FOUND');
    const responses=(await this.list(groupId,'MARKET_RESPONSE')).filter(x=>String(x.data.requestId)===request.id);
    for(const r of responses)if(r.id!==response.id&&String(r.data.responseState)==='SELECTED')await this.update(r,{responseState:'NOT_SELECTED'});
    await this.update(response,{responseState:'SELECTED',selectedAt:now()});
    return this.update(request,{state:'SELECTED',selectedResponseId:response.id,selectedSupplierId:String(response.data.supplierId??''),selectedLandedCost:Number(response.data.landedCost??0)});
  }
  async materializeMarketRequestProcurement(groupId:Id,id:Id){
    await this.access(groupId,true);const request=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===id);if(!request)throw Error('MARKET_REQUEST_NOT_FOUND');
    if(String(request.data.state)!=='SELECTED')throw Error('MARKET_REQUEST_NOT_SELECTED');
    const existing=(await this.list(groupId,'PROCUREMENT')).find(x=>String(x.data.marketRequestId??'')===request.id);if(existing)return existing;
    const response=(await this.list(groupId,'MARKET_RESPONSE')).find(x=>x.id===String(request.data.selectedResponseId??''));if(!response)throw Error('MARKET_RESPONSE_NOT_FOUND');
    const supplierId=String(response.data.supplierId??''),quantity=Number(response.data.quantity??request.data.quantity??0),unitCost=Number(response.data.unitPrice??0),freight=Number(response.data.deliveryCost??0);
    const procurement=await this.createProcurement(groupId,{supplierId,debtorType:'GROUP',debtorRef:groupId,lines:[{label:request.title,quantity,unitCost}],freight,otherCosts:0,currency:'XAF'});
    const linked=await this.update(procurement,{marketRequestId:request.id,marketResponseId:response.id,source:'REVERSE_MARKET'});
    await this.update(request,{state:'FULFILLMENT',procurementId:linked.id,fulfillmentStartedAt:now()});
    return linked;
  }
  async transitionMarketRequest(groupId:Id,id:Id,to:'FULFILLMENT'|'CLOSED'|'DISPUTED',note=''){
    await this.access(groupId,true);const row=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===id);if(!row)throw Error('MARKET_REQUEST_NOT_FOUND');
    const current=String(row.data.state??''),allowed:Record<string,string[]>={SELECTED:['FULFILLMENT','DISPUTED'],FULFILLMENT:['CLOSED','DISPUTED'],RESPONSES:['DISPUTED'],SHORTLIST:['DISPUTED'],OPEN:['DISPUTED'],DISPUTED:['FULFILLMENT','CLOSED']};
    if(!allowed[current]?.includes(to))throw Error('INVALID_MARKET_REQUEST_TRANSITION');
    if(to==='DISPUTED'&&!note.trim())throw Error('DISPUTE_SUMMARY_REQUIRED');
    return this.update(row,{state:to,stateNote:note.trim(),stateChangedAt:now()},to==='CLOSED'?'DONE':'ACTIVE');
  }

  async createDeal(groupId:Id,input:{
    title:string;dealType:'PUBLIC_DEAL'|'GROUP_DEAL'|'SUPPLIER_DEAL'|'FRESH_DEAL'|'BULK_DEAL'|'INSTITUTIONAL_DEAL';
    supplierId?:Id;stockItemId?:Id;publicPrice:number;supplierPrice?:number;supplierMinimum:number;maxQuantity:number;delivery:string;quality:string;
    commission?:number;promotion?:string;volumeBonus?:string;deadline:string;tiers?:Array<{minQty:number;price:number}>
  }){
    await this.access(groupId,true);const title=input.title.trim();if(!title)throw Error('DEAL_TITLE_REQUIRED');
    if(!['PUBLIC_DEAL','GROUP_DEAL','SUPPLIER_DEAL','FRESH_DEAL','BULK_DEAL','INSTITUTIONAL_DEAL'].includes(input.dealType))throw Error('INVALID_DEAL_TYPE');
    const nums=[input.publicPrice,input.supplierPrice??0,input.supplierMinimum,input.maxQuantity,input.commission??0];if(nums.some(x=>!Number.isSafeInteger(Number(x))||Number(x)<0)||input.supplierMinimum<=0||input.maxQuantity<input.supplierMinimum)throw Error('INVALID_DEAL_NUMBERS');
    if(!input.delivery.trim()||!input.quality.trim())throw Error('DEAL_PUBLIC_TERMS_REQUIRED');
    if(!Number.isFinite(Date.parse(input.deadline))||Date.parse(input.deadline)<=Date.now())throw Error('INVALID_DEADLINE');
    if(input.supplierId&&!(await this.list(groupId,'SUPPLIER')).some(x=>x.id===input.supplierId))throw Error('SUPPLIER_NOT_FOUND');
    if(input.stockItemId){
      const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===input.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
      const available=Math.max(0,Number(item.data.quantity)-Number(item.data.reserved??0));if(input.maxQuantity>available)throw Error('INSUFFICIENT_STOCK');
    }
    const tiers=(input.tiers??[]).map(x=>({minQty:qty(Number(x.minQty)),price:Number(x.price)})).sort((a,b)=>a.minQty-b.minQty);
    let priorMin=0,priorPrice=input.publicPrice;for(const tier of tiers){if(!Number.isSafeInteger(tier.price)||tier.price<0||tier.minQty<=priorMin||tier.price>priorPrice||tier.minQty>input.maxQuantity)throw Error('INVALID_DEAL_TIERS');priorMin=tier.minQty;priorPrice=tier.price;}
    return this.save(groupId,'DEAL',title,{dealType:input.dealType,supplierId:input.supplierId??'',stockItemId:input.stockItemId??'',publicPrice:input.publicPrice,supplierMinimum:input.supplierMinimum,maxQuantity:input.maxQuantity,delivery:input.delivery.trim(),quality:input.quality.trim(),deadline:new Date(input.deadline).toISOString(),tiersJson:JSON.stringify(tiers),committedQuantity:0,reservationsJson:'[]',state:'OPEN',supplierPrice:input.supplierPrice??0,commission:input.commission??0,promotion:input.promotion?.trim()??'',volumeBonus:input.volumeBonus?.trim()??'',internalTermsConfidential:true,realMoney:false});
  }
  private dealPrice(deal:MarketRecord,quantity:number){
    const tiers=JSON.parse(String(deal.data.tiersJson??'[]')) as Array<{minQty:number;price:number}>;let price=Number(deal.data.publicPrice??0);
    for(const tier of tiers)if(quantity>=tier.minQty)price=tier.price;return price;
  }
  async deals(groupId:Id,includeInternal=true){
    if(includeInternal)await this.access(groupId,true);else await this.access(groupId,false);
    const rows=(await this.list(groupId,'DEAL')),nowMs=Date.now(),out=[] as any[];
    for(const r0 of rows){let r=r0;if(['OPEN','THRESHOLD_MET'].includes(String(r.data.state))&&Date.parse(String(r.data.deadline??''))<=nowMs)r=await this.update(r,{state:'EXPIRED'},'DONE');
      if(includeInternal)out.push(r);else{const {supplierPrice,commission,promotion,volumeBonus,...publicData}=r.data as any;out.push({...r,data:publicData});}}
    return out;
  }
  async commitDeal(groupId:Id,id:Id,membershipId:Id,value:number){
    qty(value);const viewer=await this.access(groupId,false),ctx=this.kernel.context.get(),member=await this.repo.getMembership(ctx.tenantId,groupId,membershipId);if(!member||member.status!=='active')throw Error('MEMBERSHIP_NOT_FOUND');
    const viewerManager=!viewer||viewer.roles.some(r=>managers.has(r));if(!viewerManager&&viewer.id!==membershipId)throw Error('FORBIDDEN_SCOPE');
    const deal=(await this.list(groupId,'DEAL')).find(x=>x.id===id);if(!deal)throw Error('DEAL_NOT_FOUND');
    if(!['OPEN','THRESHOLD_MET'].includes(String(deal.data.state))||Date.parse(String(deal.data.deadline))<=Date.now())throw Error('DEAL_CLOSED');
    const reservations=JSON.parse(String(deal.data.reservationsJson??'[]')) as Array<{membershipId:Id;quantity:number}>,existing=reservations.find(x=>x.membershipId===membershipId),prior=existing?.quantity??0,next=prior+value,total=Number(deal.data.committedQuantity??0)+value;
    if(total>Number(deal.data.maxQuantity))throw Error('DEAL_MAX_QUANTITY_EXCEEDED');if(existing)existing.quantity=next;else reservations.push({membershipId,quantity:next});
    const state=total>=Number(deal.data.supplierMinimum)?'THRESHOLD_MET':'OPEN',price=this.dealPrice(deal,total);
    return this.update(deal,{reservationsJson:JSON.stringify(reservations),committedQuantity:total,state,currentPublicPrice:price});
  }
  async activateDeal(groupId:Id,id:Id){
    await this.access(groupId,true);const deal=(await this.list(groupId,'DEAL')).find(x=>x.id===id);if(!deal)throw Error('DEAL_NOT_FOUND');
    if(Number(deal.data.committedQuantity??0)<Number(deal.data.supplierMinimum??0))throw Error('DEAL_THRESHOLD_NOT_MET');
    return this.update(deal,{state:'ACTIVATED',activatedAt:now(),currentPublicPrice:this.dealPrice(deal,Number(deal.data.committedQuantity??0))});
  }
  async materializeDealOrders(groupId:Id,id:Id){
    await this.access(groupId,true);const deal=(await this.list(groupId,'DEAL')).find(x=>x.id===id);if(!deal)throw Error('DEAL_NOT_FOUND');
    if(String(deal.data.state)!=='ACTIVATED')throw Error('DEAL_NOT_ACTIVATED');const stockItemId=String(deal.data.stockItemId??'');if(!stockItemId)throw Error('DEAL_STOCK_REQUIRED');
    const reservations=JSON.parse(String(deal.data.reservationsJson??'[]')) as Array<{membershipId:Id;quantity:number}>,price=this.dealPrice(deal,Number(deal.data.committedQuantity??0)),orders=[];
    for(const r of reservations){const existing=(await this.list(groupId,'MARKET_ORDER')).find(x=>String(x.data.dealId??'')===deal.id&&String(x.data.membershipId??'')===r.membershipId);if(existing){orders.push(existing);continue;}
      const order=await this.createOrder(groupId,{stockItemId,quantity:r.quantity,customerRef:'membership:'+r.membershipId,unitPrice:price});orders.push(await this.update(order,{dealId:deal.id,membershipId:r.membershipId}));}
    await this.update(deal,{state:'FULFILLMENT',ordersMaterializedAt:now(),orderCount:orders.length});return orders;
  }
  async closeDeal(groupId:Id,id:Id){
    await this.access(groupId,true);const deal=(await this.list(groupId,'DEAL')).find(x=>x.id===id);if(!deal)throw Error('DEAL_NOT_FOUND');
    if(!['FULFILLMENT','ACTIVATED','EXPIRED'].includes(String(deal.data.state)))throw Error('DEAL_NOT_CLOSABLE');
    return this.update(deal,{state:'CLOSED',closedAt:now()},'DONE');
  }

  async createLiveMarket(groupId:Id,input:{title:string;theme:string;scheduledAt:string;capabilityLevel:0|1|2|3;dealId?:Id;stockItemId?:Id;communityHubId?:Id;mediaRef?:string}){
    await this.access(groupId,true);if(!input.title.trim()||!input.theme.trim())throw Error('LIVE_MARKET_REQUIRED');
    if(![0,1,2,3].includes(input.capabilityLevel))throw Error('INVALID_LIVE_CAPABILITY');
    if(!Number.isFinite(Date.parse(input.scheduledAt)))throw Error('INVALID_LIVE_DATE');
    if(input.dealId&&!(await this.list(groupId,'DEAL')).some(x=>x.id===input.dealId))throw Error('DEAL_NOT_FOUND');
    if(input.stockItemId){const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===input.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');if(String(item.data.ownership??'COMMERCIAL')==='POT_RESERVED')throw Error('POT_STOCK_NOT_SELLABLE');}
    const mediaRef=input.mediaRef?.trim()??'';if(mediaRef.length>2000)throw Error('INVALID_MEDIA_REF');
    return this.save(groupId,'LIVE_MARKET',input.title.trim(),{theme:input.theme.trim(),scheduledAt:new Date(input.scheduledAt).toISOString(),capabilityLevel:input.capabilityLevel,dealId:input.dealId??'',stockItemId:input.stockItemId??'',communityHubId:input.communityHubId??'',mediaRef,state:'SCHEDULED',participantsJson:'[]',questionsJson:'[]',viewerCount:0,realCounter:true});
  }
  async liveMarkets(groupId:Id){return this.list(groupId,'LIVE_MARKET');}
  async transitionLiveMarket(groupId:Id,id:Id,to:'LIVE'|'ENDED'){
    await this.access(groupId,true);const row=(await this.list(groupId,'LIVE_MARKET')).find(x=>x.id===id);if(!row)throw Error('LIVE_MARKET_NOT_FOUND');
    const current=String(row.data.state??''),allowed=current==='SCHEDULED'&&to==='LIVE'||current==='LIVE'&&to==='ENDED';if(!allowed)throw Error('INVALID_LIVE_MARKET_TRANSITION');
    return this.update(row,{state:to,[to==='LIVE'?'startedAt':'endedAt']:now()},to==='ENDED'?'DONE':'ACTIVE');
  }
  async joinLiveMarket(groupId:Id,id:Id){
    await this.access(groupId,false);const row=(await this.list(groupId,'LIVE_MARKET')).find(x=>x.id===id);if(!row)throw Error('LIVE_MARKET_NOT_FOUND');if(String(row.data.state)!=='LIVE')throw Error('LIVE_MARKET_NOT_LIVE');
    const actor=this.kernel.context.get().actorId,participants=JSON.parse(String(row.data.participantsJson??'[]')) as string[];if(!participants.includes(actor))participants.push(actor);
    return this.update(row,{participantsJson:JSON.stringify(participants),viewerCount:participants.length,lastJoinAt:now()});
  }
  async askLiveMarket(groupId:Id,id:Id,question:string){
    await this.access(groupId,false);const row=(await this.list(groupId,'LIVE_MARKET')).find(x=>x.id===id);if(!row)throw Error('LIVE_MARKET_NOT_FOUND');if(String(row.data.state)!=='LIVE')throw Error('LIVE_MARKET_NOT_LIVE');
    const text=question.trim();if(!text)throw Error('LIVE_QUESTION_REQUIRED');const questions=JSON.parse(String(row.data.questionsJson??'[]')) as Array<{id:string;actorId:string;text:string;at:string}>;
    questions.push({id:makeId('question'),actorId:this.kernel.context.get().actorId,text:text.slice(0,1000),at:now()});if(questions.length>200)questions.splice(0,questions.length-200);
    return this.update(row,{questionsJson:JSON.stringify(questions),questionCount:questions.length});
  }
  async valueMarketSnapshot(groupId:Id){
    await this.access(groupId,false);return{
      flashOffers:await this.flashOffers(groupId),requests:await this.marketRequests(groupId),responses:await this.marketResponses(groupId),
      deals:await this.deals(groupId,true),liveMarkets:await this.liveMarkets(groupId)
    };
  }

  async procurement(groupId:Id){return{procurements:await this.list(groupId,'PROCUREMENT'),credits:await this.list(groupId,'SUPPLIER_CREDIT'),suppliers:await this.list(groupId,'SUPPLIER')};}

}
