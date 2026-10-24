import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';
import type {WorkspaceRecord} from '../../contracts/src/index.js';
import {makeId} from '../../contracts/src/index.js';

export interface NotebookField {id?:string;kind:'SKILL'|'REALIZATION'|'NEED'|'AVAILABILITY';value:string;visibility:'PRIVATE'|'GROUP'|'CONTACT';groupIds?:string[];contactIds?:string[];}
const moduleId='MEMBERSHIP.PORTFOLIO',clean=(v:unknown,n=1600)=>String(v??'').trim().slice(0,n);
async function actor(repo:PlatformRepository,kernel:PlatformKernel){const c=kernel.context.get();if(!await repo.getUser(c.actorId))throw Error('USER_NOT_FOUND');return c;}
async function member(repo:PlatformRepository,tenantId:string,groupId:string,actorId:string){const g=await repo.getGroup(tenantId,groupId);if(!g||g.status!=='active')return false;return g.createdBy===actorId||(await repo.listMemberships(tenantId,groupId)).some(m=>m.userId===actorId&&m.status==='active');}
const fields=(r?:WorkspaceRecord)=>JSON.parse(String(r?.data.fieldsJson??'[]')) as NotebookField[];
export async function saveNotebook(repo:PlatformRepository,kernel:PlatformKernel,input:{expectedVersion:number;fields:NotebookField[]}){
 const c=await actor(repo,kernel),id='notebook_'+encodeURIComponent(c.actorId),old=await repo.getWorkspaceRecord(c.tenantId,id),version=Number(old?.data.version??0);
 if(version!==input.expectedVersion)throw Error('NOTEBOOK_VERSION_CONFLICT');if(!Array.isArray(input.fields)||input.fields.length>40)throw Error('NOTEBOOK_FIELD_LIMIT');
 const normalized:NotebookField[]=[],ids=new Set<string>();
 for(const field of input.fields){if(!['SKILL','REALIZATION','NEED','AVAILABILITY'].includes(field.kind)||!['PRIVATE','GROUP','CONTACT'].includes(field.visibility))throw Error('INVALID_NOTEBOOK_FIELD');const value=clean(field.value);if(!value)throw Error('NOTEBOOK_VALUE_REQUIRED');const fieldId=clean(field.id,180)||makeId('field');if(ids.has(fieldId))throw Error('NOTEBOOK_DUPLICATE_FIELD');ids.add(fieldId);
  if(field.groupIds!==undefined&&(!Array.isArray(field.groupIds)||field.groupIds.length>10))throw Error('NOTEBOOK_AUDIENCE_LIMIT');
  const groupIds=field.visibility!=='PRIVATE'?[...new Set((field.groupIds??[]).map(x=>clean(x,180)))]:[];if(field.visibility!=='PRIVATE'&&!groupIds.length)throw Error('NOTEBOOK_AUDIENCE_REQUIRED');for(const g of groupIds)if(!await member(repo,c.tenantId,g,c.actorId))throw Error('FORBIDDEN_SCOPE');
  let contactIds:string[]=[];
  if(field.visibility==='CONTACT'){
   if(!Array.isArray(field.contactIds)||!field.contactIds.length||field.contactIds.length>10)throw Error('NOTEBOOK_CONTACTS_REQUIRED');
   contactIds=[...new Set(field.contactIds.map(x=>clean(x,180)))];
   for(const id of contactIds){if(!id||id===c.actorId||!await repo.getUser(id))throw Error('NOTEBOOK_CONTACT_UNAVAILABLE');let shared=false;for(const g of groupIds)if(await member(repo,c.tenantId,g,id)){shared=true;break;}if(!shared)throw Error('NOTEBOOK_CONTACT_UNAVAILABLE');}
  }
  normalized.push({id:fieldId,kind:field.kind,value,visibility:field.visibility,groupIds,...(contactIds.length?{contactIds}:{})});
 }
 const at=new Date().toISOString(),r:WorkspaceRecord={id,tenantId:c.tenantId,moduleId,title:'Carnet personnel',status:'ACTIVE',tags:['discovery-notebook','governed-productive','private'],data:{kind:'DISCOVERY_NOTEBOOK',version:version+1,fieldsJson:JSON.stringify(normalized),publicOptIn:false},createdBy:c.actorId,createdAt:old?.createdAt??at,updatedAt:at};
 if(version===0){const inserted=await repo.insertGovernedRecord(r);if(!inserted.inserted)throw Error('NOTEBOOK_VERSION_CONFLICT');}else await repo.commitWorkspaceRecordRevision(r,version);return notebook(repo,kernel);
}
export async function notebook(repo:PlatformRepository,kernel:PlatformKernel){const c=await actor(repo,kernel),r=await repo.getWorkspaceRecord(c.tenantId,'notebook_'+encodeURIComponent(c.actorId));return{version:Number(r?.data.version??0),fields:fields(r),publicFields:[],publicOptIn:false};}
const projection=(f:NotebookField)=>({id:f.id,kind:f.kind,value:f.value,visibility:f.visibility});
const visibleFields=(r:WorkspaceRecord,groupId:string,actorId:string)=>fields(r).filter(f=>f.groupIds?.includes(groupId)&&(f.visibility==='GROUP'||f.visibility==='CONTACT'&&f.contactIds?.includes(actorId))).map(projection);
export async function notebookPreview(repo:PlatformRepository,kernel:PlatformKernel,input:{audience:'PRIVATE'|'GROUP'|'CONTACT';groupId?:string;contactId?:string}){
 const c=await actor(repo,kernel),self=await notebook(repo,kernel);if(input.audience==='PRIVATE')return{audience:'PRIVATE',fields:[],contactShared:false};
 if(!['GROUP','CONTACT'].includes(input.audience)||!input.groupId||!await member(repo,c.tenantId,input.groupId,c.actorId))throw Error('FORBIDDEN_SCOPE');
 if(input.audience==='CONTACT'&&(!input.contactId||!await member(repo,c.tenantId,input.groupId,input.contactId)))throw Error('NOTEBOOK_CONTACT_UNAVAILABLE');
 return{audience:input.audience,groupId:input.groupId,fields:self.fields.filter(f=>f.groupIds?.includes(input.groupId!)&&(f.visibility==='GROUP'||input.audience==='CONTACT'&&f.visibility==='CONTACT'&&f.contactIds?.includes(input.contactId!))).map(projection),contactShared:false};
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
