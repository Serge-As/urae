import type {D1DatabaseLike} from '../../repositories/src/index.js';

export interface ForumMessage{
  id:string;tenantId:string;groupId:string;hubId:string;authorId:string;parentId?:string;rootId?:string;
  kind:'DISCUSSION'|'ANNOUNCEMENT'|'OFFER'|'REQUEST';title?:string;body:string;moderationState:'PUBLISHED'|'HIDDEN';
  createdAt:string;editedAt?:string;reactions:Record<string,number>;viewerReactions:string[];
}
export interface ForumUserState{
  groupId:string;hubId:string;userId:string;draftTitle:string;draftBody:string;lastReadMessageId?:string;lastReadAt?:string;
  anchorMessageId?:string;anchorRatio:number;updatedAt:string;
}
interface Row{[key:string]:unknown}
const clean=(v:string,max:number)=>v.trim().replace(/\r\n/g,'\n').slice(0,max);
const now=()=>new Date().toISOString();

export class CommunityRealtimeStore{
  constructor(public db:D1DatabaseLike){}

  async messageReference(tenantId:string,groupId:string,hubId:string,id:string){
    const r=await this.db.prepare("SELECT id,title,body,edited_at,moderation_state FROM community_messages WHERE tenant_id=? AND group_id=? AND hub_id=? AND id=? AND moderation_state='PUBLISHED'").bind(tenantId,groupId,hubId,id).first<Row>();
    return r?{id:String(r.id),title:String(r.title??''),body:String(r.body),editedAt:String(r.edited_at??''),moderationState:String(r.moderation_state)}:undefined;
  }

