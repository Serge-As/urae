import type {D1DatabaseLike} from '../../repositories/src/index.js';

export type InterestCommunityVisibility='PUBLIC'|'PRIVATE';
export type InterestJoinPolicy='OPEN'|'REQUEST';
export type InterestContentKind='POST'|'EVENT'|'PLACE'|'OFFER'|'REQUEST';

export interface InterestCommunity {
  id:string;name:string;description?:string;locality?:string;visibility:InterestCommunityVisibility;joinPolicy:InterestJoinPolicy;
  tags:string[];creatorAccountId:string;createdAt:string;updatedAt:string;memberCount:number;viewerRole?:'CREATOR'|'MODERATOR'|'MEMBER';viewerStatus?:string;
}
export interface InterestCommunityContent {
  id:string;communityId:string;authorAccountId:string;kind:InterestContentKind;title?:string;body:string;category?:string;locality?:string;
  startsAt?:string;endsAt?:string;metadata:Record<string,unknown>;moderationState:'PUBLISHED'|'HIDDEN';createdAt:string;updatedAt:string;
}

const now=()=>new Date().toISOString();
const clean=(v:unknown,max=500)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,max);
const tags=(v:unknown)=>{
  const a=Array.isArray(v)?v:String(v??'').split(',');
  return [...new Set(a.map(x=>clean(x,50).toLowerCase()).filter(Boolean))].slice(0,30);
};
const parseJson=<T>(v:unknown,fallback:T):T=>{try{return JSON.parse(String(v??'')) as T;}catch{return fallback;}};
const toCommunity=(r:Record<string,unknown>):InterestCommunity=>({
  id:String(r.community_id),name:String(r.name),description:r.description?String(r.description):undefined,locality:r.locality?String(r.locality):undefined,
  visibility:String(r.visibility) as InterestCommunityVisibility,joinPolicy:String(r.join_policy) as InterestJoinPolicy,tags:parseJson(r.tags_json,[]),
  creatorAccountId:String(r.creator_account_id),createdAt:String(r.created_at),updatedAt:String(r.updated_at),memberCount:Number(r.member_count??0),
  viewerRole:r.viewer_role?String(r.viewer_role) as InterestCommunity['viewerRole']:undefined,viewerStatus:r.viewer_status?String(r.viewer_status):undefined
});
const toContent=(r:Record<string,unknown>):InterestCommunityContent=>({
  id:String(r.content_id),communityId:String(r.community_id),authorAccountId:String(r.author_account_id),kind:String(r.kind) as InterestContentKind,
  title:r.title?String(r.title):undefined,body:String(r.body),category:r.category?String(r.category):undefined,locality:r.locality?String(r.locality):undefined,
  startsAt:r.starts_at?String(r.starts_at):undefined,endsAt:r.ends_at?String(r.ends_at):undefined,metadata:parseJson(r.metadata_json,{}),
  moderationState:String(r.moderation_state) as 'PUBLISHED'|'HIDDEN',createdAt:String(r.created_at),updatedAt:String(r.updated_at)
});

export class InterestCommunityService{
  constructor(public db:D1DatabaseLike){}

  private async role(actorId:string,communityId:string){
    return this.db.prepare("SELECT role,status FROM interest_community_members WHERE community_id=? AND account_id=?").bind(communityId,actorId).first<Record<string,unknown>>();
  }
  private async communityRow(communityId:string){
    return this.db.prepare(`SELECT c.*,(SELECT COUNT(*) FROM interest_community_members m WHERE m.community_id=c.community_id AND m.status='ACTIVE') AS member_count FROM interest_communities c WHERE c.community_id=?`).bind(communityId).first<Record<string,unknown>>();
  }
  private async requireVisible(actorId:string,communityId:string){
    const row=await this.communityRow(communityId);if(!row||row.status!=='ACTIVE')throw Error('COMMUNITY_NOT_FOUND');
    const role=await this.role(actorId,communityId);
    if(row.visibility!=='PUBLIC'&&role?.status!=='ACTIVE')throw Error('COMMUNITY_ACCESS_REQUIRED');
    return{row,role};
  }
  private async requireMember(actorId:string,communityId:string){
    const row=await this.communityRow(communityId);if(!row||row.status!=='ACTIVE')throw Error('COMMUNITY_NOT_FOUND');
    const role=await this.role(actorId,communityId);if(role?.status!=='ACTIVE')throw Error('COMMUNITY_MEMBERSHIP_REQUIRED');return{row,role};
  }
  private async requireManager(actorId:string,communityId:string){
    const access=await this.requireMember(actorId,communityId);if(!['CREATOR','MODERATOR'].includes(String(access.role?.role)))throw Error('COMMUNITY_MANAGER_REQUIRED');return access;
  }

