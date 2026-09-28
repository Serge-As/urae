import type {EvidenceRecord,Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const qty=(v:number)=>{if(!Number.isSafeInteger(v)||v<=0)throw Error('INVALID_QUANTITY');return v;};
type MarketKind='SHOP'|'STOCK_ITEM'|'MARKET_ORDER'|'GROUP_BUY'|'SUPPLIER'|'PROCUREMENT'|'SUPPLIER_INVOICE'|'PROCUREMENT_RECONCILIATION'|'SUPPLIER_CREDIT_NOTE'|'SUPPLIER_CREDIT'|'FLASH_OFFER'|'MARKET_REQUEST'|'MARKET_RESPONSE'|'DEAL'|'DEAL_COMMITMENT'|'LIVE_MARKET';
type StockOwnership='COMMERCIAL'|'POT_RESERVED'|'CONSIGNMENT'|'DEPOSIT_SALE';
export type FlashOfferKind='LIQUIDATION'|'SURPLUS'|'RESCUE';
export type MarketRequestState='DRAFT'|'OPEN'|'RESPONSES'|'SHORTLIST'|'SELECTED'|'FULFILLMENT'|'CLOSED'|'DISPUTED';
export type DealType='PUBLIC'|'GROUP'|'SUPPLIER'|'FRESH'|'BULK'|'INSTITUTIONAL';
export type DealState='DRAFT'|'OPEN'|'FULFILLMENT'|'CLOSED'|'DISPUTED';
export type LiveMarketMode='TEXT'|'MEDIA'|'VIDEO'|'INTERACTIVE';
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
  private async stockMovement(groupId:Id,itemId:Id,input:{kind:'INITIAL'|'ADJUSTMENT'|'RESERVATION'|'DELIVERY'|'CUSTOMER_RETURN'|'PROCUREMENT_RECEIPT'|'SUPPLIER_RETURN';quantityDelta:number;reservedDelta:number;sourceType:string;sourceId:string;note?:string;operationId?:string}):Promise<EvidenceRecord>{
    const ctx=this.kernel.context.get(),stamp=now();
    const record:EvidenceRecord={id:makeId('evidence'),tenantId:ctx.tenantId,type:'MARKET_STOCK_MOVEMENT',subjectType:'MARKET_STOCK_ITEM',subjectId:itemId,createdAt:stamp,createdBy:ctx.actorId,immutable:true,data:{groupId,kind:input.kind,quantityDelta:input.quantityDelta,reservedDelta:input.reservedDelta,sourceType:input.sourceType,sourceId:input.sourceId,note:input.note?.trim()??'',operationId:input.operationId??'',at:stamp}};
    await this.repo.saveEvidence(record);return record;
  }
  async stockMovements(groupId:Id,itemId?:Id){
    await this.access(groupId,false);const ctx=this.kernel.context.get(),rows=await this.repo.listEvidence(ctx.tenantId,'MARKET_STOCK_ITEM');
    return rows.filter(x=>String(x.data.groupId??'')===groupId&&(!itemId||x.subjectId===itemId)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  }
  async stockProjection(groupId:Id,itemId:Id){
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===itemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    const movements=await this.stockMovements(groupId,itemId),projected=movements.reduce((acc,x)=>({quantity:acc.quantity+Number(x.data.quantityDelta??0),reserved:acc.reserved+Number(x.data.reservedDelta??0)}),{quantity:0,reserved:0});
    return{itemId,current:{quantity:Number(item.data.quantity??0),reserved:Number(item.data.reserved??0)},projected,complete:movements.some(x=>String(x.data.kind)==='INITIAL'),movementCount:movements.length,matchesCurrent:projected.quantity===Number(item.data.quantity??0)&&projected.reserved===Number(item.data.reserved??0)};
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
    const item=await this.save(groupId,'STOCK_ITEM',name,{sku,quantity:input.quantity,reserved:0,unit:input.unit?.trim()||'unit',unitPrice:input.unitPrice??0,description:input.description?.trim().slice(0,500)??'',published,ownership,ownerRef:input.ownerRef?.trim()??''});
    await this.stockMovement(groupId,item.id,{kind:'INITIAL',quantityDelta:input.quantity,reservedDelta:0,sourceType:'STOCK_ITEM',sourceId:item.id,note:'Stock initial'});
    return item;
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
    const updated=await this.update(item,{quantity:next,lastAdjustmentReason:reason.trim()});
    await this.stockMovement(groupId,item.id,{kind:'ADJUSTMENT',quantityDelta:delta,reservedDelta:0,sourceType:'STOCK_ADJUSTMENT',sourceId:updated.id,note:reason.trim()});
    return updated;
  }
  async createOrder(groupId:Id,input:{stockItemId:Id;quantity:number;customerRef:string;unitPrice?:number},allowMember=false){
    qty(input.quantity);await this.access(groupId,!allowMember);const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===input.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    if(String(item.data.ownership??'COMMERCIAL')==='POT_RESERVED')throw Error('POT_STOCK_NOT_SELLABLE');
    const available=Number(item.data.quantity)-Number(item.data.reserved??0);if(available<input.quantity)throw Error('INSUFFICIENT_STOCK');
    const customerRef=input.customerRef.trim();if(!customerRef)throw Error('CUSTOMER_REFERENCE_REQUIRED');
    const ctx=this.kernel.context.get(),stamp=now(),operationId=makeId('market_reserve'),expectedVersion=Number(item.data.version??1);
    const stock:MarketRecord={...item,data:{...item.data,reserved:Number(item.data.reserved??0)+input.quantity,version:expectedVersion+1,lastReservationOperationId:operationId},updatedAt:stamp};
    const order:MarketRecord={id:makeId('market'),tenantId:ctx.tenantId,groupId,moduleId:'MARKETPLACE.CORE',title:'Order '+String(item.data.sku),status:'ACTIVE',tags:['market-engine','kind:MARKET_ORDER'],data:{stockItemId:item.id,quantity:input.quantity,customerRef,unitPrice:input.unitPrice??0,state:'CONFIRMED',deliveredQuantity:0,returnedQuantity:0,disputed:false,marketKind:'MARKET_ORDER',version:1,reservationOperationId:operationId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    const movement:EvidenceRecord={id:makeId('evidence'),tenantId:ctx.tenantId,type:'MARKET_STOCK_MOVEMENT',subjectType:'MARKET_STOCK_ITEM',subjectId:item.id,createdAt:stamp,createdBy:ctx.actorId,immutable:true,data:{groupId,kind:'RESERVATION',quantityDelta:0,reservedDelta:input.quantity,sourceType:'MARKET_ORDER',sourceId:order.id,note:'Réservation atomique',operationId,at:stamp}};
    try{await this.repo.commitMarketStockReservation({operationId,tenantId:ctx.tenantId,groupId,stock,order,movement,expectedVersion,reservationQuantity:input.quantity});}
    catch(error){if(error instanceof Error&&error.message==='MARKET_STOCK_RESERVATION_CONFLICT')throw Error('INSUFFICIENT_STOCK');throw error;}
    return order;
  }
  async deliver(groupId:Id,orderId:Id,value:number){
    qty(value);const order=(await this.list(groupId,'MARKET_ORDER')).find(x=>x.id===orderId);if(!order)throw Error('ORDER_NOT_FOUND');
    const ordered=Number(order.data.quantity),delivered=Number(order.data.deliveredQuantity??0),returned=Number(order.data.returnedQuantity??0);
    if(delivered+value>ordered)throw Error('DELIVERY_EXCEEDS_ORDER');
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===order.data.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    if(Number(item.data.quantity)<value||Number(item.data.reserved)<value)throw Error('INSUFFICIENT_STOCK');
    await this.update(item,{quantity:Number(item.data.quantity)-value,reserved:Number(item.data.reserved)-value});
    await this.stockMovement(groupId,item.id,{kind:'DELIVERY',quantityDelta:-value,reservedDelta:-value,sourceType:'MARKET_ORDER',sourceId:order.id,note:'Livraison client'});
    const nextDelivered=delivered+value;return this.update(order,{deliveredQuantity:nextDelivered,state:nextDelivered===ordered?'DELIVERED':'PARTIAL',returnedQuantity:returned});
  }
  async returnItems(groupId:Id,orderId:Id,value:number,reason:string){
    qty(value);if(!reason.trim())throw Error('REASON_REQUIRED');const order=(await this.list(groupId,'MARKET_ORDER')).find(x=>x.id===orderId);if(!order)throw Error('ORDER_NOT_FOUND');
    const delivered=Number(order.data.deliveredQuantity??0),returned=Number(order.data.returnedQuantity??0);if(returned+value>delivered)throw Error('RETURN_EXCEEDS_DELIVERY');
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===order.data.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    await this.update(item,{quantity:Number(item.data.quantity)+value});
    await this.stockMovement(groupId,item.id,{kind:'CUSTOMER_RETURN',quantityDelta:value,reservedDelta:0,sourceType:'MARKET_ORDER',sourceId:order.id,note:reason.trim()});
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

  async createProcurement(groupId:Id,input:{supplierId:Id;debtorType:'GROUP'|'BUSINESS';debtorRef:Id;lines:Array<{sku?:string;label:string;quantity:number;unitCost:number}>;freight?:number;otherCosts?:number;discount?:number;currency?:string;creditDueAt?:string;sourceNeedId?:Id;sourceOfferId?:Id;sourceDraftId?:Id}){
    await this.access(groupId,true);
    const supplier=(await this.list(groupId,'SUPPLIER')).find(x=>x.id===input.supplierId);if(!supplier)throw Error('SUPPLIER_NOT_FOUND');
    if(input.debtorType==='GROUP'&&input.debtorRef!==groupId)throw Error('SUPPLIER_CREDIT_DEBTOR_MISMATCH');
    if(!input.debtorRef.trim())throw Error('DEBTOR_REFERENCE_REQUIRED');
    if(input.sourceDraftId){const prior=(await this.list(groupId,'PROCUREMENT')).find(x=>String(x.data.sourceDraftId??'')===input.sourceDraftId);if(prior)return prior;}
    const lines=input.lines.map(x=>({sku:x.sku?.trim()??'',label:x.label.trim(),quantity:qty(x.quantity),unitCost:Number(x.unitCost)}));
    if(!lines.length||lines.some(x=>!x.label||!Number.isSafeInteger(x.unitCost)||x.unitCost<0))throw Error('INVALID_PROCUREMENT_LINES');
    const goodsCost=lines.reduce((n,x)=>n+x.quantity*x.unitCost,0),freight=Number(input.freight??0),other=Number(input.otherCosts??0),discount=Number(input.discount??0),gross=goodsCost+freight+other;
    if(!Number.isSafeInteger(freight)||freight<0||!Number.isSafeInteger(other)||other<0||!Number.isSafeInteger(discount)||discount<0||discount>gross)throw Error('INVALID_LANDED_COST');
    if(input.creditDueAt&&(!Number.isFinite(Date.parse(input.creditDueAt))||Date.parse(input.creditDueAt)<=Date.now()))throw Error('INVALID_CREDIT_DUE_AT');
    return this.save(groupId,'PROCUREMENT','Approvisionnement · '+supplier.title,{supplierId:supplier.id,debtorType:input.debtorType,debtorRef:input.debtorRef,linesJson:JSON.stringify(lines),goodsCost,freight,otherCosts:other,discount,landedCost:gross-discount,currency:input.currency??'XAF',creditDueAt:input.creditDueAt?new Date(input.creditDueAt).toISOString():'',sourceNeedId:input.sourceNeedId??'',sourceOfferId:input.sourceOfferId??'',sourceDraftId:input.sourceDraftId??'',state:'ORDERED',receivedLinesJson:'[]',returnedLinesJson:'[]'});
  }
  async approveValueProcurementDraft(groupId:Id,draftId:Id,input:{supplierId:Id;debtorType:'GROUP'|'BUSINESS';debtorRef:Id;creditDueAt?:string}){
    await this.access(groupId,true);const ctx=this.kernel.context.get(),draft=await this.repo.getWorkspaceRecord(ctx.tenantId,draftId);
    if(!draft||draft.groupId!==groupId||draft.moduleId!=='MARKETPLACE.PROCUREMENT')throw Error('VALUE_PROCUREMENT_DRAFT_NOT_FOUND');
    const state=String(draft.data.state??'DRAFT');if(!['DRAFT','HANDED_OFF'].includes(state))throw Error('VALUE_PROCUREMENT_DRAFT_NOT_APPROVABLE');
    if(draft.data.requiresExplicitApproval!==true)throw Error('VALUE_PROCUREMENT_EXPLICIT_APPROVAL_REQUIRED');
    const prior=(await this.list(groupId,'PROCUREMENT')).find(x=>String(x.data.sourceDraftId??'')===draftId);
    if(prior){if(state!=='HANDED_OFF')await this.repo.saveWorkspaceRecord({...draft,status:'DONE',data:{...draft.data,state:'HANDED_OFF',procurementId:prior.id,handedOffAt:now()},updatedAt:now()});return prior;}
    const quantity=qty(Number(draft.data.quantity)),unitPrice=Number(draft.data.unitPrice??0),transportCost=Number(draft.data.transportCost??0),otherCosts=Number(draft.data.otherCosts??0),discount=Number(draft.data.discount??0);
    if(!Number.isSafeInteger(unitPrice)||unitPrice<0)throw Error('INVALID_PROCUREMENT_LINES');
    const procurement=await this.createProcurement(groupId,{supplierId:input.supplierId,debtorType:input.debtorType,debtorRef:input.debtorRef,lines:[{label:String(draft.data.needTitle??draft.title),quantity,unitCost:unitPrice}],freight:transportCost,otherCosts,discount,currency:String(draft.data.currency??'XAF'),creditDueAt:input.creditDueAt,sourceNeedId:String(draft.data.needId??''),sourceOfferId:String(draft.data.offerId??''),sourceDraftId:draft.id});
    await this.repo.saveWorkspaceRecord({...draft,status:'DONE',data:{...draft.data,state:'HANDED_OFF',procurementId:procurement.id,handedOffAt:now(),createsOrder:true,createsDebt:Boolean(input.creditDueAt)},updatedAt:now()});
    return procurement;
  }
  async receiveProcurement(groupId:Id,procurementId:Id,input:{lines:Array<{lineIndex:number;quantity:number}>;stockOwnership?:StockOwnership}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');
    const ordered=JSON.parse(String(p.data.linesJson??'[]')) as Array<{sku:string;label:string;quantity:number;unitCost:number}>,received=JSON.parse(String(p.data.receivedLinesJson??'[]')) as Array<{lineIndex:number;quantity:number}>;
    for(const row of input.lines){if(!Number.isSafeInteger(row.lineIndex)||row.lineIndex<0||row.lineIndex>=ordered.length)throw Error('PROCUREMENT_LINE_NOT_FOUND');qty(row.quantity);const prior=received.filter(x=>x.lineIndex===row.lineIndex).reduce((n,x)=>n+x.quantity,0);if(prior+row.quantity>ordered[row.lineIndex]!.quantity)throw Error('RECEIPT_EXCEEDS_ORDER');received.push({lineIndex:row.lineIndex,quantity:row.quantity});}
    const fully=ordered.every((x,i)=>received.filter(r=>r.lineIndex===i).reduce((n,r)=>n+r.quantity,0)>=x.quantity);
    const next=await this.update(p,{receivedLinesJson:JSON.stringify(received),state:fully?'RECEIVED':'PARTIAL_RECEIPT',receivedAt:now()});
    const ownership=input.stockOwnership??'COMMERCIAL';
    for(const row of input.lines){
      const line=ordered[row.lineIndex]!,sku=line.sku||('proc-'+procurementId+'-'+row.lineIndex),existing=(await this.list(groupId,'STOCK_ITEM')).find(x=>String(x.data.sku)===sku);
      if(existing){await this.update(existing,{quantity:Number(existing.data.quantity)+row.quantity});await this.stockMovement(groupId,existing.id,{kind:'PROCUREMENT_RECEIPT',quantityDelta:row.quantity,reservedDelta:0,sourceType:'PROCUREMENT',sourceId:p.id,note:'Réception fournisseur'});}
      else await this.createStock(groupId,{sku,name:line.label,quantity:row.quantity,unitPrice:line.unitCost,published:false,ownership});
    }
    if(fully&&String(p.data.creditDueAt??'')){const existing=(await this.list(groupId,'SUPPLIER_CREDIT')).find(x=>String(x.data.procurementId)===procurementId);if(!existing)await this.createSupplierCredit(groupId,{procurementId,amount:Number(p.data.landedCost),dueAt:String(p.data.creditDueAt)});}
    return next;
  }
  async returnProcurement(groupId:Id,procurementId:Id,input:{lineIndex:number;quantity:number;reason:string}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');qty(input.quantity);if(!input.reason.trim())throw Error('REASON_REQUIRED');
    const ordered=JSON.parse(String(p.data.linesJson??'[]')) as Array<{quantity:number}>,received=JSON.parse(String(p.data.receivedLinesJson??'[]')) as Array<{lineIndex:number;quantity:number}>,returned=JSON.parse(String(p.data.returnedLinesJson??'[]')) as Array<{lineIndex:number;quantity:number;reason:string}>;
    if(!ordered[input.lineIndex])throw Error('PROCUREMENT_LINE_NOT_FOUND');const have=received.filter(x=>x.lineIndex===input.lineIndex).reduce((n,x)=>n+x.quantity,0)-returned.filter(x=>x.lineIndex===input.lineIndex).reduce((n,x)=>n+x.quantity,0);if(input.quantity>have)throw Error('RETURN_EXCEEDS_RECEIPT');
    const fullLines=JSON.parse(String(p.data.linesJson??'[]')) as Array<{sku?:string;label?:string;quantity:number}>,line=fullLines[input.lineIndex]!,sku=line.sku||('proc-'+procurementId+'-'+input.lineIndex),stock=(await this.list(groupId,'STOCK_ITEM')).find(x=>String(x.data.sku)===sku);
    if(!stock)throw Error('STOCK_ITEM_NOT_FOUND');const nextQuantity=Number(stock.data.quantity)-input.quantity,reserved=Number(stock.data.reserved??0);if(nextQuantity<reserved||nextQuantity<0)throw Error('RETURN_STOCK_ALREADY_COMMITTED');
    await this.update(stock,{quantity:nextQuantity,lastAdjustmentReason:'Retour fournisseur · '+input.reason.trim()});
    await this.stockMovement(groupId,stock.id,{kind:'SUPPLIER_RETURN',quantityDelta:-input.quantity,reservedDelta:0,sourceType:'PROCUREMENT',sourceId:p.id,note:input.reason.trim()});
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
  async recordSupplierInvoice(groupId:Id,input:{procurementId:Id;invoiceRef:string;amount:number;currency?:string;evidenceRef:string;issuedAt?:string}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===input.procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');
    const invoiceRef=input.invoiceRef.trim(),evidenceRef=input.evidenceRef.trim();if(!invoiceRef||!evidenceRef)throw Error('SUPPLIER_INVOICE_EVIDENCE_REQUIRED');
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_INVOICE_AMOUNT');
    const duplicate=(await this.list(groupId,'SUPPLIER_INVOICE')).find(x=>String(x.data.procurementId)===p.id&&String(x.data.invoiceRef).toLowerCase()===invoiceRef.toLowerCase());if(duplicate)return duplicate;
    const issuedAt=input.issuedAt?new Date(input.issuedAt).toISOString():now();
    return this.save(groupId,'SUPPLIER_INVOICE','Facture · '+invoiceRef,{procurementId:p.id,supplierId:String(p.data.supplierId),invoiceRef,amount:input.amount,currency:input.currency??String(p.data.currency??'XAF'),evidenceRef,issuedAt,state:'RECEIVED'});
  }
  async reconcileSupplierInvoice(groupId:Id,input:{procurementId:Id;invoiceId:Id;note?:string}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===input.procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');
    const invoice=(await this.list(groupId,'SUPPLIER_INVOICE')).find(x=>x.id===input.invoiceId&&String(x.data.procurementId)===p.id);if(!invoice)throw Error('SUPPLIER_INVOICE_NOT_FOUND');
    const landed=Number(p.data.landedCost??0),invoiced=Number(invoice.data.amount??0),difference=invoiced-landed,note=input.note?.trim()??'';
    if(difference!==0&&!note)throw Error('RECONCILIATION_VARIANCE_NOTE_REQUIRED');
    const previous=(await this.list(groupId,'PROCUREMENT_RECONCILIATION')).find(x=>String(x.data.procurementId)===p.id&&String(x.data.invoiceId)===invoice.id);
    if(previous)return this.update(previous,{landedCost:landed,invoicedAmount:invoiced,difference,state:difference===0?'MATCHED':'VARIANCE',note,reconciledAt:now()});
    return this.save(groupId,'PROCUREMENT_RECONCILIATION','Rapprochement · '+invoice.title,{procurementId:p.id,invoiceId:invoice.id,landedCost:landed,invoicedAmount:invoiced,difference,state:difference===0?'MATCHED':'VARIANCE',note,reconciledAt:now()});
  }
  async issueSupplierCreditNote(groupId:Id,input:{procurementId:Id;invoiceId?:Id;amount:number;reason:string;evidenceRef:string}){
    await this.access(groupId,true);const p=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===input.procurementId);if(!p)throw Error('PROCUREMENT_NOT_FOUND');
    if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw Error('INVALID_CREDIT_NOTE_AMOUNT');const reason=input.reason.trim(),evidenceRef=input.evidenceRef.trim();if(!reason||!evidenceRef)throw Error('CREDIT_NOTE_EVIDENCE_REQUIRED');
    let invoice:MarketRecord|undefined;if(input.invoiceId){invoice=(await this.list(groupId,'SUPPLIER_INVOICE')).find(x=>x.id===input.invoiceId&&String(x.data.procurementId)===p.id);if(!invoice)throw Error('SUPPLIER_INVOICE_NOT_FOUND');}
    const notes=(await this.list(groupId,'SUPPLIER_CREDIT_NOTE')).filter(x=>String(x.data.procurementId)===p.id),already=notes.reduce((n,x)=>n+Number(x.data.amount??0),0),max=invoice?Number(invoice.data.amount):Number(p.data.landedCost??0);
    if(already+input.amount>max)throw Error('CREDIT_NOTE_EXCEEDS_PAYABLE');
    const note=await this.save(groupId,'SUPPLIER_CREDIT_NOTE','Avoir fournisseur · '+p.title,{procurementId:p.id,invoiceId:invoice?.id??'',supplierId:String(p.data.supplierId),amount:input.amount,currency:String(p.data.currency??'XAF'),reason,evidenceRef,issuedAt:now(),state:'ISSUED'});
    const credit=(await this.list(groupId,'SUPPLIER_CREDIT')).find(x=>String(x.data.procurementId)===p.id);
    if(credit){const principal=Number(credit.data.principal??0),paid=Number(credit.data.paidAmount??0),nextPrincipal=principal-input.amount;if(nextPrincipal<paid)throw Error('CREDIT_NOTE_EXCEEDS_OUTSTANDING_DEBT');await this.update(credit,{principal:nextPrincipal,creditNoteTotal:Number(credit.data.creditNoteTotal??0)+input.amount,state:nextPrincipal===paid?'PAID':String(credit.data.state??'OPEN')},nextPrincipal===paid?'DONE':'ACTIVE');}
    return note;
  }
  async procurementLifecycle(groupId:Id,procurementId:Id){
    const procurement=(await this.list(groupId,'PROCUREMENT')).find(x=>x.id===procurementId);if(!procurement)throw Error('PROCUREMENT_NOT_FOUND');
    const [invoices,reconciliations,creditNotes,credits]=await Promise.all([this.list(groupId,'SUPPLIER_INVOICE'),this.list(groupId,'PROCUREMENT_RECONCILIATION'),this.list(groupId,'SUPPLIER_CREDIT_NOTE'),this.list(groupId,'SUPPLIER_CREDIT')]);
    return{procurement,invoices:invoices.filter(x=>String(x.data.procurementId)===procurementId),reconciliations:reconciliations.filter(x=>String(x.data.procurementId)===procurementId),creditNotes:creditNotes.filter(x=>String(x.data.procurementId)===procurementId),credits:credits.filter(x=>String(x.data.procurementId)===procurementId)};
  }
  async procurement(groupId:Id){return{procurements:await this.list(groupId,'PROCUREMENT'),credits:await this.list(groupId,'SUPPLIER_CREDIT'),suppliers:await this.list(groupId,'SUPPLIER')};}

  async createFlashOffer(groupId:Id,input:{kind:FlashOfferKind;title:string;reason:string;condition:string;quantity:number;unit:string;unitPrice:number;currency?:string;locality?:string;expiresAt:string;evidenceRef:string}){
    await this.access(groupId,true);
    if(!['LIQUIDATION','SURPLUS','RESCUE'].includes(input.kind))throw Error('INVALID_FLASH_OFFER_KIND');
    const title=input.title.trim(),reason=input.reason.trim(),condition=input.condition.trim(),evidenceRef=input.evidenceRef.trim();
    if(!title||!reason||!condition||!evidenceRef)throw Error('FLASH_OFFER_DISCLOSURE_REQUIRED');
    const expires=Date.parse(input.expiresAt);if(!Number.isFinite(expires)||expires<=Date.now())throw Error('INVALID_FLASH_OFFER_EXPIRY');
    if(!Number.isSafeInteger(input.unitPrice)||input.unitPrice<0)throw Error('INVALID_FLASH_OFFER_PRICE');
    return this.save(groupId,'FLASH_OFFER',title,{flashKind:input.kind,reason,condition,quantity:qty(input.quantity),unit:input.unit.trim()||'unité',unitPrice:input.unitPrice,currency:(input.currency??'XAF').trim().toUpperCase(),locality:input.locality?.trim()??'',expiresAt:new Date(expires).toISOString(),evidenceRef,state:'OPEN',truthDisclosure:true,createdAt:now()});
  }
  async flashOffers(groupId:Id){return (await this.list(groupId,'FLASH_OFFER')).filter(x=>String(x.data.state)!=='CLOSED');}
  async closeFlashOffer(groupId:Id,id:Id,reason=''){
    await this.access(groupId,true);const row=(await this.list(groupId,'FLASH_OFFER')).find(x=>x.id===id);if(!row)throw Error('FLASH_OFFER_NOT_FOUND');
    return this.update(row,{state:'CLOSED',closedAt:now(),closeReason:reason.trim()},'DONE');
  }

  async createMarketRequest(groupId:Id,input:{title:string;category:string;quantity:number;unit:string;locality?:string;neededBy?:string;budgetMax?:number;currency?:string;conditions?:string;evidenceRef?:string;sourceType?:'MANUAL'|'PREDICTION';predictionReason?:string}){
    await this.access(groupId,true);const title=input.title.trim(),category=input.category.trim();if(!title||!category)throw Error('MARKET_REQUEST_FIELDS_REQUIRED');
    const needed=input.neededBy?Date.parse(input.neededBy):NaN;if(input.neededBy&&(!Number.isFinite(needed)||needed<=Date.now()))throw Error('INVALID_MARKET_REQUEST_DEADLINE');
    if(input.budgetMax!==undefined&&(!Number.isSafeInteger(input.budgetMax)||input.budgetMax<0))throw Error('INVALID_MARKET_REQUEST_BUDGET');
    const source=input.sourceType??'MANUAL',predicted=source==='PREDICTION';if(predicted&&!input.predictionReason?.trim())throw Error('PREDICTION_REASON_REQUIRED');
    return this.save(groupId,'MARKET_REQUEST',title,{requestState:'DRAFT',category,quantity:qty(input.quantity),unit:input.unit.trim()||'unité',locality:input.locality?.trim()??'',neededBy:input.neededBy?new Date(needed).toISOString():'',budgetMax:input.budgetMax??0,budgetSpecified:input.budgetMax!==undefined,currency:(input.currency??'XAF').trim().toUpperCase(),conditions:input.conditions?.trim()??'',evidenceRef:input.evidenceRef?.trim()??'',sourceType:source,predictionReason:input.predictionReason?.trim()??'',humanAccepted:!predicted,responseCount:0,createdAt:now()});
  }
  async marketRequests(groupId:Id){return this.list(groupId,'MARKET_REQUEST');}
  async acceptPredictedMarketRequest(groupId:Id,id:Id){
    await this.access(groupId,true);const row=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===id);if(!row)throw Error('MARKET_REQUEST_NOT_FOUND');
    if(String(row.data.sourceType)!=='PREDICTION')throw Error('REQUEST_NOT_PREDICTED');if(String(row.data.requestState)!=='DRAFT')throw Error('MARKET_REQUEST_NOT_DRAFT');
    return this.update(row,{humanAccepted:true,humanAcceptedAt:now()});
  }
  async openMarketRequest(groupId:Id,id:Id){
    await this.access(groupId,true);const row=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===id);if(!row)throw Error('MARKET_REQUEST_NOT_FOUND');
    if(String(row.data.requestState)!=='DRAFT')throw Error('MARKET_REQUEST_NOT_DRAFT');if(row.data.humanAccepted!==true)throw Error('PREDICTED_DEMAND_HUMAN_ACCEPTANCE_REQUIRED');
    return this.update(row,{requestState:'OPEN',openedAt:now()});
  }
  async respondMarketRequest(groupId:Id,requestId:Id,input:{supplierRef:string;price:number;currency?:string;availableQuantity:number;deliveryAt?:string;conditions?:string;evidenceRef?:string;variant?:string}){
    await this.access(groupId,true);const request=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===requestId);if(!request)throw Error('MARKET_REQUEST_NOT_FOUND');
    if(!['OPEN','RESPONSES'].includes(String(request.data.requestState)))throw Error('MARKET_REQUEST_NOT_OPEN');
    if(!input.supplierRef.trim())throw Error('SUPPLIER_REFERENCE_REQUIRED');if(!Number.isSafeInteger(input.price)||input.price<0)throw Error('INVALID_MARKET_RESPONSE_PRICE');
    const delivery=input.deliveryAt?Date.parse(input.deliveryAt):NaN;if(input.deliveryAt&&!Number.isFinite(delivery))throw Error('INVALID_DELIVERY_AT');
    const response=await this.save(groupId,'MARKET_RESPONSE','Réponse · '+request.title,{requestId,supplierRef:input.supplierRef.trim(),price:input.price,currency:(input.currency??String(request.data.currency??'XAF')).trim().toUpperCase(),availableQuantity:qty(input.availableQuantity),deliveryAt:input.deliveryAt?new Date(delivery).toISOString():'',conditions:input.conditions?.trim()??'',evidenceRef:input.evidenceRef?.trim()??'',variant:input.variant?.trim()??'',responseState:'SUBMITTED',submittedAt:now()});
    await this.update(request,{requestState:'RESPONSES',responseCount:Number(request.data.responseCount??0)+1});
    return response;
  }
  async marketRequestResponses(groupId:Id,requestId:Id){return (await this.list(groupId,'MARKET_RESPONSE')).filter(x=>String(x.data.requestId)===requestId);}
  async shortlistMarketResponse(groupId:Id,requestId:Id,responseId:Id){
    await this.access(groupId,true);const request=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===requestId),response=(await this.list(groupId,'MARKET_RESPONSE')).find(x=>x.id===responseId&&String(x.data.requestId)===requestId);if(!request||!response)throw Error('MARKET_RESPONSE_NOT_FOUND');
    if(!['RESPONSES','SHORTLIST'].includes(String(request.data.requestState)))throw Error('MARKET_REQUEST_NOT_IN_RESPONSES');
    await this.update(response,{responseState:'SHORTLISTED',shortlistedAt:now()});return this.update(request,{requestState:'SHORTLIST'});
  }
  async selectMarketResponse(groupId:Id,requestId:Id,responseId:Id){
    await this.access(groupId,true);const request=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===requestId),response=(await this.list(groupId,'MARKET_RESPONSE')).find(x=>x.id===responseId&&String(x.data.requestId)===requestId);if(!request||!response)throw Error('MARKET_RESPONSE_NOT_FOUND');
    if(!['RESPONSES','SHORTLIST'].includes(String(request.data.requestState)))throw Error('MARKET_REQUEST_NOT_SELECTABLE');
    await this.update(response,{responseState:'SELECTED',selectedAt:now()});return this.update(request,{requestState:'SELECTED',selectedResponseId:responseId,selectedAt:now()});
  }
  async transitionMarketRequest(groupId:Id,id:Id,next:'FULFILLMENT'|'CLOSED'|'DISPUTED',note=''){
    await this.access(groupId,true);const row=(await this.list(groupId,'MARKET_REQUEST')).find(x=>x.id===id);if(!row)throw Error('MARKET_REQUEST_NOT_FOUND');const current=String(row.data.requestState) as MarketRequestState;
    const allowed:Record<string,string[]>={SELECTED:['FULFILLMENT','DISPUTED'],FULFILLMENT:['CLOSED','DISPUTED'],DISPUTED:['FULFILLMENT','CLOSED']};if(!allowed[current]?.includes(next))throw Error('INVALID_MARKET_REQUEST_TRANSITION');
    return this.update(row,{requestState:next,transitionNote:note.trim(),transitionedAt:now()},next==='CLOSED'?'DONE':'ACTIVE');
  }

  async createDeal(groupId:Id,input:{title:string;dealType:DealType;requestId?:Id;responseId?:Id;publicUnitPrice:number;currency?:string;quantity:number;availability:string;publicConditions:string;expiresAt:string;privateSupplierPrice?:number;privateMinimum?:number;commission?:number;promotion?:number;volumeBonus?:number;priceTiers?:Array<{minQuantity:number;unitPrice:number}>}){
    await this.access(groupId,true);if(!['PUBLIC','GROUP','SUPPLIER','FRESH','BULK','INSTITUTIONAL'].includes(input.dealType))throw Error('INVALID_DEAL_TYPE');
    if(!input.title.trim()||!input.availability.trim()||!input.publicConditions.trim())throw Error('PUBLIC_DEAL_TRUTH_REQUIRED');if(!Number.isSafeInteger(input.publicUnitPrice)||input.publicUnitPrice<0)throw Error('INVALID_DEAL_PRICE');
    const expires=Date.parse(input.expiresAt);if(!Number.isFinite(expires)||expires<=Date.now())throw Error('INVALID_DEAL_EXPIRY');
    const tiers=(input.priceTiers??[]).map(x=>({minQuantity:qty(x.minQuantity),unitPrice:x.unitPrice})).sort((a,b)=>a.minQuantity-b.minQuantity);for(let i=0;i<tiers.length;i++){if(!Number.isSafeInteger(tiers[i]!.unitPrice)||tiers[i]!.unitPrice<0)throw Error('INVALID_DEAL_TIER_PRICE');if(i&&tiers[i]!.unitPrice>tiers[i-1]!.unitPrice)throw Error('PRICE_DROP_TIER_MUST_NOT_INCREASE');}
    const privateTerms={supplierPrice:input.privateSupplierPrice??null,minimum:input.privateMinimum??null,commission:input.commission??null,promotion:input.promotion??null,volumeBonus:input.volumeBonus??null};
    return this.save(groupId,'DEAL',input.title.trim(),{dealType:input.dealType,dealState:'DRAFT',requestId:input.requestId??'',responseId:input.responseId??'',publicUnitPrice:input.publicUnitPrice,effectiveUnitPrice:input.publicUnitPrice,currency:(input.currency??'XAF').trim().toUpperCase(),quantity:qty(input.quantity),availability:input.availability.trim(),publicConditions:input.publicConditions.trim(),expiresAt:new Date(expires).toISOString(),privateTermsJson:JSON.stringify(privateTerms),priceTiersJson:JSON.stringify(tiers),committedQuantity:0,truthfulPublicTerms:true});
  }
  async deals(groupId:Id){return this.list(groupId,'DEAL');}
  async openDeal(groupId:Id,id:Id){
    await this.access(groupId,true);const row=(await this.list(groupId,'DEAL')).find(x=>x.id===id);if(!row)throw Error('DEAL_NOT_FOUND');if(String(row.data.dealState)!=='DRAFT')throw Error('DEAL_NOT_DRAFT');
    return this.update(row,{dealState:'OPEN',openedAt:now()});
  }
  async commitDealQuantity(groupId:Id,id:Id,quantity:number){
    const membership=await this.access(groupId,false),ctx=this.kernel.context.get(),row=(await this.list(groupId,'DEAL')).find(x=>x.id===id);if(!row)throw Error('DEAL_NOT_FOUND');if(String(row.data.dealState)!=='OPEN')throw Error('DEAL_NOT_OPEN');
    const add=qty(quantity),existing=(await this.list(groupId,'DEAL_COMMITMENT')).filter(x=>String(x.data.dealId)===id&&String(x.data.commitmentState)==='ACTIVE'),current=existing.reduce((n,x)=>n+Number(x.data.quantity??0),0),next=current+add;if(next>Number(row.data.quantity))throw Error('DEAL_QUANTITY_EXCEEDED');
    const commitment=await this.save(groupId,'DEAL_COMMITMENT','Engagement · '+row.title,{dealId:id,quantity:add,actorId:ctx.actorId,membershipId:membership?.id??'',commitmentState:'ACTIVE',committedAt:now()});
    const tiers=JSON.parse(String(row.data.priceTiersJson??'[]')) as Array<{minQuantity:number;unitPrice:number}>;let price=Number(row.data.publicUnitPrice);for(const tier of tiers)if(next>=tier.minQuantity)price=tier.unitPrice;
    const deal=await this.update(row,{committedQuantity:next,effectiveUnitPrice:price,lastCommitAt:now()});
    return{deal,commitment};
  }
  async dealCommitments(groupId:Id,id:Id){await this.access(groupId,false);return (await this.list(groupId,'DEAL_COMMITMENT')).filter(x=>String(x.data.dealId)===id&&String(x.data.commitmentState)==='ACTIVE');}
  async transitionDeal(groupId:Id,id:Id,next:'FULFILLMENT'|'CLOSED'|'DISPUTED',note=''){
    await this.access(groupId,true);const row=(await this.list(groupId,'DEAL')).find(x=>x.id===id);if(!row)throw Error('DEAL_NOT_FOUND');const current=String(row.data.dealState) as DealState;const allowed:Record<string,string[]>={OPEN:['FULFILLMENT','DISPUTED','CLOSED'],FULFILLMENT:['CLOSED','DISPUTED'],DISPUTED:['FULFILLMENT','CLOSED']};if(!allowed[current]?.includes(next))throw Error('INVALID_DEAL_TRANSITION');
    return this.update(row,{dealState:next,transitionNote:note.trim(),transitionedAt:now()},next==='CLOSED'?'DONE':'ACTIVE');
  }

  async createLiveMarket(groupId:Id,input:{title:string;theme?:string;scheduledAt:string;mode:LiveMarketMode;communityHubId?:Id;providerRef?:string;pinnedDealId?:Id}){
    await this.access(groupId,true);if(!['TEXT','MEDIA','VIDEO','INTERACTIVE'].includes(input.mode))throw Error('INVALID_LIVE_MARKET_MODE');if(!input.title.trim())throw Error('LIVE_MARKET_TITLE_REQUIRED');
    const scheduled=Date.parse(input.scheduledAt);if(!Number.isFinite(scheduled))throw Error('INVALID_LIVE_MARKET_DATE');if(input.mode==='VIDEO'&&!input.providerRef?.trim())throw Error('VIDEO_PROVIDER_REFERENCE_REQUIRED');if(input.mode==='INTERACTIVE'&&!input.communityHubId)throw Error('LIVE_MARKET_COMMUNITY_HUB_REQUIRED');
    if(input.pinnedDealId&&!(await this.list(groupId,'DEAL')).some(x=>x.id===input.pinnedDealId))throw Error('DEAL_NOT_FOUND');
    return this.save(groupId,'LIVE_MARKET',input.title.trim(),{liveState:'DRAFT',theme:input.theme?.trim()??'',scheduledAt:new Date(scheduled).toISOString(),mode:input.mode,communityHubId:input.communityHubId??'',providerRef:input.providerRef?.trim()??'',pinnedDealId:input.pinnedDealId??'',realViewerCount:false,falseCountdown:false});
  }
  async liveMarkets(groupId:Id){return this.list(groupId,'LIVE_MARKET');}
  async setLiveMarketState(groupId:Id,id:Id,next:'SCHEDULED'|'LIVE'|'CLOSED'){
    await this.access(groupId,true);const row=(await this.list(groupId,'LIVE_MARKET')).find(x=>x.id===id);if(!row)throw Error('LIVE_MARKET_NOT_FOUND');const current=String(row.data.liveState);const allowed:Record<string,string[]>={DRAFT:['SCHEDULED'],SCHEDULED:['LIVE','CLOSED'],LIVE:['CLOSED']};if(!allowed[current]?.includes(next))throw Error('INVALID_LIVE_MARKET_TRANSITION');
    return this.update(row,{liveState:next,liveChangedAt:now()},next==='CLOSED'?'DONE':'ACTIVE');
  }
  async pinLiveMarketDeal(groupId:Id,id:Id,dealId:Id){
    await this.access(groupId,true);const row=(await this.list(groupId,'LIVE_MARKET')).find(x=>x.id===id),deal=(await this.list(groupId,'DEAL')).find(x=>x.id===dealId);if(!row)throw Error('LIVE_MARKET_NOT_FOUND');if(!deal)throw Error('DEAL_NOT_FOUND');return this.update(row,{pinnedDealId:dealId,pinnedAt:now()});
  }
  async socialCommerce(groupId:Id){return{flashOffers:await this.list(groupId,'FLASH_OFFER'),requests:await this.list(groupId,'MARKET_REQUEST'),responses:await this.list(groupId,'MARKET_RESPONSE'),deals:await this.list(groupId,'DEAL'),commitments:await this.list(groupId,'DEAL_COMMITMENT'),liveMarkets:await this.list(groupId,'LIVE_MARKET')};}

}
