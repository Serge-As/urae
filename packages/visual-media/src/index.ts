import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import type {ArtifactStoreLike} from '../../imports/src/store.js';
import {makeId} from '../../contracts/src/index.js';

export const VISUAL_SLOTS=['HOME_HERO','GROUP_LOGO','GROUP_COVER','MARKET_HERO','FORUM_HERO','PROFILE_PHOTO','AD_CREATIVE','MARKET_PRODUCT','PARTNER_CREATIVE'] as const;
export type VisualSlot=typeof VISUAL_SLOTS[number];
const MODULE='MEDIA.VISUAL_ASSET';
const SLOT_MODULE='MEDIA.VISUAL_SLOT';
const MAX_MEDIA_BYTES=2_000_000;
const managers=new Set(['founder','manager','admin','president','treasurer']);
const keyFor=(groupId:string,slot:VisualSlot,actorId:string)=>'visual_slot_'+encodeURIComponent(groupId)+'_'+slot+(['PROFILE_PHOTO','PARTNER_CREATIVE'].includes(slot)?'_'+encodeURIComponent(actorId):'');
const stockVisualKey=(groupId:string,stockId:string)=>'visual_stock_'+encodeURIComponent(groupId)+'_'+encodeURIComponent(stockId);
const isValidSlot=(slot:string):slot is VisualSlot=>(VISUAL_SLOTS as readonly string[]).includes(slot);
export const sniffVisualMime=(bytes:Uint8Array):string=>{
  if(bytes.length>=45&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)){
    if(String.fromCharCode(...bytes.slice(12,16))!=='IHDR')throw Error('MEDIA_INVALID_PNG');
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),width=view.getUint32(16),height=view.getUint32(20);
    if(!width||!height||width>6000||height>6000||width*height>16000000)throw Error('MEDIA_INVALID_DIMENSIONS');
    return'image/png';
  }
  if(bytes.length>=6&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes.at(-2)===255&&bytes.at(-1)===217)return'image/jpeg';
  if(bytes.length>=20&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'&&['VP8 ','VP8L','VP8X'].includes(String.fromCharCode(...bytes.slice(12,16))))return'image/webp';
  throw Error('MEDIA_UNSUPPORTED_FORMAT');
};
export const assertVisualSize=(size:number)=>{
  if(!Number.isSafeInteger(size)||size<1||size>MAX_MEDIA_BYTES)throw Error('MEDIA_SIZE_OUT_OF_RANGE');
};