  async create(actorId:string,input:{name:string;description?:string;locality?:string;visibility?:InterestCommunityVisibility;joinPolicy?:InterestJoinPolicy;tags?:string[]}):Promise<InterestCommunity>{
    const name=clean(input.name,120);if(!name)throw Error('COMMUNITY_NAME_REQUIRED');
    const visibility=input.visibility??'PUBLIC',joinPolicy=input.joinPolicy??'OPEN';if(!['PUBLIC','PRIVATE'].includes(visibility)||!['OPEN','REQUEST'].includes(joinPolicy))throw Error('INVALID_COMMUNITY_POLICY');
    const id='community_'+crypto.randomUUID(),stamp=now(),t=tags(input.tags);
    await this.db.batch([
      this.db.prepare("INSERT INTO interest_communities(community_id,creator_account_id,name,description,locality,visibility,join_policy,tags_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?, 'ACTIVE',?,?)").bind(id,actorId,name,clean(input.description,1200)||null,clean(input.locality,160)||null,visibility,joinPolicy,JSON.stringify(t),stamp,stamp),
      this.db.prepare("INSERT INTO interest_community_members(community_id,account_id,role,status,joined_at) VALUES(?,?,'CREATOR','ACTIVE',?)").bind(id,actorId,stamp)
    ]);
    return{ id,name,description:clean(input.description,1200)||undefined,locality:clean(input.locality,160)||undefined,visibility,joinPolicy,tags:t,creatorAccountId:actorId,createdAt:stamp,updatedAt:stamp,memberCount:1,viewerRole:'CREATOR',viewerStatus:'ACTIVE'};
  }

  async discover(actorId:string,input:{q?:string;locality?:string;tags?:string[];limit?:number}={}):Promise<InterestCommunity[]>{
    const result=await this.db.prepare(`SELECT c.*,
      (SELECT COUNT(*) FROM interest_community_members m WHERE m.community_id=c.community_id AND m.status='ACTIVE') AS member_count,
      vm.role AS viewer_role,vm.status AS viewer_status
      FROM interest_communities c LEFT JOIN interest_community_members vm ON vm.community_id=c.community_id AND vm.account_id=?
      WHERE c.status='ACTIVE' AND (c.visibility='PUBLIC' OR vm.status='ACTIVE')
      ORDER BY c.updated_at DESC LIMIT 250`).bind(actorId).all<Record<string,unknown>>();
    const q=clean(input.q,120).toLowerCase(),locality=clean(input.locality,160).toLowerCase(),wanted=tags(input.tags),limit=Math.min(Math.max(Math.trunc(input.limit??50),1),100);
    return result.results.map(toCommunity).filter(c=>{
      if(locality&&!String(c.locality??'').toLowerCase().includes(locality))return false;
      if(q&&!([c.name,c.description??'',c.locality??'',...c.tags].join(' ').toLowerCase().includes(q)))return false;
      if(wanted.length&&!wanted.some(t=>c.tags.includes(t)))return false;
      return true;
    }).slice(0,limit);
  }

