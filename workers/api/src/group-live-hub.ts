type LivePayload=Record<string,string|number|boolean|null>;
export interface GroupLiveEvent {seq:number;id:string;type:string;at:string;actorId:string;idempotencyKey:string;targetUserId?:string;payload:LivePayload;}
export interface GroupLiveSignal {id:string;type:string;at:string;actorId:string;payload:LivePayload;}
type StorageLike={get<T=unknown>(key:string):Promise<T|undefined>;put(key:string,value:unknown):Promise<void>;delete?(key:string):Promise<void>;list<T=unknown>(options?:{prefix?:string;startAfter?:string;limit?:number}):Promise<Map<string,T>>;};
type StateLike={storage:StorageLike;acceptWebSocket?(ws:WebSocket,tags?:string[]):void;getWebSockets?(tag?:string):WebSocket[];};

const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const allowedTypes=new Set(['FINANCIAL_NOTICE','MEMBER_CONTROL','MEETING_UPDATE','MANAGER_ENTRY','CONSENSUS_REQUIRED','CONSENSUS_SELECTED','MANAGER_RESERVE','MEMBER_PROJECTION_UPDATED','PRESENCE','SYNC_HINT','RULE_UPDATE','COMMUNITY_EVENT','COMMUNITY_DRAFT_SYNC','COMMUNITY_READ_SYNC']);
const allowedSignalTypes=new Set(['PRESENCE','TYPING','TYPING_STOP','CELL_FOCUS','CELL_BLUR','FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR','LIVE_ACK']);
const cleanPayload=(value:unknown):LivePayload=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return{};
  const out:LivePayload={};for(const [k,v] of Object.entries(value as Record<string,unknown>)){
    if(k.length>80)continue;if(typeof v==='string')out[k]=v.slice(0,1000);else if(typeof v==='number'&&Number.isFinite(v)||typeof v==='boolean'||v===null)out[k]=v as number|boolean|null;
  }return out;
};

export class GroupLiveHub{
  private recentSignals:GroupLiveSignal[]=[];
  constructor(private readonly state:StateLike,private readonly env:unknown){void env;}