export class VisualMediaService {
  constructor(readonly repo:PlatformRepository,readonly kernel:PlatformKernel,readonly store:ArtifactStoreLike){}
  private async access(groupId:string,manager=false){
    const ctx=this.kernel.context.get();
    const group=await this.repo.getGroup(ctx.tenantId,groupId);
    if(!group)throw Error('GROUP_NOT_FOUND');
    if(group.createdBy===ctx.actorId)return;
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    if(!member||manager&&!member.roles.some(r=>managers.has(r)))throw Error('FORBIDDEN_SCOPE');
  }
  async upload(groupId:string,file:File,purpose:VisualSlot){
    if(!isValidSlot(purpose))throw Error('MEDIA_INVALID_PURPOSE');
    await this.access(groupId,!['PROFILE_PHOTO','PARTNER_CREATIVE'].includes(purpose));
    assertVisualSize(file.size);
    const bytes=new Uint8Array(await file.arrayBuffer()),mime=sniffVisualMime(bytes);
    if(file.type&&file.type.toLowerCase()!==mime)throw Error('MEDIA_MIME_MISMATCH');
    const ctx=this.kernel.context.get(),id=makeId('visual_media'),stamp=new Date().toISOString();
    // Compatible with the existing imports-scoped D1/R2 ArtifactStore contract.
    // Binary uploads require R2 and fail closed when only the D1 fallback is bound.
    const artifactKey='imports/'+ctx.tenantId+'/'+groupId+'/visual-media/'+id;
    await this.store.put(artifactKey,bytes,{httpMetadata:{contentType:mime},customMetadata:{tenantId:ctx.tenantId,groupId,ownerId:ctx.actorId,purpose}});
    const name=file.name.replace(/[<>\x00-\x1f]/g,'').slice(0,120)||'Photo';
    const row:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:MODULE,title:name,summary:'Image de présentation gouvernée · non publicitaire par défaut',status:'ACTIVE',tags:['media','private','purpose:'+purpose],data:{artifactKey,contentType:mime,size:bytes.length,purpose,ownerId:ctx.actorId},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(row);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'VISUAL_MEDIA_UPLOADED',targetType:'media',targetId:id,requestId:ctx.requestId,metadata:{groupId,purpose,mime,size:bytes.length}}));
    return this.safe(row);
  }
  private safe(row:WorkspaceRecord){return{id:row.id,groupId:row.groupId,purpose:String(row.data.purpose??''),name:row.title,contentType:String(row.data.contentType??''),size:Number(row.data.size??0),createdAt:row.createdAt,ownerId:String(row.data.ownerId??'')};}
  async list(groupId:string){
    await this.access(groupId);
    const ctx=this.kernel.context.get();
    const group=await this.repo.getGroup(ctx.tenantId,groupId);
    const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    const manage=group?.createdBy===ctx.actorId||Boolean(member?.roles.some(r=>managers.has(r)));
    return (await this.repo.listWorkspaceRecords(ctx.tenantId,MODULE,groupId))
      .filter(x=>x.status==='ACTIVE'&&(x.createdBy===ctx.actorId||(manage&&x.data.purpose!=='PROFILE_PHOTO')))
      .map(x=>this.safe(x));
  }
  async record(groupId:string,id:string,requireManage=false){
    await this.access(groupId,requireManage);
    const ctx=this.kernel.context.get(),row=await this.repo.getWorkspaceRecord(ctx.tenantId,id);
    if(!row||row.groupId!==groupId||row.moduleId!==MODULE||row.status!=='ACTIVE')throw Error('MEDIA_NOT_FOUND');
    if(row.data.purpose==='PROFILE_PHOTO'&&row.createdBy!==ctx.actorId)throw Error('FORBIDDEN_MEDIA_ACCESS');
    if(!requireManage&&row.createdBy!==ctx.actorId){
      if(row.data.purpose==='MARKET_PRODUCT'){
        const assigned=await this.stockVisuals(groupId);
        if(!Object.values(assigned).includes(id))throw Error('FORBIDDEN_MEDIA_ACCESS');
        return row;
      }
      const group=await this.repo.getGroup(ctx.tenantId,groupId);
      const member=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
      const manager=group?.createdBy===ctx.actorId||Boolean(member?.roles.some(r=>managers.has(r)));
      const slots=await this.presentation(groupId);
      const referenced=Object.values(slots).includes(id);
      if(!manager&&!referenced){
        let activeAdImage=false;
        if(['AD_CREATIVE','PARTNER_CREATIVE'].includes(String(row.data.purpose))){
          const campaigns=await this.repo.listWorkspaceRecords(ctx.tenantId,'ADS.MANAGER',groupId);
          activeAdImage=campaigns.some(c=>{
            if(c.groupId!==groupId||c.data.state!=='ACTIVE')return false;
            try{return JSON.parse(String(c.data.creativeJson??'{}')).mediaAssetId===id;}
            catch{return false;}
          });
        }
        if(!activeAdImage)throw Error('FORBIDDEN_MEDIA_ACCESS');
      }
    }
    return row;
  }
  async bytes(groupId:string,id:string){
    const row=await this.record(groupId,id);
    const object=await this.store.get(String(row.data.artifactKey??''));
    if(!object?.arrayBuffer)throw Error('MEDIA_BYTES_UNAVAILABLE');
    return{bytes:await object.arrayBuffer(),mime:String(row.data.contentType??'image/png')};
  }
  async presentation(groupId:string){
    await this.access(groupId);
    const ctx=this.kernel.context.get(),output:Record<string,string>={};
    const records=await this.repo.listWorkspaceRecords(ctx.tenantId,SLOT_MODULE,groupId);
    const byId=new Map(records.map(row=>[row.id,row]));
    for(const slot of VISUAL_SLOTS){
      const row=byId.get(keyFor(groupId,slot,ctx.actorId));
      if(row?.groupId===groupId&&row.moduleId===SLOT_MODULE&&row.status==='ACTIVE'&&typeof row.data.assetId==='string'&&row.data.assetId)output[slot]=row.data.assetId;
    }
    return output;
  }
  /** Marketplace image projection only; never changes stock quantity, price or publication. */
  async stockVisuals(groupId:string):Promise<Record<string,string>>{
    await this.access(groupId);
    const ctx=this.kernel.context.get();
    const group=await this.repo.getGroup(ctx.tenantId,groupId);
    const membership=(await this.repo.listMemberships(ctx.tenantId,groupId)).find(m=>m.userId===ctx.actorId&&m.status==='active');
    const isManager=group?.createdBy===ctx.actorId||Boolean(membership?.roles.some(r=>managers.has(r)));
    const [stocks,rows]=await Promise.all([
      this.repo.listWorkspaceRecords(ctx.tenantId,'MARKETPLACE.CORE',groupId),
      this.repo.listWorkspaceRecords(ctx.tenantId,SLOT_MODULE,groupId)
    ]);
    const allowed=new Set(stocks.filter(x=>x.data.marketKind==='STOCK_ITEM'&&(isManager||x.data.published===true)&&
      (isManager||x.data.ownership!=='POT_RESERVED')).map(x=>x.id));
    const result:Record<string,string>={};
    for(const row of rows){
      if(row.status!=='ACTIVE'||row.moduleId!==SLOT_MODULE||row.groupId!==groupId||row.data.slot!=='MARKET_PRODUCT')continue;
      const itemId=String(row.data.subjectId??'');
      if(!allowed.has(itemId)||row.id!==stockVisualKey(groupId,itemId))continue;
      const assetId=String(row.data.assetId??'');
      if(assetId)result[itemId]=assetId;
    }
    return result;
  }
  async assignStockVisual(groupId:string,stockId:string,assetId:string){
    await this.access(groupId,true);
    const ctx=this.kernel.context.get(),stock=await this.repo.getWorkspaceRecord(ctx.tenantId,stockId);
    if(!stock||stock.groupId!==groupId||stock.moduleId!=='MARKETPLACE.CORE'||stock.data.marketKind!=='STOCK_ITEM')throw Error('STOCK_ITEM_NOT_FOUND');
    if(assetId){
      const photo=await this.record(groupId,assetId,true);
      if(photo.data.purpose!=='MARKET_PRODUCT')throw Error('MEDIA_PURPOSE_MISMATCH');
    }
    const id=stockVisualKey(groupId,stockId),previous=await this.repo.getWorkspaceRecord(ctx.tenantId,id),stamp=new Date().toISOString();
    const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:SLOT_MODULE,title:'MARKET_PRODUCT',
      status:'ACTIVE',tags:['media-slot','market-product'],data:{assetId,slot:'MARKET_PRODUCT',subjectId:stockId},
      createdBy:previous?.createdBy??ctx.actorId,createdAt:previous?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,
      action:'MARKET_PRODUCT_VISUAL_UPDATED',targetType:'media_slot',targetId:id,requestId:ctx.requestId,
      metadata:{groupId,stockId,assetId:assetId||null}}));
    return{stockId,assetId};
  }
  async assign(groupId:string,slot:string,assetId:string){
    if(!isValidSlot(slot))throw Error('MEDIA_INVALID_PURPOSE');
    await this.access(groupId,!['PROFILE_PHOTO','PARTNER_CREATIVE'].includes(slot));
    const ctx=this.kernel.context.get();
    if(assetId){
      const row=await this.record(groupId,assetId,slot!=='PROFILE_PHOTO');
      if(['PROFILE_PHOTO','PARTNER_CREATIVE'].includes(slot)&&row.createdBy!==ctx.actorId)throw Error('FORBIDDEN_MEDIA_OWNER');
      if(String(row.data.purpose)!==slot)throw Error('MEDIA_PURPOSE_MISMATCH');
    }
    const id=keyFor(groupId,slot,ctx.actorId),previous=await this.repo.getWorkspaceRecord(ctx.tenantId,id),stamp=new Date().toISOString();
    const record:WorkspaceRecord={id,tenantId:ctx.tenantId,groupId,moduleId:SLOT_MODULE,title:slot,status:'ACTIVE',tags:['media-slot',slot],data:{assetId,slot,actorId:['PROFILE_PHOTO','PARTNER_CREATIVE'].includes(slot)?ctx.actorId:''},createdBy:previous?.createdBy??ctx.actorId,createdAt:previous?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,action:'VISUAL_MEDIA_SLOT_UPDATED',targetType:'media_slot',targetId:id,requestId:ctx.requestId,metadata:{groupId,slot,assetId:assetId||null}}));
    return{slot,assetId};
  }
}
