import type {Id,PublicGroupListing,WorkspaceRecord} from '../../contracts/src/index.js';
import type {PlatformRepository} from '../../repositories/src/index.js';
import type {PlatformKernel} from '../../platform-kernel/src/index.js';

const PUBLIC_CANDIDATE_TENANT='__eco_public_candidate_projection__';
const clean=(v:unknown,n=240)=>String(v??'').trim().slice(0,n);
const jsonArray=(v:unknown)=>{try{const x=JSON.parse(String(v??'[]'));return Array.isArray(x)?x.map(String).filter(Boolean):[];}catch{return[];}};
const nodeId=(kind:string,id:string)=>kind.toLowerCase()+':'+id;
export type OpportunityNodeKind='PERSON'|'SKILL'|'GROUP'|'NEED'|'OFFER'|'COURSE'|'LOCALITY'|'CATEGORY';
export interface OpportunityNode{id:string;kind:OpportunityNodeKind;label:string;visibility:'PRIVATE'|'MEMBER'|'PUBLIC';ref?:string;meta?:Record<string,string|number|boolean|null>;}
export interface OpportunityEdge{id:string;from:string;to:string;relation:string;visibility:'PRIVATE'|'MEMBER'|'PUBLIC';reasonCodes:string[];}
export interface OpportunityGraphProjection{nodes:OpportunityNode[];edges:OpportunityEdge[];generatedAt:string;persisted:false;secondSourceOfTruth:false;privacyFiltered:true;}