  async mine(actorId:string):Promise<InterestCommunity[]>{
    const rows=await this.db.prepare(`SELECT c.*,
      (SELECT COUNT(*) FROM interest_community_members m2 WHERE m2.community_id=c.community_id AND m2.status='ACTIVE') AS member_count,
      m.role AS viewer_role,m.status AS viewer_status
      FROM interest_community_members m JOIN interest_communities c ON c.community_id=m.community_id
      WHERE m.account_id=? AND m.status='ACTIVE' AND c.status='ACTIVE' ORDER BY c.updated_at DESC`).bind(actorId).all<Record<string,unknown>>();
    return rows.results.map(toCommunity);
  }

  async get(actorId:string,id:string):Promise<InterestCommunity>{
    const {row,role}=await this.requireVisible(actorId,id);return toCommunity({...row,viewer_role:role?.role,viewer_status:role?.status});
  }

  async join(actorId:string,id:string,message=''){
    const {row}=await this.requireVisible(actorId,id),existing=await this.role(actorId,id);if(existing?.status==='ACTIVE')return{status:'JOINED' as const};
    const stamp=now();
    if(row.join_policy==='OPEN'){
      await this.db.prepare(`INSERT INTO interest_community_members(community_id,account_id,role,status,joined_at) VALUES(?,?,'MEMBER','ACTIVE',?)
        ON CONFLICT(community_id,account_id) DO UPDATE SET role='MEMBER',status='ACTIVE',joined_at=excluded.joined_at`).bind(id,actorId,stamp).run();
      return{status:'JOINED' as const};
    }
    const prior=await this.db.prepare("SELECT request_id FROM interest_community_join_requests WHERE community_id=? AND account_id=? AND status='PENDING' LIMIT 1").bind(id,actorId).first<Record<string,unknown>>();
    if(prior)return{status:'PENDING' as const,requestId:String(prior.request_id)};
    const requestId='community_join_'+crypto.randomUUID();
    await this.db.prepare("INSERT INTO interest_community_join_requests(request_id,community_id,account_id,message,status,created_at) VALUES(?,?,?,?, 'PENDING',?)").bind(requestId,id,actorId,clean(message,600)||null,stamp).run();
    return{status:'PENDING' as const,requestId};
  }

  async joinRequests(actorId:string,id:string){
    await this.requireManager(actorId,id);
    const rows=await this.db.prepare("SELECT r.*,a.display_name FROM interest_community_join_requests r LEFT JOIN auth_accounts a ON a.id=r.account_id WHERE r.community_id=? ORDER BY r.created_at DESC").bind(id).all<Record<string,unknown>>();
    return rows.results.map(r=>({id:String(r.request_id),accountId:String(r.account_id),displayName:String(r.display_name??r.account_id),message:r.message?String(r.message):undefined,status:String(r.status),createdAt:String(r.created_at)}));
  }

  async decideJoin(actorId:string,id:string,requestId:string,decision:'APPROVE'|'REJECT'){
    await this.requireManager(actorId,id);if(!['APPROVE','REJECT'].includes(decision))throw Error('INVALID_DECISION');
    const request=await this.db.prepare("SELECT * FROM interest_community_join_requests WHERE request_id=? AND community_id=? AND status='PENDING'").bind(requestId,id).first<Record<string,unknown>>();if(!request)throw Error('COMMUNITY_JOIN_REQUEST_NOT_FOUND');
    const stamp=now(),status=decision==='APPROVE'?'APPROVED':'REJECTED';
    const statements=[this.db.prepare('UPDATE interest_community_join_requests SET status=?,decided_at=?,decided_by=? WHERE request_id=?').bind(status,stamp,actorId,requestId)];
    if(decision==='APPROVE')statements.push(this.db.prepare(`INSERT INTO interest_community_members(community_id,account_id,role,status,joined_at) VALUES(?,?,'MEMBER','ACTIVE',?)
      ON CONFLICT(community_id,account_id) DO UPDATE SET status='ACTIVE',role='MEMBER',joined_at=excluded.joined_at`).bind(id,String(request.account_id),stamp));
    await this.db.batch(statements);return{status};
  }

