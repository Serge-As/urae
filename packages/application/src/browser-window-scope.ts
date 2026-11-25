/** A window label selects an HttpOnly server cookie; it is never a credential.
 * Reload retains the label. An opener/duplicated tab cannot share a live label.
 */
export interface BrowserWindowScope {id:string|undefined;ready:Promise<void>;}
const scopes=new WeakMap<Window,BrowserWindowScope>();
const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
export function browserWindowScope():BrowserWindowScope{
  if(typeof window==='undefined'||typeof sessionStorage==='undefined')return{id:undefined,ready:Promise.resolve()};
  const existing=scopes.get(window);if(existing)return existing;
  let saved:string|null=null;try{saved=sessionStorage.getItem('eco.window.session.v1');}catch{}
  const scope:BrowserWindowScope={id:saved&&/^[a-f0-9]{32}$/.test(saved)&&window.name==='eco-window:'+saved?saved:randomId(),ready:Promise.resolve()};
  const persist=()=>{try{sessionStorage.setItem('eco.window.session.v1',scope.id!);window.name='eco-window:'+scope.id;}catch{}};
  persist();scopes.set(window,scope);
  let ready!:()=>void;scope.ready=new Promise<void>(resolve=>{ready=resolve;});
  // Web Locks gives a live window exclusive ownership even if another tab
  // cloned both sessionStorage and window.name. No network/D1 polling.
  if(typeof navigator!=='undefined'&&navigator.locks?.request){
    const claim=()=>{void navigator.locks.request('eco-window-session:'+scope.id,{ifAvailable:true},async lock=>{
      if(!lock){scope.id=randomId();persist();claim();return;}
      ready();await new Promise<void>(release=>window.addEventListener('pagehide',()=>release(),{once:true}));
    }).catch(()=>ready());};claim();
  }else if(typeof BroadcastChannel==='function'){
    const channel=new BroadcastChannel('eco-window-session.v1'),instance=randomId();let settled=false;
    channel.onmessage=event=>{const data=event.data;if(data?.scope!==scope.id||data?.instance===instance)return;
      if(data.type==='OWNED'&&!settled||data.type==='PROBE'&&!settled&&String(data.instance)<instance){scope.id=randomId();persist();}
      else if(data.type==='PROBE')channel.postMessage({type:'OWNED',scope:scope.id,instance});
    };
    channel.postMessage({type:'PROBE',scope:scope.id,instance});
    setTimeout(()=>{settled=true;ready();},100);
    window.addEventListener('pagehide',()=>channel.close(),{once:true});
  }else ready();
  return scope;
}