export class OpportunityGraphService{
  constructor(public repo:PlatformRepository,public kernel:PlatformKernel){}
  private ctx(){return this.kernel.context.get();}
  private addNode(map:Map<string,OpportunityNode>,node:OpportunityNode){if(!map.has(node.id))map.set(node.id,node);}
  private addEdge(map:Map<string,OpportunityEdge>,from:string,to:string,relation:string,visibility:OpportunityEdge['visibility'],reasonCodes:string[]=[]){const id=[from,relation,to].join('|');if(!map.has(id))map.set(id,{id,from,to,relation,visibility,reasonCodes});}
  async projection():Promise<OpportunityGraphProjection>{
    const c=this.ctx(),nodes=new Map<string,OpportunityNode>(),edges=new Map<string,OpportunityEdge>(),self=nodeId('PERSON',c.actorId);
    this.addNode(nodes,{id:self,kind:'PERSON',label:'Moi',visibility:'PRIVATE',ref:c.actorId});
    const myGroups:Array<{id:Id;name:string}>=[],memberGroupIds=new Set<string>();
    for(const g of await this.repo.listGroups(c.tenantId)){
      const membership=(await this.repo.listMemberships(c.tenantId,g.id)).find(x=>x.userId===c.actorId&&x.status==='active');
      if(!membership)continue;memberGroupIds.add(g.id);myGroups.push({id:g.id,name:g.name});
      const gid=nodeId('GROUP',g.id);this.addNode(nodes,{id:gid,kind:'GROUP',label:g.name,visibility:'MEMBER',ref:g.id,meta:{family:g.kind}});
      this.addEdge(edges,self,gid,'MEMBER_OF','PRIVATE',['ACTIVE_MEMBERSHIP']);
    }
    const publicListings=await this.repo.listPublicGroupListings();
    for(const l of publicListings.filter(x=>x.visibility==='PUBLIC'&&x.discoverable)){
      const gid=nodeId('GROUP',l.groupId);this.addNode(nodes,{id:gid,kind:'GROUP',label:l.name,visibility:'PUBLIC',ref:l.groupId,meta:{family:l.family,locality:l.locality??'',recruiting:l.recruiting}});
      if(l.locality){const lid=nodeId('LOCALITY',l.locality.toLowerCase());this.addNode(nodes,{id:lid,kind:'LOCALITY',label:l.locality,visibility:'PUBLIC'});this.addEdge(edges,gid,lid,'LOCATED_IN','PUBLIC',['DECLARED_LOCALITY']);}
    }
    const profile=(await this.repo.listWorkspaceRecords(c.tenantId,'MANAGER.VALUE_DISCOVERY')).find(x=>x.createdBy===c.actorId&&x.data.profileOwnerId===c.actorId);
    for(const skill of jsonArray(profile?.data.skillsJson)){const sid=nodeId('SKILL',skill.toLowerCase());this.addNode(nodes,{id:sid,kind:'SKILL',label:skill,visibility:'PRIVATE'});this.addEdge(edges,self,sid,'HAS_SKILL','PRIVATE',['SELF_DECLARED']);}
    if(profile?.data.locality){const locality=String(profile.data.locality),lid=nodeId('LOCALITY',locality.toLowerCase());this.addNode(nodes,{id:lid,kind:'LOCALITY',label:locality,visibility:'PRIVATE'});this.addEdge(edges,self,lid,'AVAILABLE_IN','PRIVATE',['SELF_DECLARED']);}

    for(const row of await this.repo.listWorkspaceRecords(PUBLIC_CANDIDATE_TENANT,'MEMBERSHIP.PORTFOLIO')){
      if(row.status!=='ACTIVE'||row.data.optIn!==true)continue;const pid=nodeId('PERSON',row.id),alias=clean(row.data.displayAlias)||'Profil';
      this.addNode(nodes,{id:pid,kind:'PERSON',label:alias,visibility:'PUBLIC',ref:row.id,meta:{contactShared:false}});
      for(const skill of jsonArray(row.data.skills)){const sid=nodeId('SKILL',skill.toLowerCase());this.addNode(nodes,{id:sid,kind:'SKILL',label:skill,visibility:'PUBLIC'});this.addEdge(edges,pid,sid,'HAS_SKILL','PUBLIC',['OPT_IN_PUBLIC_PROFILE']);}
      if(row.data.locality){const locality=String(row.data.locality),lid=nodeId('LOCALITY',locality.toLowerCase());this.addNode(nodes,{id:lid,kind:'LOCALITY',label:locality,visibility:'PUBLIC'});this.addEdge(edges,pid,lid,'AVAILABLE_IN','PUBLIC',['OPT_IN_PUBLIC_PROFILE']);}
    }

    const tenantRecords=await this.repo.listWorkspaceRecords(c.tenantId);
    for(const need of tenantRecords.filter(x=>x.moduleId==='OPPORTUNITY.NEED'&&x.data.state==='PUBLISHED'&&x.data.publicationConsent===true)){
      if(!need.groupId)continue;const visibility=memberGroupIds.has(need.groupId)?'MEMBER':'PUBLIC',nid=nodeId('NEED',need.id),gid=nodeId('GROUP',need.groupId);
      this.addNode(nodes,{id:nid,kind:'NEED',label:need.title,visibility,ref:need.id,meta:{category:String(need.data.category??''),locality:String(need.data.locality??''),quantity:Number(need.data.quantity??0),unit:String(need.data.unit??'')}});
      this.addEdge(edges,gid,nid,'HAS_NEED',visibility,['PUBLISHED','PUBLICATION_CONSENT']);
      const category=clean(need.data.category);if(category){const cid=nodeId('CATEGORY',category.toLowerCase());this.addNode(nodes,{id:cid,kind:'CATEGORY',label:category,visibility:'PUBLIC'});this.addEdge(edges,nid,cid,'IN_CATEGORY',visibility,['DECLARED_CATEGORY']);}
    }
    for(const offer of tenantRecords.filter(x=>x.moduleId==='OPPORTUNITY.OFFER'&&x.status==='ACTIVE'&&x.data.state==='ACTIVE')){
      const oid=nodeId('OFFER',offer.id);this.addNode(nodes,{id:oid,kind:'OFFER',label:offer.title,visibility:'PUBLIC',ref:offer.id,meta:{category:String(offer.data.category??''),locality:String(offer.data.locality??''),availableQuantity:Number(offer.data.availableQuantity??0),unit:String(offer.data.unit??'')}});
      const category=clean(offer.data.category);if(category){const cid=nodeId('CATEGORY',category.toLowerCase());this.addNode(nodes,{id:cid,kind:'CATEGORY',label:category,visibility:'PUBLIC'});this.addEdge(edges,oid,cid,'IN_CATEGORY','PUBLIC',['DECLARED_CATEGORY']);}
      const locality=clean(offer.data.locality);if(locality){const lid=nodeId('LOCALITY',locality.toLowerCase());this.addNode(nodes,{id:lid,kind:'LOCALITY',label:locality,visibility:'PUBLIC'});this.addEdge(edges,oid,lid,'AVAILABLE_IN','PUBLIC',['DECLARED_LOCALITY']);}
    }
    for(const course of tenantRecords.filter(x=>x.moduleId==='LEARNING.MANAGER_ACADEMY'&&x.data.kind==='COURSE'&&x.status==='ACTIVE')){
      const cid=nodeId('COURSE',course.id);this.addNode(nodes,{id:cid,kind:'COURSE',label:course.title,visibility:'MEMBER',ref:course.id,meta:{audience:String(course.data.audience??'')}});
      const text=(course.title+' '+String(course.data.description??'')).toLowerCase();
      for(const n of nodes.values())if(n.kind==='SKILL'&&text.includes(n.label.toLowerCase()))this.addEdge(edges,cid,n.id,'BUILDS_SKILL','MEMBER',['COURSE_TEXT_MATCH']);
    }
    for(const need of [...nodes.values()].filter(x=>x.kind==='NEED')){
      const category=String(need.meta?.category??'').toLowerCase();if(!category)continue;
      for(const offer of [...nodes.values()].filter(x=>x.kind==='OFFER'&&String(x.meta?.category??'').toLowerCase()===category))this.addEdge(edges,need.id,offer.id,'CATEGORY_COMPATIBLE_WITH','PUBLIC',['CATEGORY_MATCH_ONLY','DETAILED_MATCH_REQUIRES_VALUE_NETWORK']);
      for(const skill of [...nodes.values()].filter(x=>x.kind==='SKILL'&&category.includes(x.label.toLowerCase())))this.addEdge(edges,skill.id,need.id,'MAY_HELP_WITH','PRIVATE',['TEXTUAL_CATEGORY_HINT','ADVISORY_ONLY']);
    }
    return{nodes:[...nodes.values()],edges:[...edges.values()],generatedAt:new Date().toISOString(),persisted:false,secondSourceOfTruth:false,privacyFiltered:true};
  }
}
