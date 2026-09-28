const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
export const dashboardCard=(x)=>{
 const required=['id','label','owner','formula','unit','period','asOf','freshness','permission','proof','computedAt','sourceVersion','lastSyncedAt','pendingCount','scope','availability'];for(const k of required)if(x[k]===undefined)throw Error('DASHBOARD_CARD_'+k.toUpperCase()+'_REQUIRED');
 return{actual:null,forecast:null,...x};
};
const val=x=>x===null||x===undefined?'Indisponible':typeof x==='number'?new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(x):String(x);
export function mountRoleDashboardsUI({app,getGroups=()=>[],getMembers=()=>[],getMeetings=()=>[],isManager=()=>false,navigate=()=>{},showError=()=>{}}={}){
 const host=document.querySelector('#view-dashboard');if(!host||document.getElementById('roleDashboardsCenter'))return{refresh:async()=>{},open:()=>{}};
 const root=el('section',undefined,'panel');root.id='roleDashboardsCenter';root.append(el('div','Command Center · contrat de métriques','eyebrow'),el('h2','Dashboards par profil'),el('p','Chaque carte indique sa source, sa formule, sa période, sa fraîcheur et sa permission. Une donnée indisponible reste « Indisponible » et n’est jamais remplacée par zéro.','truth-notice'));
 const tabs=el('div',undefined,'view-switch compact'),cards=el('div',undefined,'metrics'),proofs=el('div',undefined,'stack');root.append(tabs,cards,proofs);const cockpit=document.querySelector('#personalCockpitPanel');cockpit?.insertAdjacentElement('afterend',root);
 const roles=[['MEMBER','Membre'],['MANAGER','Gestionnaire'],['PARTNER','Partenaire'],['ADVERTISER','Annonceur'],['SUPERADMIN','Superadmin'],['MAINTENANCE','Maintenance']];let active=isManager()?'MANAGER':'MEMBER';
 for(const [id,label] of roles){const b=el('button',label,id===active?'active':'');b.type='button';b.dataset.dashboardRole=id;b.onclick=()=>{active=id;for(const x of tabs.querySelectorAll('button'))x.classList.toggle('active',x===b);void refresh();};tabs.append(b);}
 const make=(label,actual,owner,formula,unit,permission,proof,{period='CURRENT',forecast=null,meta=null}={})=>{
   const computedAt=meta?.computedAt??null,availability=meta?.availability??(permission==='UNAVAILABLE'?'UNAVAILABLE':'UNKNOWN');
   return dashboardCard({id:label.toLowerCase().replace(/\W+/g,'-'),label,actual,forecast,owner,formula,unit,period,asOf:computedAt,freshness:availability,permission,proof,computedAt,sourceVersion:meta?.sourceVersion??null,lastSyncedAt:meta?.lastSyncedAt??null,pendingCount:Number(meta?.pendingCount??0),scope:meta?.scope??null,availability,source:meta?.source??null});
 };
 const load=async()=>{
   const groupId=app.activeGroup(),groups=getGroups(),members=getMembers(),meetings=getMeetings(),manage=isManager(),me=members.find(x=>x.userId===app.currentActor()),out=[],enc=groupId?encodeURIComponent(groupId):'';
   const readMeta=async path=>typeof app.projectionMeta==='function'?await app.projectionMeta(path).catch(()=>null):null;
   const [groupsMeta,membersMeta,meetingsMeta,inboxMeta]=await Promise.all([readMeta('/api/v1/groups'),groupId?readMeta('/api/v1/groups/'+enc+'/members'):null,groupId?readMeta('/api/v1/groups/'+enc+'/meetings'):null,readMeta('/api/v1/inbox')]);
   if(active==='MEMBER'){
     out.push(make('Groupes accessibles',groups.length,'Membership','count(groups visible)','groupes','ALLOWED','membership:list',{meta:groupsMeta}));
     out.push(make('Séances ouvertes',groupId?meetings.filter(x=>x.status==='open').length:null,'Meeting','count(status=open)','séances',groupId?'ALLOWED':'UNAVAILABLE','meeting:list',{meta:meetingsMeta}));
     const inbox=await app.inboxItems().catch(()=>null);out.push(make('Actions personnelles',inbox?inbox.filter(x=>!groupId||x.groupId===groupId).length:null,'Universal Inbox','count(open actor items)','actions',inbox?'ALLOWED':'UNAVAILABLE','inbox:actor',{meta:inboxMeta}));
     if(groupId&&me){const sheet=await app.memberOperationalSheet(me.id).catch(()=>null);const sheetMeta=await readMeta('/api/v1/groups/'+enc+'/members/'+encodeURIComponent(me.id)+'/operational-sheet');out.push(make('Situation nette personnelle',sheet?.statement?.totalNetContributions??null,'Operational Cockpit','member statement net contributions','XAF',sheet?'ALLOWED':'UNAVAILABLE','member-sheet:'+me.id,{meta:sheetMeta}));}
     else out.push(make('Situation nette personnelle',null,'Operational Cockpit','member statement net contributions','XAF','UNAVAILABLE','member-sheet:none'));
   }else if(active==='MANAGER'){
     const [ledger,quiet,ledgerMeta,quietMeta]=await Promise.all([groupId&&manage?app.ledger().catch(()=>null):null,groupId&&manage?app.quietWatch().catch(()=>null):null,groupId&&manage?readMeta('/api/v1/groups/'+enc+'/ledger'):null,groupId&&manage?readMeta('/api/v1/groups/'+enc+'/quiet-watch'):null]);
     out.push(make('Membres actifs',groupId?members.filter(x=>x.status==='active').length:null,'Membership','count(active memberships)','membres',groupId&&manage?'ALLOWED':'RESTRICTED','membership:group',{meta:membersMeta}));
     out.push(make('Séances ouvertes',groupId?meetings.filter(x=>x.status==='open').length:null,'Meeting','count(status=open)','séances',groupId&&manage?'ALLOWED':'RESTRICTED','meeting:group',{meta:meetingsMeta}));
     out.push(make('Caisse canonique',ledger?.summary?.cashBalance??null,'Ledger','sum(CASH debits - credits)','XAF',ledger?'ALLOWED':'UNAVAILABLE','ledger:summary',{meta:ledgerMeta}));
     out.push(make('Quiet Watch ouvert',quiet?quiet.filter(x=>x.data?.watchState!=='RESOLVED').length:null,'Quiet Watch','count(open watch signals)','signaux',quiet?'ALLOWED':'UNAVAILABLE','quiet-watch:list',{meta:quietMeta}));
   }else if(active==='PARTNER'){
     const programs=groupId?await app.externalPrograms().catch(()=>null):null;out.push(make('Programmes partenaires',programs?.length??null,'External Programs','count(authorized partner/NGO programs)','programmes',programs?'ALLOWED':'UNAVAILABLE','external-programs:list'));
     out.push(make('Données financières individuelles',null,'Privacy Policy','forbidden by aggregate sharing contract','interdit','FORBIDDEN','privacy:group-aggregate-only'));
   }else if(active==='ADVERTISER'){
     const ads=groupId?await app.adDashboard().catch(()=>null):null;out.push(make('Campagnes',ads?.campaigns??ads?.campaignCount??null,'AdManager','count(campaigns in authorized scope)','campagnes',ads?'ALLOWED':'UNAVAILABLE','ads:dashboard'));
     out.push(make('Impressions',ads?.impressions??null,'AdManager','sum(measured impressions)','impressions',ads?'ALLOWED':'UNAVAILABLE','ads:dashboard'));
     out.push(make('Ciblage par dette/solde',null,'Ad Privacy','forbidden','interdit','FORBIDDEN','ads:privacy'));
   }else{
     const control=await app.founderControl().catch(()=>null),authorized=Boolean(control);if(!authorized){out.push(make(active==='SUPERADMIN'?'Plateforme supervisée':'Santé technique',null,'Founder Control','founder-team-only snapshot','état','RESTRICTED','founder-control'));return out;}
     if(active==='SUPERADMIN'){out.push(make('Groupes plateforme',control.platform?.groups??null,'Founder Control','count(groups)','groupes','ALLOWED','founder-control:snapshot'));out.push(make('Plaintes ouvertes',control.platform?.openComplaints??null,'Founder Control','count(open complaints)','plaintes','ALLOWED','founder-control:snapshot'));out.push(make('Incidents ouverts',(control.incidents??[]).filter(x=>!['RESOLVED','CLOSED'].includes(x.status)).length,'Founder Control','count(open incidents)','incidents','ALLOWED','founder-control:snapshot'));}
     else{const caps=control.capabilities??[];out.push(make('Capacités FAIL',caps.filter(x=>x.health==='FAIL').length,'Founder Control','count(health=FAIL)','capacités','ALLOWED','founder-control:capabilities'));out.push(make('Capacités dégradées',caps.filter(x=>x.health==='DEGRADED').length,'Founder Control','count(health=DEGRADED)','capacités','ALLOWED','founder-control:capabilities'));out.push(make('Non vérifiées terrain',caps.filter(x=>x.fieldStage!=='FIELD_ACCEPTED').length,'Founder Control','count(fieldStage!=FIELD_ACCEPTED)','capacités','ALLOWED','founder-control:capabilities'));}
   }
   return out;
 };
 const refresh=async()=>{cards.replaceChildren();proofs.replaceChildren();try{const rows=await load();for(const r of rows){const c=el('article',undefined,'metric dashboard-contract-card');c.append(el('span',r.label),el('strong',val(r.actual)));if(r.forecast!==null)c.append(el('small','Forecast : '+val(r.forecast)));c.append(el('small','Owner : '+r.owner+' · permission : '+r.permission));cards.append(c);const p=el('article',undefined,'item');p.append(el('strong',r.label+' · preuve'),el('p','Formule : '+r.formula+' · unité : '+r.unit+' · période : '+r.period,'hint'),el('small','source '+(r.source??'inconnue')+' · calcul '+(r.computedAt??'indisponible')+' · dernière synchro '+(r.lastSyncedAt??'jamais')+' · version '+(r.sourceVersion??'n/a')+' · attente locale '+r.pendingCount+' · disponibilité '+r.availability+' · preuve '+r.proof));proofs.append(p);}}catch(e){showError(e);}};
 document.addEventListener('eco:group-context-changed',()=>void refresh());void refresh();return{refresh,open:()=>{root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
