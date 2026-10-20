// Observation only. This component cannot allow, reject, retry or publish a command.
export const REQUEST_CATEGORIES = ['secondary-read','financial-read','live-control','authentication','write','other-read'] as const;
type Category = typeof REQUEST_CATEGORIES[number];
export interface RequestBudgetToken { epoch:number; category:Category; started:number; }
interface Counts { calls:number; networkRequests:number; coalesced:number; localResponses:number; failures:number; completed:number; durationMs:number; decodedJsonBytes:number; }
const empty = ():Counts => ({calls:0,networkRequests:0,coalesced:0,localResponses:0,failures:0,completed:0,durationMs:0,decodedJsonBytes:0});
const secondaryPath = (path:string):boolean => /^\/api\/v1\/(?:product\/capabilities|universe|workspaces)(?:\?[^#]*)?$/.test(path)||/^\/api\/v1\/groups\/[^/?#]+\/concierge\/profile$/.test(path);
export function canCoalesceSecondaryRead(path:string,init:RequestInit={}):boolean {
  return String(init.method??'GET').toUpperCase()==='GET'&&Object.keys(init).every(k=>k==='method')&&secondaryPath(path);
}
function category(path:string,method:string):Category {
  if(path.startsWith('/api/v1/auth/'))return 'authentication';
  if(/\/(?:live|financial-clock-anchor)(?:\/|\?|$)/.test(path))return 'live-control';
  if(method!=='GET')return 'write';
  if(secondaryPath(path))return 'secondary-read';
  if(/\/(?:ledger|financial[^/]*|loans|expenses|recap|statement|member-envelope)(?:\/|\?|$)/.test(path))return 'financial-read';
  return 'other-read';
}
export class RequestBudgetMonitor {
  private enabled=false;
  private epoch=0;
  private scope='';
  private startedAt='';
  private stoppedAt='';
  private networkBudget=100;
  private rows=new Map<Category,Counts>(REQUEST_CATEGORIES.map(k=>[k,empty()]));
  syncScope(scope:string):void { if(scope!==this.scope){this.scope=scope;this.reset(false);} }
  reset(enabled=false,budget=100):void {
    this.epoch++;this.enabled=enabled;this.networkBudget=Number.isSafeInteger(budget)&&budget>=1&&budget<=10000?budget:100;
    this.startedAt=enabled?new Date().toISOString():'';this.stoppedAt='';
    this.rows=new Map(REQUEST_CATEGORIES.map(k=>[k,empty()]));
  }
  stop():void {this.enabled=false;this.stoppedAt=new Date().toISOString();}
  start(path:string,method:string):RequestBudgetToken|null {
    if(!this.enabled)return null;
    const kind=category(path,method);this.rows.get(kind)!.calls++;
    return{epoch:this.epoch,category:kind,started:Date.now()};
  }
  private row(token:RequestBudgetToken|null):Counts|undefined {return token?.epoch===this.epoch?this.rows.get(token.category):undefined;}
  network(token:RequestBudgetToken|null):void {const r=this.row(token);if(r)r.networkRequests++;}
  coalesced(token:RequestBudgetToken|null):void {const r=this.row(token);if(r)r.coalesced++;}
  local(token:RequestBudgetToken|null):void {const r=this.row(token);if(r)r.localResponses++;}
  json(token:RequestBudgetToken|null,body:unknown):void {
    const r=this.row(token);if(!r)return;
    // This is the decoded JSON size, never an estimate of compressed/billed traffic.
    try{r.decodedJsonBytes+=new TextEncoder().encode(JSON.stringify(body)).byteLength;}catch{}
  }
  finish(token:RequestBudgetToken|null,ok:boolean):void {
    const r=this.row(token);if(!r||!token)return;r.completed++;if(!ok)r.failures++;r.durationMs+=Math.max(0,Date.now()-token.started);
  }
  snapshot(){
    const rows=REQUEST_CATEGORIES.map(k=>({category:k,...this.rows.get(k)!})),totals=empty();
    for(const r of rows)for(const k of Object.keys(totals) as (keyof Counts)[])totals[k]+=r[k];
    return{schema:'ECO_REQUEST_BUDGET_V1',enabled:this.enabled,startedAt:this.startedAt,stoppedAt:this.stoppedAt,networkBudget:this.networkBudget,
      overBudget:totals.networkRequests>this.networkBudget,pending:totals.calls-totals.completed,totals,rows,
      limits:{scope:'current-window-and-context',transport:'application-http-only',volume:'decoded-json-bytes',providerBilling:false,containsPayloads:false}};
  }
}
