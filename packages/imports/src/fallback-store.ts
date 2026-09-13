import type {WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {ArtifactObjectLike,ArtifactStoreLike} from './store.js';

const MAX_D1_ARTIFACT_BYTES=512_000;
const parseKey=(key:string)=>{
  const parts=key.split('/');if(parts.length<4||parts[0]!=='imports')throw new Error('INVALID_ARTIFACT_KEY');
  return{tenantId:parts[1]!,groupId:parts[2]!};
};
const idFor=(key:string)=>'artifact_'+encodeURIComponent(key);

export class RepositoryArtifactStore implements ArtifactStoreLike{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  async put(key:string,value:string|ArrayBuffer|Uint8Array,options?:{httpMetadata?:{contentType?:string};customMetadata?:Record<string,string>}):Promise<void>{
    if(typeof value!=='string')throw new Error('D1_FALLBACK_TEXT_ONLY');
    const bytes=new TextEncoder().encode(value).byteLength;if(bytes>MAX_D1_ARTIFACT_BYTES)throw new Error('R2_REQUIRED_FOR_LARGE_ARTIFACT');
    const scope=parseKey(key),ctx=this.kernel.context.get();
    if(ctx.tenantId!==scope.tenantId)throw new Error('FORBIDDEN_SCOPE');
    const group=await this.repo.getGroup(scope.tenantId,scope.groupId);if(!group)throw new Error('GROUP_NOT_FOUND');
    const id=idFor(key),previous=await this.repo.getWorkspaceRecord(scope.tenantId,id),stamp=new Date().toISOString();
    const record:WorkspaceRecord={id,tenantId:scope.tenantId,groupId:scope.groupId,moduleId:'PAPER.IMPORT',title:'Private import artifact',
      status:'ACTIVE',tags:['private-artifact','d1-fallback'],data:{artifactKey:key,content:value,contentType:options?.httpMetadata?.contentType??'text/plain',
        size:bytes,storageMode:'D1_FALLBACK'},createdBy:previous?.createdBy??ctx.actorId,createdAt:previous?.createdAt??stamp,updatedAt:stamp};
    await this.repo.saveWorkspaceRecord(record);
  }
  async get(key:string):Promise<ArtifactObjectLike|null>{
    const scope=parseKey(key),ctx=this.kernel.context.get();if(ctx.tenantId!==scope.tenantId)throw new Error('FORBIDDEN_SCOPE');
    const record=await this.repo.getWorkspaceRecord(scope.tenantId,idFor(key));if(!record||record.groupId!==scope.groupId||!record.tags.includes('private-artifact'))return null;
    const content=String(record.data.content??'');
    return{text:async()=>content,arrayBuffer:async()=>new TextEncoder().encode(content).buffer as ArrayBuffer,size:Number(record.data.size??0)};
  }
}
