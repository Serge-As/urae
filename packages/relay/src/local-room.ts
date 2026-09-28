export interface EcoLocalRoomSignal {
  protocol:'ECO_LOCAL_ROOM_1';
  roomId:string;
  role:'OFFER'|'ANSWER';
  description:RTCSessionDescriptionInit;
  createdAt:string;
}
export interface EcoLocalRoomPacket {type:string;payload:unknown;sentAt:string;}

const te=new TextEncoder(),td=new TextDecoder();
const b64u=(bytes:Uint8Array)=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
const unb64u=(v:string)=>{const n=v.replaceAll('-','+').replaceAll('_','/'),p=n+'='.repeat((4-n.length%4)%4),raw=atob(p),o=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)o[i]=raw.charCodeAt(i);return o;};
const hex=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const roomId=()=>hex(crypto.getRandomValues(new Uint8Array(6)));
const hash16=async(v:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(v)))).slice(0,16);
const waitIce=(pc:RTCPeerConnection,timeoutMs=8000)=>new Promise<void>((resolve)=>{
  if(pc.iceGatheringState==='complete')return resolve();
  const done=()=>{pc.removeEventListener('icegatheringstatechange',check);clearTimeout(timer);resolve();};
  const check=()=>{if(pc.iceGatheringState==='complete')done();};
  const timer=setTimeout(done,timeoutMs);pc.addEventListener('icegatheringstatechange',check);
});
const waitOpen=(channel:RTCDataChannel,timeoutMs=12000)=>new Promise<void>((resolve,reject)=>{
  if(channel.readyState==='open')return resolve();
  const timer=setTimeout(()=>reject(Error('ECO_LOCAL_ROOM_OPEN_TIMEOUT')),timeoutMs);
  channel.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
  channel.addEventListener('error',()=>{clearTimeout(timer);reject(Error('ECO_LOCAL_ROOM_CHANNEL_ERROR'));},{once:true});
});
export const ecoLocalRoomSupported=()=>typeof RTCPeerConnection!=='undefined';