  async createContent(actorId:string,id:string,input:{kind:InterestContentKind;title?:string;body:string;category?:string;locality?:string;startsAt?:string;endsAt?:string;metadata?:Record<string,unknown>}):Promise<InterestCommunityContent>{
    await this.requireMember(actorId,id);const kind=input.kind;if(!['POST','EVENT','PLACE','OFFER','REQUEST'].includes(kind))throw Error('INVALID_COMMUNITY_CONTENT_KIND');
    const body=clean(input.body,5000);if(!body)throw Error('COMMUNITY_CONTENT_REQUIRED');
    if(input.startsAt&&Number.isNaN(Date.parse(input.startsAt)))throw Error('INVALID_EVENT_DATE');
    if(input.endsAt&&Number.isNaN(Date.parse(input.endsAt)))throw Error('INVALID_EVENT_DATE');
    const contentId='community_content_'+crypto.randomUUID(),stamp=now(),metadata=input.metadata&&typeof input.metadata==='object'?input.metadata:{};
    await this.db.prepare("INSERT INTO interest_community_content(content_id,community_id,author_account_id,kind,title,body,category,locality,starts_at,ends_at,metadata_json,moderation_state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'PUBLISHED',?,?)")
      .bind(contentId,id,actorId,kind,clean(input.title,180)||null,body,clean(input.category,80)||null,clean(input.locality,160)||null,input.startsAt?new Date(input.startsAt).toISOString():null,input.endsAt?new Date(input.endsAt).toISOString():null,JSON.stringify(metadata),stamp,stamp).run();
    return{id:contentId,communityId:id,authorAccountId:actorId,kind,title:clean(input.title,180)||undefined,body,category:clean(input.category,80)||undefined,locality:clean(input.locality,160)||undefined,startsAt:input.startsAt?new Date(input.startsAt).toISOString():undefined,endsAt:input.endsAt?new Date(input.endsAt).toISOString():undefined,metadata,moderationState:'PUBLISHED',createdAt:stamp,updatedAt:stamp};
  }

  async discoverContent(actorId:string,limit=100):Promise<Array<InterestCommunityContent&{communityName:string;communityTags:string[]}>>{
    const rows=await this.db.prepare(`SELECT p.*,c.name AS community_name,c.tags_json AS community_tags_json,c.visibility,
      vm.status AS viewer_status
      FROM interest_community_content p
      JOIN interest_communities c ON c.community_id=p.community_id
      LEFT JOIN interest_community_members vm ON vm.community_id=c.community_id AND vm.account_id=?
      WHERE c.status='ACTIVE' AND p.moderation_state='PUBLISHED' AND (c.visibility='PUBLIC' OR vm.status='ACTIVE')
      ORDER BY COALESCE(p.starts_at,p.created_at) DESC LIMIT ?`)
      .bind(actorId,Math.min(Math.max(Math.trunc(limit),1),250)).all<Record<string,unknown>>();
    return rows.results.map(r=>({...toContent(r),communityName:String(r.community_name),communityTags:parseJson<string[]>(r.community_tags_json,[])}));
  }

  async feed(actorId:string,id:string,limit=100):Promise<InterestCommunityContent[]>{
    const access=await this.requireVisible(actorId,id),manager=['CREATOR','MODERATOR'].includes(String(access.role?.role));
    const rows=await this.db.prepare(`SELECT * FROM interest_community_content WHERE community_id=? ${manager?'':"AND moderation_state='PUBLISHED'"} ORDER BY created_at DESC LIMIT ?`).bind(id,Math.min(Math.max(Math.trunc(limit),1),200)).all<Record<string,unknown>>();
    return rows.results.map(toContent);
  }

  async moderate(actorId:string,id:string,contentId:string,state:'PUBLISHED'|'HIDDEN'){
    await this.requireManager(actorId,id);if(!['PUBLISHED','HIDDEN'].includes(state))throw Error('INVALID_MODERATION_STATE');
    const stamp=now();await this.db.prepare('UPDATE interest_community_content SET moderation_state=?,updated_at=? WHERE content_id=? AND community_id=?').bind(state,stamp,contentId,id).run();return{contentId,state,updatedAt:stamp};
  }
}
