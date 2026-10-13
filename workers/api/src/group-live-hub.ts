import {FinancialWorkCoordinator,deliverFinancialBundle,type FinancialWorkStorage} from './financial-work.js';
import type {D1DatabaseLike} from '../../../packages/repositories/src/index.js';
type LivePayload=Record<string,string|number|boolean|null>;
export interface GroupLiveEvent {seq:number;id:string;type:string;at:string;actorId:string;idempotencyKey:string;targetUserId?:string;managerOnly?:boolean;streamGeneration?:string;payload:LivePayload;}
export interface GroupLiveSignal {id:string;type:string;at:string;actorId:string;payload:LivePayload;}
type StorageLike=FinancialWorkStorage&{delete?(key:string):Promise<void>;transaction?<T>(callback:(storage:StorageLike)=>Promise<T>):Promise<T>};
type StateLike={storage:StorageLike;acceptWebSocket?(ws:WebSocket,tags?:string[]):void;getWebSockets?(tag?:string):WebSocket[];
  // The local qualification adapter supplies transport only. Cloudflare uses
  // its native WebSocketPair/101 response and the same authenticated hub logic.
  createWebSocketPair?():{0:WebSocket;1:WebSocket};upgradeWebSocket?(client:WebSocket):Response;
};

const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const allowedTypes=new Set(['FINANCIAL_NOTICE','FINANCIAL_CELL_PROJECTION','MEMBER_BUNDLE_READY','WORK_MODE_CHANGED','MANAGER_SYNTHESIS_REVIEW_REQUIRED','MEMBER_CONTROL','MEETING_UPDATE','MANAGER_ENTRY','CONSENSUS_REQUIRED','CONSENSUS_SELECTED','MANAGER_RESERVE','MEMBER_PROJECTION_UPDATED','PRESENCE','SYNC_HINT','RULE_UPDATE','COMMUNITY_EVENT','COMMUNITY_DRAFT_SYNC','COMMUNITY_READ_SYNC']);
const allowedSignalTypes=new Set(['PRESENCE','TYPING','TYPING_STOP','CELL_FOCUS','CELL_BLUR','FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR','LIVE_ACK']);
// Draft presence carries no amounts or text: one durable marker per actor+cell.
// It is updated only at draft creation/clear, not on each keystroke.
const DRAFT_TTL_MS=30*60_000;
const draftStorageKey=(actorId:string,payload:LivePayload)=>'signal-actor:'+encodeURIComponent(actorId)+':draft:'+['kind','meetingId','membershipId','rubricId'].map(k=>encodeURIComponent(String(payload[k]??''))).join(':');
const cleanPayload=(value:unknown):LivePayload=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return{};
  const out:LivePayload={};for(const [k,v] of Object.entries(value as Record<string,unknown>)){
    if(k.length>80)continue;if(typeof v==='string')out[k]=v.slice(0,1000);else if(typeof v==='number'&&Number.isFinite(v)||typeof v==='boolean'||v===null)out[k]=v as number|boolean|null;
  }return out;
};

export class GroupLiveHub{
  private recentSignals:GroupLiveSignal[]=[];
  private work:FinancialWorkCoordinator;
  private mutationTail:Promise<unknown>=Promise.resolve();
  private generation?:string;
  private latestSeq?:number;
  constructor(private readonly state:StateLike,private readonly env:unknown){this.work=new FinancialWorkCoordinator(state.storage);}
  private serial<T>(run:()=>Promise<T>):Promise<T>{const task=this.mutationTail.then(run,run);this.mutationTail=task.then(()=>undefined,()=>undefined);return task;}
  private async streamGeneration(){if(!this.generation){this.generation=await this.state.storage.get<string>('stream-generation');if(!this.generation){this.generation=crypto.randomUUID();await this.state.storage.put('stream-generation',this.generation);}}return this.generation;}
  private managerEvent(event:GroupLiveEvent){return Boolean(event.managerOnly)||['MANAGER_ENTRY','CONSENSUS_REQUIRED','CONSENSUS_SELECTED','MANAGER_RESERVE','MANAGER_SYNTHESIS_REVIEW_REQUIRED'].includes(event.type)||event.type==='MEETING_UPDATE'&&Boolean(event.payload.membershipId&&event.payload.rubricId);}