export class EcoLocalRoomPeer {
  private pc?:RTCPeerConnection;
  private channel?:RTCDataChannel;
  private _roomId='';
  private listeners=new Set<(packet:EcoLocalRoomPacket)=>void>();
  onPacket(listener:(packet:EcoLocalRoomPacket)=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  get roomId(){return this._roomId;}
  get connected(){return this.channel?.readyState==='open';}
  private makePc(){
    if(!ecoLocalRoomSupported())throw Error('ECO_LOCAL_ROOM_WEBRTC_UNAVAILABLE');
    const pc=new RTCPeerConnection({iceServers:[]});
    pc.addEventListener('connectionstatechange',()=>{if(['failed','closed'].includes(pc.connectionState))this.close();});
    this.pc=pc;return pc;
  }
  private wire(channel:RTCDataChannel){
    channel.binaryType='arraybuffer';channel.addEventListener('message',event=>{
      try{const raw=typeof event.data==='string'?event.data:td.decode(new Uint8Array(event.data)),packet=JSON.parse(raw) as EcoLocalRoomPacket;if(packet?.type)for(const listener of this.listeners)listener(packet);}catch{}
    });
    this.channel=channel;
  }
  async createOffer():Promise<string>{
    const pc=this.makePc();this._roomId=roomId();const channel=pc.createDataChannel('eco-local',{ordered:true});this.wire(channel);
    await pc.setLocalDescription(await pc.createOffer());await waitIce(pc);
    return encodeLocalRoomSignal({protocol:'ECO_LOCAL_ROOM_1',roomId:this._roomId,role:'OFFER',description:pc.localDescription!,createdAt:new Date().toISOString()});
  }
  async acceptOffer(encoded:string):Promise<string>{
    const signal=decodeLocalRoomSignal(encoded);if(signal.role!=='OFFER')throw Error('ECO_LOCAL_ROOM_OFFER_REQUIRED');this._roomId=signal.roomId;
    const pc=this.makePc();pc.addEventListener('datachannel',event=>this.wire(event.channel),{once:true});await pc.setRemoteDescription(signal.description);await pc.setLocalDescription(await pc.createAnswer());await waitIce(pc);
    return encodeLocalRoomSignal({protocol:'ECO_LOCAL_ROOM_1',roomId:this._roomId,role:'ANSWER',description:pc.localDescription!,createdAt:new Date().toISOString()});
  }
  async acceptAnswer(encoded:string):Promise<void>{
    const signal=decodeLocalRoomSignal(encoded);if(signal.role!=='ANSWER'||signal.roomId!==this._roomId)throw Error('ECO_LOCAL_ROOM_ANSWER_MISMATCH');if(!this.pc)throw Error('ECO_LOCAL_ROOM_NOT_STARTED');
    await this.pc.setRemoteDescription(signal.description);
  }
  async waitUntilOpen(timeoutMs=12000){if(!this.channel)throw Error('ECO_LOCAL_ROOM_CHANNEL_MISSING');await waitOpen(this.channel,timeoutMs);}
  send(type:string,payload:unknown){
    if(!this.channel||this.channel.readyState!=='open')throw Error('ECO_LOCAL_ROOM_NOT_CONNECTED');
    this.channel.send(JSON.stringify({type,payload,sentAt:new Date().toISOString()} satisfies EcoLocalRoomPacket));
  }
  close(){try{this.channel?.close();}catch{}try{this.pc?.close();}catch{}this.channel=undefined;this.pc=undefined;}
}

export function encodeLocalRoomSignal(signal:EcoLocalRoomSignal):string{
  return 'ECOLR1:'+b64u(te.encode(JSON.stringify(signal)));
}
export function decodeLocalRoomSignal(raw:string):EcoLocalRoomSignal{
  if(!raw.startsWith('ECOLR1:'))throw Error('ECO_LOCAL_ROOM_SIGNAL_INVALID');
  let value:any;try{value=JSON.parse(td.decode(unb64u(raw.slice(7))));}catch{throw Error('ECO_LOCAL_ROOM_SIGNAL_INVALID');}
  if(value?.protocol!=='ECO_LOCAL_ROOM_1'||!value.roomId||!['OFFER','ANSWER'].includes(value.role)||!value.description?.type||!value.description?.sdp)throw Error('ECO_LOCAL_ROOM_SIGNAL_INVALID');
  return value as EcoLocalRoomSignal;
}

export async function encodeLocalRoomSignalFrames(signal:string,chunkChars=165):Promise<string[]>{
  if(!signal.startsWith('ECOLR1:'))throw Error('ECO_LOCAL_ROOM_SIGNAL_INVALID');const id=roomId(),digest=await hash16(signal),encoded=b64u(te.encode(signal)),chunks:string[]=[];
  for(let i=0;i<encoded.length;i+=chunkChars)chunks.push(encoded.slice(i,i+chunkChars));if(chunks.length>999)throw Error('ECO_LOCAL_ROOM_SIGNAL_TOO_LARGE');
  return chunks.map((chunk,index)=>'ECOLRS1:'+id+':'+(index+1)+':'+chunks.length+':'+digest+':'+chunk);
}
export class EcoLocalRoomSignalReceiver {
  private id='';private total=0;private digest='';private frames=new Map<number,string>();
  add(raw:string){const m=/^ECOLRS1:([a-f0-9]{12}):(\d{1,3}):(\d{1,3}):([a-f0-9]{16}):([A-Za-z0-9_-]+)$/.exec(raw.trim());if(!m)throw Error('ECO_LOCAL_ROOM_FRAME_INVALID');
    const index=Number(m[2]),total=Number(m[3]);if(index<1||index>total)throw Error('ECO_LOCAL_ROOM_FRAME_INVALID');
    if(!this.id){this.id=m[1]!;this.total=total;this.digest=m[4]!;}if(this.id!==m[1]||this.total!==total||this.digest!==m[4])return{accepted:false,received:this.frames.size,total:this.total,complete:false};
    this.frames.set(index,m[5]!);return{accepted:true,received:this.frames.size,total:this.total,complete:this.frames.size===this.total};}
  async assemble(){if(!this.id||this.frames.size!==this.total)throw Error('ECO_LOCAL_ROOM_SIGNAL_INCOMPLETE');let encoded='';for(let i=1;i<=this.total;i++)encoded+=this.frames.get(i)??'';const signal=td.decode(unb64u(encoded));if(await hash16(signal)!==this.digest)throw Error('ECO_LOCAL_ROOM_SIGNAL_DIGEST_MISMATCH');decodeLocalRoomSignal(signal);return signal;}
  reset(){this.id='';this.total=0;this.digest='';this.frames.clear();}
}
