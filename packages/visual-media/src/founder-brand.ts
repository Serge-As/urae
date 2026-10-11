import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {ArtifactStoreLike} from '../../imports/src/store.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';
import {sniffVisualMime,assertVisualSize} from './index.js';

export const BRAND_SLOTS=['HOME_HERO','MARKET_HERO','FORUM_HERO','BRAND_LOGO'] as const;
export type BrandSlot=typeof BRAND_SLOTS[number];
const ROOT='platform',ASSET='MEDIA.BRAND_ASSET',SLOT='MEDIA.BRAND_SLOT';
const valid=(slot:string):slot is BrandSlot=>(BRAND_SLOTS as readonly string[]).includes(slot);
const slotKey=(slot:BrandSlot)=>'platform_brand_'+slot;
/**
 * Founder-only writes; authorized group members read just selected brand art.
 * Separate platform namespace prevents a group's image overriding other groups.
 */
export class FounderBrandMediaService{
  constructor(readonly repo:PlatformRepository,readonly kernel:PlatformKernel,readonly store:ArtifactStoreLike){}
  async list(){
    const [photos,slots]=await Promise.all([
      this.repo.listWorkspaceRecords(ROOT,ASSET),this.selected()]);
    return{assets:photos.filter(x=>x.status==='ACTIVE').map(x=>({id:x.id,name:x.title,
      contentType:String(x.data.contentType??''),size:Number(x.data.size??0),createdAt:x.createdAt})),slots};
  }
  async selected(){
    const records=await this.repo.listWorkspaceRecords(ROOT,SLOT),output:Record<string,string>={};
    for(const row of records){
      const slot=String(row.data.slot??'');
      if(!valid(slot)||row.id!==slotKey(slot)||row.status!=='ACTIVE')continue;
      const id=String(row.data.assetId??'');if(id)output[slot]=id;
    }
    return output;
  }
  async upload(file:File){
    assertVisualSize(file.size);
    const bytes=new Uint8Array(await file.arrayBuffer()),mime=sniffVisualMime(bytes);
    if(file.type&&file.type.toLowerCase()!==mime)throw Error('MEDIA_MIME_MISMATCH');
    const ctx=this.kernel.context.get(),id=makeId('brand_media'),stamp=new Date().toISOString();
    const artifactKey='imports/platform/brand/'+id;
    await this.store.put(artifactKey,bytes,{httpMetadata:{contentType:mime},customMetadata:{ownerId:ctx.actorId,purpose:'BRAND'}});
    const name=file.name.replace(/[<>\x00-\x1f]/g,'').slice(0,120)||'Visuel Eco-System';
    const row:WorkspaceRecord={id,tenantId:ROOT,moduleId:ASSET,title:name,status:'ACTIVE',tags:['platform-brand','private-until-selected'],
      data:{artifactKey,contentType:mime,size:bytes.length},createdBy:ctx.actorId,createdAt:stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(row);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,
      action:'FOUNDER_BRAND_ASSET_UPLOADED',targetType:'brand_asset',targetId:id,requestId:ctx.requestId,
      metadata:{mime,size:bytes.length}}));
    return{id,name,contentType:mime,size:bytes.length};
  }
  async assign(slot:string,assetId:string){
    if(!valid(slot))throw Error('INVALID_BRAND_SLOT');
    if(assetId){
      const asset=await this.repo.getWorkspaceRecord(ROOT,assetId);
      if(!asset||asset.moduleId!==ASSET||asset.status!=='ACTIVE')throw Error('BRAND_ASSET_NOT_FOUND');
    }
    const ctx=this.kernel.context.get(),id=slotKey(slot),previous=await this.repo.getWorkspaceRecord(ROOT,id),stamp=new Date().toISOString();
    const row:WorkspaceRecord={id,tenantId:ROOT,moduleId:SLOT,title:slot,status:'ACTIVE',tags:['platform-brand','slot:'+slot],
      data:{slot,assetId},createdBy:previous?.createdBy??ctx.actorId,
      createdAt:previous?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(row);
    await this.repo.saveAudit(this.kernel.audit.append({tenantId:ctx.tenantId,actorId:ctx.actorId,
      action:'FOUNDER_BRAND_SLOT_UPDATED',targetType:'brand_slot',targetId:id,requestId:ctx.requestId,
      metadata:{slot,assetId:assetId||null}}));
    return{slot,assetId};
  }
  async bytes(id:string,founder=false){
    const asset=await this.repo.getWorkspaceRecord(ROOT,id);
    if(!asset||asset.moduleId!==ASSET||asset.status!=='ACTIVE')throw Error('BRAND_ASSET_NOT_FOUND');
    if(!founder&&!Object.values(await this.selected()).includes(id))throw Error('BRAND_ASSET_NOT_PUBLIC');
    const body=await this.store.get(String(asset.data.artifactKey??''));
    if(!body?.arrayBuffer)throw Error('BRAND_BYTES_UNAVAILABLE');
    return{bytes:await body.arrayBuffer(),mime:String(asset.data.contentType??'image/png')};
  }
}
