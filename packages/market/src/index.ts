import type {Id,Membership,WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const managers=new Set(['founder','manager','admin','president','treasurer']);
const now=()=>new Date().toISOString();
const qty=(v:number)=>{if(!Number.isSafeInteger(v)||v<=0)throw Error('INVALID_QUANTITY');return v;};
type MarketKind='STOCK_ITEM'|'MARKET_ORDER'|'GROUP_BUY';
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
  async createStock(groupId:Id,input:{sku:string;name:string;quantity:number;unit?:string}){
    qty(input.quantity);const sku=input.sku.trim(),name=input.name.trim();if(!sku||!name)throw Error('SKU_AND_NAME_REQUIRED');
    const duplicate=(await this.list(groupId,'STOCK_ITEM')).find(x=>String(x.data.sku).toLowerCase()===sku.toLowerCase());if(duplicate)throw Error('STOCK_SKU_EXISTS');
    return this.save(groupId,'STOCK_ITEM',name,{sku,quantity:input.quantity,reserved:0,unit:input.unit?.trim()||'unit'});
  }
  async adjustStock(groupId:Id,itemId:Id,delta:number,reason:string){
    await this.access(groupId,true);if(!Number.isSafeInteger(delta)||delta===0)throw Error('INVALID_STOCK_DELTA');if(!reason.trim())throw Error('REASON_REQUIRED');
    const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===itemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
    const next=Number(item.data.quantity)+delta,reserved=Number(item.data.reserved??0);if(next<reserved||next<0)throw Error('INSUFFICIENT_STOCK');
    return this.update(item,{quantity:next,lastAdjustmentReason:reason.trim()});
  }
  async createOrder(groupId:Id,input:{stockItemId:Id;quantity:number;customerRef:string;unitPrice?:number}){
    qty(input.quantity);const item=(await this.list(groupId,'STOCK_ITEM')).find(x=>x.id===input.stockItemId);if(!item)throw Error('STOCK_ITEM_NOT_FOUND');
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
}