  async createMessage(input:{tenantId:string;groupId:string;hubId:string;authorId:string;kind?:ForumMessage['kind'];title?:string;body:string;parentId?:string}):Promise<ForumMessage>{
    const body=clean(input.body,10000);if(!body)throw new Error('COMMUNITY_MESSAGE_REQUIRED');
    const kind=input.kind??'DISCUSSION';if(!['DISCUSSION','ANNOUNCEMENT','OFFER','REQUEST'].includes(kind))throw new Error('INVALID_COMMUNITY_POST_KIND');
    let rootId:string|undefined;
    if(input.parentId){
      const parent=await this.db.prepare('SELECT id,root_id,tenant_id,group_id,hub_id FROM community_messages WHERE id=?').bind(input.parentId).first<Row>();
      if(!parent||String(parent.tenant_id)!==input.tenantId||String(parent.group_id)!==input.groupId||String(parent.hub_id)!==input.hubId)throw new Error('COMMUNITY_PARENT_NOT_FOUND');
      rootId=String(parent.root_id??parent.id);
    }
    const id='msg_'+crypto.randomUUID(),stamp=now(),title=clean(input.title??'',180);
    await this.db.prepare('INSERT INTO community_messages(id,tenant_id,group_id,hub_id,author_id,parent_id,root_id,kind,title,body,moderation_state,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id,input.tenantId,input.groupId,input.hubId,input.authorId,input.parentId??null,rootId??null,kind,title||null,body,'PUBLISHED',stamp).run();
    return{id,tenantId:input.tenantId,groupId:input.groupId,hubId:input.hubId,authorId:input.authorId,parentId:input.parentId,rootId,kind,title:title||undefined,body,moderationState:'PUBLISHED',createdAt:stamp,reactions:{},viewerReactions:[]};
  }

  async listMessages(input:{tenantId:string;groupId:string;hubId:string;viewerId:string;limit?:number;before?:string;after?:string;around?:string}):Promise<{messages:ForumMessage[];nextBefore?:string;nextAfter?:string}>{
    const limit=Math.min(Math.max(Math.trunc(input.limit??50),1),100);
    let ordered:Row[]=[];
    if(input.around){
      const anchor=await this.db.prepare('SELECT created_at FROM community_messages WHERE id=? AND tenant_id=? AND group_id=? AND hub_id=?').bind(input.around,input.tenantId,input.groupId,input.hubId).first<{created_at:string}>();
      if(anchor){
        const half=Math.max(1,Math.floor(limit/2));
        const beforeRows=await this.db.prepare("SELECT * FROM community_messages WHERE tenant_id=? AND group_id=? AND hub_id=? AND moderation_state='PUBLISHED' AND created_at<=? ORDER BY created_at DESC,id DESC LIMIT ?").bind(input.tenantId,input.groupId,input.hubId,anchor.created_at,half+1).all<Row>();
        const afterRows=await this.db.prepare("SELECT * FROM community_messages WHERE tenant_id=? AND group_id=? AND hub_id=? AND moderation_state='PUBLISHED' AND created_at>? ORDER BY created_at ASC,id ASC LIMIT ?").bind(input.tenantId,input.groupId,input.hubId,anchor.created_at,half).all<Row>();
        ordered=[...beforeRows.results].reverse().concat(afterRows.results);
      }
    }
    if(!ordered.length){
      let sql='SELECT * FROM community_messages WHERE tenant_id=? AND group_id=? AND hub_id=? AND moderation_state=\'PUBLISHED\'';
      const args:unknown[]=[input.tenantId,input.groupId,input.hubId];
      if(input.before){sql+=' AND created_at < ?';args.push(input.before);}
      if(input.after){sql+=' AND created_at > ?';args.push(input.after);}
      sql+=' ORDER BY created_at '+(input.after?'ASC':'DESC')+', id '+(input.after?'ASC':'DESC')+' LIMIT ?';args.push(limit);
      const rows=await this.db.prepare(sql).bind(...args).all<Row>();
      ordered=input.after?rows.results:[...rows.results].reverse();
    }
    const ids=ordered.map(r=>String(r.id));
    const reactions=new Map<string,Array<{reaction:string;user_id:string}>>();
    if(ids.length){
      const placeholders=ids.map(()=>'?').join(',');
      const rr=await this.db.prepare('SELECT message_id,reaction,user_id FROM community_reactions WHERE message_id IN ('+placeholders+')').bind(...ids).all<Row>();
      for(const row of rr.results){const id=String(row.message_id),a=reactions.get(id)??[];a.push({reaction:String(row.reaction),user_id:String(row.user_id)});reactions.set(id,a);}
    }
    const messages=ordered.map(r=>{
      const rs=reactions.get(String(r.id))??[],summary:Record<string,number>={};
      for(const x of rs)summary[x.reaction]=(summary[x.reaction]??0)+1;
      return{id:String(r.id),tenantId:String(r.tenant_id),groupId:String(r.group_id),hubId:String(r.hub_id),authorId:String(r.author_id),parentId:r.parent_id?String(r.parent_id):undefined,rootId:r.root_id?String(r.root_id):undefined,kind:String(r.kind) as ForumMessage['kind'],title:r.title?String(r.title):undefined,body:String(r.body),moderationState:String(r.moderation_state) as 'PUBLISHED',createdAt:String(r.created_at),editedAt:r.edited_at?String(r.edited_at):undefined,reactions:summary,viewerReactions:rs.filter(x=>x.user_id===input.viewerId).map(x=>x.reaction)};
    });
    return{messages,nextBefore:messages[0]?.createdAt,nextAfter:messages[messages.length-1]?.createdAt};
  }

  async state(tenantId:string,groupId:string,hubId:string,userId:string):Promise<ForumUserState>{
    const row=await this.db.prepare('SELECT * FROM community_user_state WHERE tenant_id=? AND group_id=? AND hub_id=? AND user_id=?').bind(tenantId,groupId,hubId,userId).first<Row>();
    if(!row)return{groupId,hubId,userId,draftTitle:'',draftBody:'',anchorRatio:0,updatedAt:now()};
    return{groupId,hubId,userId,draftTitle:String(row.draft_title??''),draftBody:String(row.draft_body??''),lastReadMessageId:row.last_read_message_id?String(row.last_read_message_id):undefined,lastReadAt:row.last_read_at?String(row.last_read_at):undefined,anchorMessageId:row.anchor_message_id?String(row.anchor_message_id):undefined,anchorRatio:Number(row.anchor_ratio??0),updatedAt:String(row.updated_at)};
  }

  async saveDraft(input:{tenantId:string;groupId:string;hubId:string;userId:string;title:string;body:string;expectedTitle?:string;expectedBody?:string}):Promise<ForumUserState>{
    const title=clean(input.title,180),body=input.body.slice(0,10000),checked=input.expectedTitle!==undefined&&input.expectedBody!==undefined;
    if(checked){
      const previous=await this.state(input.tenantId,input.groupId,input.hubId,input.userId);
      if(previous.draftTitle===title&&previous.draftBody===body)return previous;
      if(previous.draftTitle!==input.expectedTitle||previous.draftBody!==input.expectedBody)throw Error('FORUM_DRAFT_CHANGED');
    }
    const sql="INSERT INTO community_user_state(tenant_id,group_id,hub_id,user_id,draft_title,draft_body,anchor_ratio,updated_at) VALUES(?,?,?,?,?,?,0,?) ON CONFLICT(tenant_id,group_id,hub_id,user_id) DO UPDATE SET draft_title=excluded.draft_title,draft_body=excluded.draft_body,updated_at=excluded.updated_at"+(checked?" WHERE community_user_state.draft_title=? AND community_user_state.draft_body=?":"");
    const values:unknown[]=[input.tenantId,input.groupId,input.hubId,input.userId,title,body,now()];if(checked)values.push(input.expectedTitle,input.expectedBody);
    await this.db.prepare(sql).bind(...values).run();
    const current=await this.state(input.tenantId,input.groupId,input.hubId,input.userId);
    if(checked&&(current.draftTitle!==title||current.draftBody!==body))throw Error('FORUM_DRAFT_CHANGED');
    return current;
  }
  async markRead(input:{tenantId:string;groupId:string;hubId:string;userId:string;messageId:string;anchorRatio?:number}):Promise<ForumUserState>{
    const stamp=now();
    // Reading must not overwrite a draft being saved by another window.
    await this.db.prepare("INSERT INTO community_user_state(tenant_id,group_id,hub_id,user_id,draft_title,draft_body,last_read_message_id,last_read_at,anchor_message_id,anchor_ratio,updated_at) VALUES(?,?,?,?,'','',?,?,?,?,?) ON CONFLICT(tenant_id,group_id,hub_id,user_id) DO UPDATE SET last_read_message_id=excluded.last_read_message_id,last_read_at=excluded.last_read_at,anchor_message_id=excluded.anchor_message_id,anchor_ratio=excluded.anchor_ratio,updated_at=excluded.updated_at")
      .bind(input.tenantId,input.groupId,input.hubId,input.userId,input.messageId,stamp,input.messageId,Math.min(1,Math.max(0,Number(input.anchorRatio)||0)),stamp).run();
    return this.state(input.tenantId,input.groupId,input.hubId,input.userId);
  }

  async messageContext(messageId:string):Promise<{tenantId:string;groupId:string;hubId:string;authorId:string}|undefined>{
    const row=await this.db.prepare('SELECT tenant_id,group_id,hub_id,author_id FROM community_messages WHERE id=?').bind(messageId).first<Row>();
    return row?{tenantId:String(row.tenant_id),groupId:String(row.group_id),hubId:String(row.hub_id),authorId:String(row.author_id)}:undefined;
  }

  async toggleReaction(input:{messageId:string;userId:string;reaction:string}):Promise<{active:boolean}>{
    const reaction=clean(input.reaction,24);if(!reaction)throw new Error('REACTION_REQUIRED');
    const existing=await this.db.prepare('SELECT 1 AS yes FROM community_reactions WHERE message_id=? AND user_id=? AND reaction=?').bind(input.messageId,input.userId,reaction).first<{yes:number}>();
    if(existing){await this.db.prepare('DELETE FROM community_reactions WHERE message_id=? AND user_id=? AND reaction=?').bind(input.messageId,input.userId,reaction).run();return{active:false};}
    const message=await this.db.prepare('SELECT id FROM community_messages WHERE id=?').bind(input.messageId).first<{id:string}>();if(!message)throw new Error('COMMUNITY_MESSAGE_NOT_FOUND');
    await this.db.prepare('INSERT INTO community_reactions(message_id,user_id,reaction,created_at) VALUES(?,?,?,?)').bind(input.messageId,input.userId,reaction,now()).run();return{active:true};
  }

  async clearDraft(tenantId:string,groupId:string,hubId:string,userId:string){return this.saveDraft({tenantId,groupId,hubId,userId,title:'',body:''});}
}