  private async eventPage(after=0,limit=100,userId?:string,manager=false){
    const max=Math.min(Math.max(Math.trunc(limit)||100,1),500),visible:GroupLiveEvent[]=[];
    let cursor=after>0?'event:'+String(Math.trunc(after)).padStart(12,'0'):undefined;
    let scanned=Math.max(0,after);
    while(visible.length<max){
      const rows=await this.state.storage.list<GroupLiveEvent>({prefix:'event:',startAfter:cursor,limit:500});
      const entries=[...rows.entries()];if(!entries.length)break;
      for(const [key,event] of entries){
        cursor=key;scanned=Math.max(scanned,event.seq);
        if(event.seq>after&&(!event.targetUserId||event.targetUserId===userId)&&(!this.managerEvent(event)||manager))visible.push(event);
        if(visible.length>=max)break;
      }
      if(entries.length<500)break;
    }
    const latest=await this.state.storage.get<number>('seq')??0;this.latestSeq=latest;
    return{events:visible.sort((a,b)=>a.seq-b.seq).slice(0,max),latest,scannedCursor:scanned,hasMore:scanned<latest,streamGeneration:await this.streamGeneration()};
  }
  private broadcast(event:GroupLiveEvent){
    const message=JSON.stringify({type:'GROUP_LIVE_EVENT',event});
    const sockets=event.targetUserId?this.state.getWebSockets?.('user:'+event.targetUserId)??[]:this.state.getWebSockets?.(this.managerEvent(event)?'manager':'group-live')??[];
    for(const ws of sockets)try{if(ws.readyState===WebSocket.OPEN)ws.send(message);}catch{}
  }
  private broadcastSignal(signal:GroupLiveSignal){
    const message=JSON.stringify({type:'GROUP_LIVE_SIGNAL',event:signal});
    const sockets=this.state.getWebSockets?.('group-live')??[];
    for(const ws of sockets)try{if(ws.readyState===WebSocket.OPEN)ws.send(message);}catch{}
  }
  private async signal(input:Record<string,unknown>):Promise<GroupLiveSignal>{
    const type=String(input.type??'');if(!allowedSignalTypes.has(type))throw new Error('LIVE_SIGNAL_TYPE_NOT_ALLOWED');
    const signal:GroupLiveSignal={id:String(input.id??crypto.randomUUID()),type,at:new Date().toISOString(),actorId:String(input.actorId??'unknown').slice(0,200),payload:cleanPayload(input.payload)};
    const now=Date.now();this.recentSignals=this.recentSignals.filter(x=>now-Date.parse(x.at)<12000);this.recentSignals.push(signal);if(this.recentSignals.length>200)this.recentSignals.splice(0,this.recentSignals.length-200);
    // TYPING / FOCUS / BLUR are pure push: no Durable storage write.
    // Preserve multiple independent cell drafts from the same manager. Clearing
    // cell A must not erase cell B; the marker contains metadata, not draft text.
    if(type==='FINANCIAL_DRAFT')await this.state.storage.put(draftStorageKey(signal.actorId,signal.payload),signal);
    if(type==='FINANCIAL_DRAFT_CLEAR'){
      const key=draftStorageKey(signal.actorId,signal.payload);
      if(this.state.storage.delete)await this.state.storage.delete(key);
      else await this.state.storage.put(key,signal);
    }
    this.broadcastSignal(signal);return signal;
  }
  private async signals(afterAt=0,excludeActorId?:string):Promise<GroupLiveSignal[]>{
    const now=Date.now();this.recentSignals=this.recentSignals.filter(x=>now-Date.parse(x.at)<12000);
    const stored=await this.state.storage.list<GroupLiveSignal>({prefix:'signal-actor:',limit:500});
    const all=[...this.recentSignals,...stored.values()],deduped=new Map<string,GroupLiveSignal>();
    for(const signal of all){
      const at=Date.parse(signal.at)||0,activeDraft=signal.type==='FINANCIAL_DRAFT';
      // Active drafts survive reconnect (and the 12s typing TTL) for at most
      // 30 minutes. They are cleared explicitly on submit or abandonment.
      if(now-at>(activeDraft?DRAFT_TTL_MS:12000)||(!activeDraft&&at<=afterAt)||excludeActorId&&signal.actorId===excludeActorId)continue;
      const category=['FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR'].includes(signal.type)?'draft':'activity';
      const key=signal.actorId+'|'+category+'|'+String(signal.payload?.kind??'')+'|'+String(signal.payload?.meetingId??'')+'|'+String(signal.payload?.membershipId??'')+'|'+String(signal.payload?.rubricId??'');
      const prior=deduped.get(key);// A CLEAR in the very same millisecond must supersede its DRAFT.
      if(!prior||Date.parse(prior.at)<=at)deduped.set(key,signal);
    }
    return [...deduped.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(-100);
  }
  private async publish(input:Record<string,unknown>):Promise<GroupLiveEvent>{
    const type=String(input.type??'');if(!allowedTypes.has(type))throw new Error('LIVE_EVENT_TYPE_NOT_ALLOWED');
    const idempotencyKey=String(input.idempotencyKey??'').trim();if(!idempotencyKey||idempotencyKey.length>200)throw new Error('LIVE_IDEMPOTENCY_REQUIRED');
    const idemKey='idem:'+idempotencyKey,existingSeq=await this.state.storage.get<number>(idemKey);
    if(existingSeq){const existing=await this.state.storage.get<GroupLiveEvent>('event:'+String(existingSeq).padStart(12,'0'));if(existing)return existing;}
    const generation=await this.streamGeneration();
    const targetUserId=input.targetUserId?String(input.targetUserId).slice(0,200):undefined;
    const write=async(storage:StorageLike)=>{
      const previous=await storage.get<number>(idemKey);if(previous){const old=await storage.get<GroupLiveEvent>('event:'+String(previous).padStart(12,'0'));if(old)return old;}
      const seq=(await storage.get<number>('seq')??0)+1;
      const event:GroupLiveEvent={seq,id:String(input.id??crypto.randomUUID()),type,at:new Date().toISOString(),actorId:String(input.actorId??'unknown').slice(0,200),idempotencyKey,targetUserId,managerOnly:Boolean(input.managerOnly),streamGeneration:generation,payload:cleanPayload(input.payload)};
      await storage.put('event:'+String(seq).padStart(12,'0'),event);await storage.put('seq',seq);await storage.put(idemKey,seq);return event;
    };
    const event=this.state.storage.transaction?await this.state.storage.transaction(write):await write(this.state.storage);this.latestSeq=event.seq;
    this.broadcast(event);return event;
  }

  async fetch(request:Request):Promise<Response>{
    const url=new URL(request.url);
    if(url.pathname.endsWith('/connect')){
      if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'WEBSOCKET_UPGRADE_REQUIRED'},426);
      if(!this.state.acceptWebSocket)return json({error:'HIBERNATION_UNAVAILABLE'},503);
      const userId=url.searchParams.get('userId')?.slice(0,200);if(!userId)return json({error:'LIVE_USER_REQUIRED'},400);
      const Pair=(globalThis as unknown as {WebSocketPair:new()=>{0:WebSocket;1:WebSocket}}).WebSocketPair;
      if(!Pair&&!this.state.createWebSocketPair)return json({error:'WEBSOCKET_PAIR_UNAVAILABLE'},503);
      const manager=url.searchParams.get('manager')==='1';
      const pair=this.state.createWebSocketPair?.()??new Pair(),client=pair[0],server=pair[1];this.state.acceptWebSocket(server,['group-live','user:'+userId,...(manager?['manager']:[])]);
      const hibernatingSocket=server as WebSocket & {serializeAttachment?:(value:unknown)=>void};
      hibernatingSocket.serializeAttachment?.({connectedAt:new Date().toISOString(),userId,manager});
      const requestedAfter=Math.max(0,Number(url.searchParams.get('after')??0)||0),latest=await this.state.storage.get<number>('seq')??0,reset=requestedAfter>latest,effectiveAfter=reset?0:requestedAfter;
      const page=await this.eventPage(effectiveAfter,500,userId,manager);
      try{server.send(JSON.stringify({type:'GROUP_LIVE_HELLO',latest,reset,streamGeneration:page.streamGeneration}));}catch{}
      for(const event of page.events)try{server.send(JSON.stringify({type:'GROUP_LIVE_EVENT',event}));}catch{}
      try{server.send(JSON.stringify({type:'GROUP_LIVE_REPLAY_END',scannedCursor:page.scannedCursor,hasMore:page.hasMore,streamGeneration:page.streamGeneration}));}catch{}
      for(const signal of await this.signals(Date.now()-12000,userId))try{server.send(JSON.stringify({type:'GROUP_LIVE_SIGNAL',event:signal}));}catch{}
      return this.state.upgradeWebSocket?.(client)??new Response(null,{status:101,webSocket:client} as ResponseInit&{webSocket:WebSocket});
    }
    if(request.method==='GET'&&url.pathname.endsWith('/events'))return json(await this.eventPage(Number(url.searchParams.get('after')??0),Number(url.searchParams.get('limit')??100),url.searchParams.get('userId')??undefined,url.searchParams.get('manager')==='1'));
    if(request.method==='GET'&&url.pathname.endsWith('/signals')){const rows=await this.signals(Number(url.searchParams.get('afterAt')??0),url.searchParams.get('actorId')??undefined);return json({signals:rows,latestAt:rows.reduce((n,x)=>Math.max(n,Date.parse(x.at)||0),Number(url.searchParams.get('afterAt')??0)),ephemeral:true,ttlMs:12000});}
    if(request.method==='POST'&&url.pathname.endsWith('/publish')){
      try{const input=await request.json() as Record<string,unknown>;return json({event:await this.serial(()=>this.publish(input))},201);}catch(e){return json({error:e instanceof Error?e.message:'LIVE_ERROR'},400);}
    }
    if(request.method==='POST'&&url.pathname.endsWith('/signal')){
      try{return json({signal:await this.signal(await request.json() as Record<string,unknown>)},202);}catch(e){return json({error:e instanceof Error?e.message:'LIVE_ERROR'},400);}
    }
    if(request.method==='GET'&&url.pathname.endsWith('/health'))return json({ok:true,latest:await this.state.storage.get<number>('seq')??0,webSockets:this.state.getWebSockets?.().length??0});
    if(url.pathname.includes('/financial-work/')){
      try{
        const action=url.pathname.split('/').pop(),input=request.method==='GET'?Object.fromEntries(url.searchParams):await request.json() as Record<string,unknown>;
        return await this.serial(async()=>{
          if(action==='context')return json({context:await this.work.context(safeWork(input.meetingId))});
          if(action==='mode'){
            const result=await this.work.choose(input as any);
            await this.publish({type:'WORK_MODE_CHANGED',actorId:input.actorId,idempotencyKey:'mode:'+result.context.workSessionId+':'+result.context.modeVersion,payload:{meetingId:result.context.meetingId,mode:result.context.mode,modeVersion:result.context.modeVersion,workSessionId:result.context.workSessionId,paused:false}});return json(result);
          }
          if(action==='activity'){const result=await this.work.activity(input as any);if(result.proposeReunion)this.broadcastSignal({id:crypto.randomUUID(),type:'WORK_MODE_PROPOSAL',actorId:'server',at:new Date().toISOString(),payload:{meetingId:safeWork(input.meetingId),activeManagers:result.activeManagers}});return json(result);}
          if(action==='operation')return json(await this.work.operation(input as any));
          if(action==='terminal'){await this.work.terminal(input as any);return json({accepted:true});}
          if(action==='close')return json(await this.work.close(input as any));
          if(action==='pause')return json({context:await this.work.pause(safeWork(input.meetingId),safeWork(input.actorId))});
          return json({error:'NOT_FOUND'},404);
        });
      }catch(e){return json({error:e instanceof Error?e.message:'FINANCIAL_WORK_ERROR'},409);}
    }
    return json({error:'NOT_FOUND'},404);
  }

  async webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){
    if(typeof message!=='string'){ws.send(JSON.stringify({type:'ERROR',error:'TEXT_MESSAGES_ONLY'}));return;}
    if(message==='PING'){ws.send(JSON.stringify({type:'PONG',at:new Date().toISOString()}));return;}
    try{
      const parsed=JSON.parse(message) as {type?:string;eventType?:string;payload?:unknown};
      if(parsed.type==='SYNC_PROBE'){
        const a=(ws as WebSocket&{deserializeAttachment?:()=>unknown}).deserializeAttachment?.() as {userId?:string;manager?:boolean}|undefined;
        if(!a?.userId)throw Error('LIVE_ACTOR_REQUIRED');
        const input=parsed as typeof parsed&{after?:number},after=Math.max(0,Number(input.after??0));if(this.latestSeq!==undefined&&after>=this.latestSeq){ws.send(JSON.stringify({type:'GROUP_LIVE_REPLAY_END',scannedCursor:this.latestSeq,hasMore:false,streamGeneration:await this.streamGeneration()}));return;}const page=await this.eventPage(after,500,a.userId,Boolean(a.manager));
        for(const event of page.events)ws.send(JSON.stringify({type:'GROUP_LIVE_EVENT',event}));
        ws.send(JSON.stringify({type:'GROUP_LIVE_REPLAY_END',scannedCursor:page.scannedCursor,hasMore:page.hasMore,streamGeneration:page.streamGeneration}));return;
      }
      if(parsed.type!=='CLIENT_SIGNAL')return;
      const hibernatingSocket=ws as WebSocket & {deserializeAttachment?:()=>unknown};
      const attachment=hibernatingSocket.deserializeAttachment?.() as {userId?:string}|undefined,actorId=String(attachment?.userId??'');
      if(!actorId)throw new Error('LIVE_ACTOR_REQUIRED');
      const roles=attachment as {manager?:boolean},raw=parsed.payload as Record<string,unknown>|undefined;
      if(raw?.kind==='FINANCIAL_CELL'&&!roles.manager)throw Error('MANAGER_REQUIRED');
      if(parsed.type==='CLIENT_SIGNAL')await this.serial(async()=>{
        await this.signal({type:String(parsed.eventType??''),actorId,payload:parsed.payload});
        if(roles.manager&&raw?.kind==='FINANCIAL_CELL'&&await this.work.context(safeWork(raw.meetingId))&&['TYPING','FINANCIAL_DRAFT','CELL_FOCUS'].includes(String(parsed.eventType))){
          const result=await this.work.activity({meetingId:safeWork(raw.meetingId),membershipId:safeWork(raw.membershipId),actorId,deviceId:safeWork(raw.deviceId),passageId:safeWork(raw.passageId)||undefined,meaningful:parsed.eventType!=='CELL_FOCUS'});
          if(result.proposeReunion)this.broadcastSignal({id:crypto.randomUUID(),type:'WORK_MODE_PROPOSAL',actorId:'server',at:new Date().toISOString(),payload:{meetingId:safeWork(raw.meetingId),activeManagers:result.activeManagers}});
        }
      });
    }catch(e){try{ws.send(JSON.stringify({type:'ERROR',error:e instanceof Error?e.message:'LIVE_SIGNAL_ERROR'}));}catch{}}
  }
  async webSocketClose(ws:WebSocket,code:number,reason:string){try{ws.close(code,reason);}catch{}}
  async webSocketError(ws:WebSocket){try{ws.close(1011,'live-error');}catch{}}
  async alarm(){
    const db=((this.env??{}) as {DB?:D1DatabaseLike}).DB;
    await this.serial(async()=>{
      for(const b of await this.work.due()){
        try{
          if(!db)throw Error('NOTIFICATION_DATABASE_UNAVAILABLE');
          const result=await deliverFinancialBundle(db,b);
          await this.publish({type:'MEMBER_BUNDLE_READY',actorId:'server',targetUserId:result.userId,idempotencyKey:'bundle:'+result.bundleId+':v'+result.bundleVersion,payload:result});
          await this.work.delivered(b);
        }catch{await this.work.deliveryFailed(b);}
      }
      await this.work.schedule();
    });
  }
}

const safeWork=(value:unknown)=>String(value??'').slice(0,240);
