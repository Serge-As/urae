import {WebSocketServer} from 'ws';
import {GroupLiveHub} from '../.build/workers/api/src/group-live-hub.js';

// Development/test transport for the production hub. Financial requests still
// pass through worker.fetch and SQLiteD1; no financial authority is emulated.
export function createLocalLiveNamespace(env={}){
  const channels=new Map();
  const get=id=>{
    if(channels.has(id))return channels.get(id);
    const values=new Map(),sockets=new Set();let alarmTimer,alarmAt=null;
    const state={
      storage:{
        getAlarm:async()=>alarmAt,deleteAlarm:async()=>{clearTimeout(alarmTimer);alarmAt=null;},
        setAlarm:async at=>{clearTimeout(alarmTimer);alarmAt=at;alarmTimer=setTimeout(()=>{alarmAt=null;void hub.alarm();},Math.max(1,at-Date.now()));alarmTimer.unref?.();},
        get:async key=>structuredClone(values.get(key)),
        put:async(key,value)=>{values.set(key,structuredClone(value));},
        delete:async key=>values.delete(key),
        list:async({prefix='',startAfter='',limit=1000}={})=>new Map([...values].filter(([k])=>k.startsWith(prefix)&&k>startAfter).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]))
      },
      acceptWebSocket:(socket,tags)=>{socket.tags=tags;sockets.add(socket);},
      getWebSockets:tag=>[...sockets].filter(ws=>ws.readyState===1&&(!tag||ws.tags.includes(tag))),
      createWebSocketPair:()=>{
        const queued=[];let transport=null,attachment;
        const server={readyState:1,tags:[],send:message=>{if(transport)transport.send(message);else queued.push(message);},
          close:(code,reason)=>{server.readyState=3;sockets.delete(server);transport?.close(code,reason);},
          serializeAttachment:value=>{attachment=value;},deserializeAttachment:()=>attachment};
        const client={attach:ws=>{
          transport=ws;for(const message of queued)ws.send(message);queued.length=0;
          ws.on('message',(data,binary)=>void hub.webSocketMessage(server,binary?data.buffer:String(data)));
          ws.on('close',()=>{server.readyState=3;sockets.delete(server);});
          ws.on('error',()=>void hub.webSocketError(server));
        }};
        return{0:client,1:server};
      },
      upgradeWebSocket:client=>{
        // Node's Response disallows 101. This local response is consumed by the
        // upgrade handler below, never returned as a regular HTTP response.
        const response=new Response(null);Object.defineProperty(response,'status',{value:101});
        response.webSocket=client;return response;
      }
    };
    const hub=new GroupLiveHub(state,env);channels.set(id,hub);return hub;
  };
  return{idFromName:name=>name,get};
}

export function attachLocalLiveUpgrades(server,handleRequest,allowedHost){
  const transport=new WebSocketServer({noServer:true,maxPayload:16384});
  server.on('upgrade',async(req,socket,head)=>{
    socket.on('error',()=>{});
    try{
      if(!allowedHost(req.headers.host)||!/^\/api\/v1\/groups\/[^/]+\/live\/connect(?:\?|$)/.test(req.url??''))throw Error('FORBIDDEN');
      const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
      headers.set('cf-connecting-ip',req.socket.remoteAddress??'local');
      const response=await handleRequest(new Request('http://'+req.headers.host+req.url,{headers}));
      if(response.status!==101||!response.webSocket){socket.end('HTTP/1.1 '+response.status+' Rejected\r\nConnection: close\r\n\r\n');return;}
      transport.handleUpgrade(req,socket,head,ws=>response.webSocket.attach(ws));
    }catch{socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');}
  });
}