  private async events(after=0,limit=100,userId?:string):Promise<GroupLiveEvent[]>{
    const max=Math.min(Math.max(Math.trunc(limit)||100,1),500),visible:GroupLiveEvent[]=[];
    let cursor=after>0?'event:'+String(Math.trunc(after)).padStart(12,'0'):undefined;
    while(visible.length<max){
      const rows=await this.state.storage.list<GroupLiveEvent>({prefix:'event:',startAfter:cursor,limit:500});
      const entries=[...rows.entries()];if(!entries.length)break;
      for(const [,event] of entries){
        if(event.seq>after&&(!event.targetUserId||event.targetUserId===userId))visible.push(event);
        if(visible.length>=max)break;
      }
      cursor=entries[entries.length-1]![0];
      if(entries.length<500)break;
    }
    return visible.sort((a,b)=>a.seq-b.seq).slice(0,max);
  }
  private broadcast(event:GroupLiveEvent){
    const message=JSON.stringify({type:'GROUP_LIVE_EVENT',event});
    const sockets=event.targetUserId?this.state.getWebSockets?.('user:'+event.targetUserId)??[]:this.state.getWebSockets?.('group-live')??[];
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
    // Bounded hibernation fallback: at most two short-lived records per actor:
    // draft state and transient activity. Financial amounts are never stored here.
    const category=['FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR'].includes(type)?'draft':'activity';
    await this.state.storage.put('signal-actor:'+encodeURIComponent(signal.actorId)+':'+category,signal);
    this.broadcastSignal(signal);return signal;
  }
  private async signals(afterAt=0,excludeActorId?:string):Promise<GroupLiveSignal[]>{
    const now=Date.now();this.recentSignals=this.recentSignals.filter(x=>now-Date.parse(x.at)<12000);
    const stored=await this.state.storage.list<GroupLiveSignal>({prefix:'signal-actor:',limit:500});
    const all=[...this.recentSignals,...stored.values()],deduped=new Map<string,GroupLiveSignal>();
    for(const signal of all){
      const at=Date.parse(signal.at)||0;if(now-at>12000||at<=afterAt||excludeActorId&&signal.actorId===excludeActorId)continue;
      const category=['FINANCIAL_DRAFT','FINANCIAL_DRAFT_CLEAR'].includes(signal.type)?'draft':'activity';
      const key=signal.actorId+'|'+category+'|'+String(signal.payload?.kind??'')+'|'+String(signal.payload?.meetingId??'')+'|'+String(signal.payload?.membershipId??'')+'|'+String(signal.payload?.rubricId??'');
      const prior=deduped.get(key);if(!prior||Date.parse(prior.at)<at)deduped.set(key,signal);
    }
    return [...deduped.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)).slice(-100);
  }
  private async publish(input:Record<string,unknown>):Promise<GroupLiveEvent>{
    const type=String(input.type??'');if(!allowedTypes.has(type))throw new Error('LIVE_EVENT_TYPE_NOT_ALLOWED');
    const idempotencyKey=String(input.idempotencyKey??'').trim();if(!idempotencyKey||idempotencyKey.length>200)throw new Error('LIVE_IDEMPOTENCY_REQUIRED');
    const idemKey='idem:'+idempotencyKey,existingSeq=await this.state.storage.get<number>(idemKey);
    if(existingSeq){const existing=await this.state.storage.get<GroupLiveEvent>('event:'+String(existingSeq).padStart(12,'0'));if(existing)return existing;}
    const seq=(await this.state.storage.get<number>('seq')??0)+1;
    const targetUserId=input.targetUserId?String(input.targetUserId).slice(0,200):undefined;
    const event:GroupLiveEvent={seq,id:String(input.id??crypto.randomUUID()),type,at:new Date().toISOString(),actorId:String(input.actorId??'unknown').slice(0,200),idempotencyKey,targetUserId,payload:cleanPayload(input.payload)};
    await this.state.storage.put('event:'+String(seq).padStart(12,'0'),event);await this.state.storage.put('seq',seq);await this.state.storage.put(idemKey,seq);
    this.broadcast(event);return event;
  }

  async fetch(request:Request):Promise<Response>{
    const url=new URL(request.url);
    if(url.pathname.endsWith('/connect')){
      if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'WEBSOCKET_UPGRADE_REQUIRED'},426);
      if(!this.state.acceptWebSocket)return json({error:'HIBERNATION_UNAVAILABLE'},503);
      const userId=url.searchParams.get('userId')?.slice(0,200);if(!userId)return json({error:'LIVE_USER_REQUIRED'},400);
      const Pair=(globalThis as unknown as {WebSocketPair:new()=>{0:WebSocket;1:WebSocket}}).WebSocketPair;if(!Pair)return json({error:'WEBSOCKET_PAIR_UNAVAILABLE'},503);
      const pair=new Pair(),client=pair[0],server=pair[1];this.state.acceptWebSocket(server,['group-live','user:'+userId]);
      const hibernatingSocket=server as WebSocket & {serializeAttachment?:(value:unknown)=>void};
      hibernatingSocket.serializeAttachment?.({connectedAt:new Date().toISOString()});
      return new Response(null,{status:101,webSocket:client} as ResponseInit&{webSocket:WebSocket});
    }
    if(request.method==='GET'&&url.pathname.endsWith('/events'))return json({events:await this.events(Number(url.searchParams.get('after')??0),Number(url.searchParams.get('limit')??100),url.searchParams.get('userId')??undefined),latest:await this.state.storage.get<number>('seq')??0});
    if(request.method==='GET'&&url.pathname.endsWith('/signals')){const rows=await this.signals(Number(url.searchParams.get('afterAt')??0),url.searchParams.get('actorId')??undefined);return json({signals:rows,latestAt:rows.reduce((n,x)=>Math.max(n,Date.parse(x.at)||0),Number(url.searchParams.get('afterAt')??0)),ephemeral:true,ttlMs:12000});}
    if(request.method==='POST'&&url.pathname.endsWith('/publish')){
      try{return json({event:await this.publish(await request.json() as Record<string,unknown>)},201);}catch(e){return json({error:e instanceof Error?e.message:'LIVE_ERROR'},400);}
    }
    if(request.method==='POST'&&url.pathname.endsWith('/signal')){
      try{return json({signal:await this.signal(await request.json() as Record<string,unknown>)},202);}catch(e){return json({error:e instanceof Error?e.message:'LIVE_ERROR'},400);}
    }
    if(request.method==='GET'&&url.pathname.endsWith('/health'))return json({ok:true,latest:await this.state.storage.get<number>('seq')??0,webSockets:this.state.getWebSockets?.().length??0});
    return json({error:'NOT_FOUND'},404);
  }

  async webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){
    if(typeof message!=='string'){ws.send(JSON.stringify({type:'ERROR',error:'TEXT_MESSAGES_ONLY'}));return;}
    if(message==='PING')ws.send(JSON.stringify({type:'PONG',at:new Date().toISOString()}));
  }
  async webSocketClose(ws:WebSocket,code:number,reason:string){try{ws.close(code,reason);}catch{}}
  async webSocketError(ws:WebSocket){try{ws.close(1011,'live-error');}catch{}}
}
