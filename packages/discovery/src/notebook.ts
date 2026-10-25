import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export interface NotebookField {id?:string;kind:'SKILL'|'REALIZATION'|'NEED'|'AVAILABILITY';value:string;visibility:'PRIVATE'|'GROUP'|'CONTACT'|'PUBLIC';groupIds?:string[];contactIds?:string[];}
const moduleId='MEMBERSHIP.PORTFOLIO',clean=(v:unknown,n=1600)=>String(v??'').trim().slice(0,n);
async function actor(repo:PlatformRepository,kernel:PlatformKernel){const c=kernel.context.get();if(!await repo.getUser(c.actorId))throw Error('USER_NOT_FOUND');return c;}
async function member(repo:PlatformRepository,tenantId:string,groupId:string,actorId:string){const g=await repo.getGroup(tenantId,groupId);if(!g||g.status!=='active')return false;return g.createdBy===actorId||(await repo.listMemberships(tenantId,groupId)).some(m=>m.userId===actorId&&m.status==='active');}
const fields=(r?:WorkspaceRecord)=>JSON.parse(String(r?.data.fieldsJson??'[]')) as NotebookField[];
export const PUBLIC_NOTEBOOK_TENANT='__eco_public_candidate_projection__';
const hash=async(v:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function ownNotebook(repo:PlatformRepository,kernel:PlatformKernel){const c=await actor(repo,kernel),id='notebook_'+await hash([c.tenantId,c.actorId]);return{c,id,record:await repo.getWorkspaceRecord(c.tenantId,id)??await repo.getWorkspaceRecord(c.tenantId,'notebook_'+encodeURIComponent(c.actorId))};}
export async function saveNotebook(repo:PlatformRepository,kernel:PlatformKernel,input:{expectedVersion:number;fields:NotebookField[];publicConsent?:boolean;publicAlias?:string;publicPaused?:boolean}){
 const own=await ownNotebook(repo,kernel),c=own.c,old=own.record,id=old?.id??own.id,version=Number(old?.data.version??0);
 if(version!==input.expectedVersion)throw Error('NOTEBOOK_VERSION_CONFLICT');if(!Array.isArray(input.fields)||input.fields.length>40)throw Error('NOTEBOOK_FIELD_LIMIT');
 const normalized:NotebookField[]=[],ids=new Set<string>();
  for(const field of input.fields){if(!['SKILL','REALIZATION','NEED','AVAILABILITY'].includes(field.kind)||!['PRIVATE','GROUP','CONTACT','PUBLIC'].includes(field.visibility))throw Error('INVALID_NOTEBOOK_FIELD');const value=clean(field.value);if(!value)throw Error('NOTEBOOK_VALUE_REQUIRED');const fieldId=clean(field.id,180)||makeId('field');if(ids.has(fieldId))throw Error('NOTEBOOK_DUPLICATE_FIELD');ids.add(fieldId);
  if(field.groupIds!==undefined&&(!Array.isArray(field.groupIds)||field.groupIds.length>10))throw Error('NOTEBOOK_AUDIENCE_LIMIT');
  const scoped=['GROUP','CONTACT'].includes(field.visibility),groupIds=scoped?[...new Set((field.groupIds??[]).map(x=>clean(x,180)))]:[];if(scoped&&!groupIds.length)throw Error('NOTEBOOK_AUDIENCE_REQUIRED');for(const g of groupIds)if(!await member(repo,c.tenantId,g,c.actorId))throw Error('FORBIDDEN_SCOPE');
  let contactIds:string[]=[];
  if(field.visibility==='CONTACT'){
   if(!Array.isArray(field.contactIds)||!field.contactIds.length||field.contactIds.length>10)throw Error('NOTEBOOK_CONTACTS_REQUIRED');
   contactIds=[...new Set(field.contactIds.map(x=>clean(x,180)))];
   for(const id of contactIds){if(!id||id===c.actorId||!await repo.getUser(id))throw Error('NOTEBOOK_CONTACT_UNAVAILABLE');let shared=false;for(const g of groupIds)if(await member(repo,c.tenantId,g,id)){shared=true;break;}if(!shared)throw Error('NOTEBOOK_CONTACT_UNAVAILABLE');}
  }
  normalized.push({id:fieldId,kind:field.kind,value,visibility:field.visibility,groupIds,...(contactIds.length?{contactIds}:{})});
 }
 const hasPublic=normalized.some(f=>f.visibility==='PUBLIC'),publicAlias=clean(input.publicAlias,120),publicOptIn=hasPublic&&input.publicPaused!==true;
 if(hasPublic&&(input.publicConsent!==true||!publicAlias))throw Error('NOTEBOOK_PUBLIC_CONSENT_REQUIRED');
 const at=new Date().toISOString(),publicId=String(old?.data.publicId??('public_notebook_'+await hash([c.tenantId,c.actorId]))),r:WorkspaceRecord={id,tenantId:c.tenantId,moduleId,title:'Carnet personnel',status:'ACTIVE',tags:['discovery-notebook','governed-productive','private'],data:{kind:'DISCOVERY_NOTEBOOK',version:version+1,fieldsJson:JSON.stringify(normalized),publicOptIn,publicId,publicAlias,publicPaused:input.publicPaused===true},createdBy:c.actorId,createdAt:old?.createdAt??at,updatedAt:at};
 // A discovery pointer contains no published content. A failed source CAS leaves
 // only an inert pointer; every public read revalidates the canonical notebook.
 if(hasPublic)await repo.insertGovernedRecord({id:publicId,tenantId:PUBLIC_NOTEBOOK_TENANT,moduleId,title:'Public notebook pointer',status:'ACTIVE',tags:['governed-productive','public-notebook-pointer'],data:{kind:'DISCOVERY_NOTEBOOK_POINTER',sourceTenant:c.tenantId,sourceId:id},createdBy:c.actorId,createdAt:at,updatedAt:at});
 if(version===0){const inserted=await repo.insertGovernedRecord(r);if(!inserted.inserted)throw Error('NOTEBOOK_VERSION_CONFLICT');}else await repo.commitWorkspaceRecordRevision(r,version);return notebook(repo,kernel);
}
export async function notebook(repo:PlatformRepository,kernel:PlatformKernel){const {record:r}=await ownNotebook(repo,kernel);return{version:Number(r?.data.version??0),fields:fields(r),publicFields:r?.data.publicOptIn===true?fields(r).filter(f=>f.visibility==='PUBLIC').map(projection):[],publicOptIn:r?.data.publicOptIn===true,publicAlias:String(r?.data.publicAlias??''),publicPaused:r?.data.publicPaused===true,publicId:r?.data.publicId??null};}
const projection=(f:NotebookField)=>({id:f.id,kind:f.kind,value:f.value,visibility:f.visibility});
const visibleFields=(r:WorkspaceRecord,groupId:string,actorId:string)=>fields(r).filter(f=>f.groupIds?.includes(groupId)&&(f.visibility==='GROUP'||f.visibility==='CONTACT'&&f.contactIds?.includes(actorId))).map(projection);
export async function notebookPreview(repo:PlatformRepository,kernel:PlatformKernel,input:{audience:'PRIVATE'|'GROUP'|'CONTACT'|'PUBLIC';groupId?:string;contactId?:string}){
 const c=await actor(repo,kernel),self=await notebook(repo,kernel);if(input.audience==='PRIVATE')return{audience:'PRIVATE',fields:[],contactShared:false};
  if(input.audience==='PUBLIC')return{audience:'PUBLIC',...(self.publicOptIn&&self.publicId?await publicNotebook(repo,String(self.publicId)):{fields:[],displayAlias:'',available:false}),contactShared:false};
 if(!['GROUP','CONTACT'].includes(input.audience)||!input.groupId||!await member(repo,c.tenantId,input.groupId,c.actorId))throw Error('FORBIDDEN_SCOPE');
 if(input.audience==='CONTACT'&&(!input.contactId||!await member(repo,c.tenantId,input.groupId,input.contactId)))throw Error('NOTEBOOK_CONTACT_UNAVAILABLE');
 return{audience:input.audience,groupId:input.groupId,fields:self.fields.filter(f=>f.groupIds?.includes(input.groupId!)&&(f.visibility==='GROUP'||input.audience==='CONTACT'&&f.visibility==='CONTACT'&&f.contactIds?.includes(input.contactId!))).map(projection),contactShared:false};
}

export async function publicNotebook(repo:PlatformRepository,id:string){
 if(!/^public_notebook_[a-f0-9]{64}$/.test(id))throw Error('PUBLIC_NOTEBOOK_NOT_FOUND');
 const pointer=await repo.getWorkspaceRecord(PUBLIC_NOTEBOOK_TENANT,id);if(!pointer||pointer.moduleId!==moduleId||pointer.data.kind!=='DISCOVERY_NOTEBOOK_POINTER')throw Error('PUBLIC_NOTEBOOK_NOT_FOUND');
 const r=await repo.getWorkspaceRecord(String(pointer.data.sourceTenant),String(pointer.data.sourceId));
 if(!r||r.moduleId!==moduleId||r.data.kind!=='DISCOVERY_NOTEBOOK'||r.status!=='ACTIVE'||r.createdBy!==pointer.createdBy||r.data.publicId!==id||r.data.publicOptIn!==true)throw Error('PUBLIC_NOTEBOOK_NOT_FOUND');
 const visible=fields(r).filter(f=>f.visibility==='PUBLIC').map(f=>({...projection(f),verification:'SELF_DECLARED'}));if(!visible.length)throw Error('PUBLIC_NOTEBOOK_NOT_FOUND');
 return{id,displayAlias:String(r.data.publicAlias),fields:visible,checkedAt:r.updatedAt,verification:'SELF_DECLARED',contactShared:false,financialDataShared:false};
}

export async function searchPublicNotebooks(repo:PlatformRepository,query:string){
 const q=clean(query,160).toLocaleLowerCase();if(q.length<2)throw Error('DISCOVERY_QUERY_REQUIRED');
 const pointers=(await repo.listWorkspaceRecords(PUBLIC_NOTEBOOK_TENANT,moduleId)).filter(r=>r.data.kind==='DISCOVERY_NOTEBOOK_POINTER'),items=[];
 for(const p of pointers.slice(-50)){try{const current=await publicNotebook(repo,p.id);if([current.displayAlias,...current.fields.map(f=>f.value)].join(' ').toLocaleLowerCase().includes(q))items.push(current);}catch{}if(items.length>=20)break;}
 return{items,limit:20,searchedPointers:Math.min(pointers.length,50),boundedDirectory:true,publicSearch:true};
}
export async function receivedNotebooks(repo:PlatformRepository,kernel:PlatformKernel,groupId:string){
 const c=await actor(repo,kernel);if(!await member(repo,c.tenantId,groupId,c.actorId))throw Error('FORBIDDEN_SCOPE');
 const rows=(await repo.listWorkspaceRecords(c.tenantId,moduleId)).filter(r=>r.data.kind==='DISCOVERY_NOTEBOOK'&&r.createdBy!==c.actorId&&fields(r).some(f=>f.visibility==='CONTACT'&&f.groupIds?.includes(groupId)&&f.contactIds?.includes(c.actorId))),items=[];
 for(const r of rows){if(!await member(repo,c.tenantId,groupId,r.createdBy))continue;const user=await repo.getUser(r.createdBy);items.push({ownerId:r.createdBy,displayAlias:user?.displayName??r.createdBy,fields:visibleFields(r,groupId,c.actorId),contactShared:false});if(items.length>=20)break;}
 return{items,limit:20,checkedAt:new Date().toISOString(),publicSearch:false};
}
export async function searchNotebooks(repo:PlatformRepository,kernel:PlatformKernel,groupId:string,query:string){
 const c=await actor(repo,kernel);if(!await member(repo,c.tenantId,groupId,c.actorId))throw Error('FORBIDDEN_SCOPE');const q=clean(query,160).toLocaleLowerCase();if(q.length<2)throw Error('DISCOVERY_QUERY_REQUIRED');
 const rows=(await repo.listWorkspaceRecords(c.tenantId,moduleId)).filter(r=>r.data.kind==='DISCOVERY_NOTEBOOK'&&r.tags.includes('discovery-notebook')),out=[];
 for(const r of rows){if(!await member(repo,c.tenantId,groupId,r.createdBy))continue;const matches=visibleFields(r,groupId,c.actorId).filter(f=>f.value.toLocaleLowerCase().includes(q));if(!matches.length)continue;const user=await repo.getUser(r.createdBy);out.push({ownerId:r.createdBy,displayAlias:user?.displayName??r.createdBy,fields:matches,reasons:matches.map(f=>({fieldId:f.id,kind:f.kind,reason:f.visibility==='CONTACT'?'EXPLICIT_CONTACT_FIELD_MATCH':'EXPLICIT_GROUP_FIELD_MATCH'})),contactShared:false,financialDataShared:false});if(out.length>=20)break;}
 return{items:out,limit:20,publicSearch:false};
}
