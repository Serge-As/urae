// Launch Studio owns this device-only preparation state. This is never a
// second group, membership, identity proof or financial authority.
export const LAUNCH_GUIDE_VERSION='kit-guide-20261022-v1';
const MAX_BYTES=300*1024;
const safeId=v=>typeof v==='string'&&v.length>0&&v.length<=240;
export function createLaunchDraftStore({storage,scope,now=()=>Date.now()}={}){
  const key=kind=>{const s=scope?.();return safeId(s?.actor)&&safeId(s?.tenant)?'eco.launch.v1.'+kind+':'+JSON.stringify([s.tenant,s.actor]):null;};
  const read=kind=>{const k=key(kind);if(!k)return null;const raw=storage.getItem(k);if(!raw)return null;if(raw.length>MAX_BYTES)throw Error('LAUNCH_DRAFT_TOO_LARGE');const d=JSON.parse(raw);if(d?.schema!==1||d.guideVersion!==LAUNCH_GUIDE_VERSION)throw Error('LAUNCH_DRAFT_VERSION');return d;};
  const put=(kind,data)=>{const k=key(kind);if(!k)throw Error('LAUNCH_DRAFT_ACCOUNT_REQUIRED');const raw=JSON.stringify({...data,schema:1,guideVersion:LAUNCH_GUIDE_VERSION,updatedAt:now()});if(new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('LAUNCH_DRAFT_TOO_LARGE');storage.setItem(k,raw);};
  return{
    load:()=>read('draft'),
    save:(payload,expectedRevision)=>{const prior=read('draft');if((prior?.revision??0)!==expectedRevision)throw Error('LAUNCH_DRAFT_CONFLICT');const revision=expectedRevision+1;put('draft',{payload,revision});return revision;},
    clear:()=>{const k=key('draft');if(k)storage.removeItem(k);},
    pending:()=>read('creation'),
    rememberCreation:(projectId,kit)=>{if(!safeId(projectId))throw Error('LAUNCH_PROJECT_REQUIRED');const prior=read('creation');if(prior?.projectId!==undefined&&prior.projectId!==projectId&&!prior.completedGroupId)throw Error('LAUNCH_CREATION_PENDING');put('creation',{projectId,kit:prior?.projectId===projectId?prior.kit:kit,startedAt:prior?.startedAt??now()});},
    completeCreation:groupId=>{if(!safeId(groupId))throw Error('LAUNCH_GROUP_REQUIRED');const prior=read('creation');if(prior)put('creation',{...prior,completedGroupId:groupId});const k=key('draft');if(k)storage.removeItem(k);},
    markKitSaved:groupId=>{const prior=read('creation');if(prior?.completedGroupId!==groupId)throw Error('LAUNCH_CREATION_CONTEXT_CHANGED');put('creation',{...prior,kitSaved:true});},
    // A completed receipt prevents this draft being proposed for creation again.
    acknowledgeCompleted:()=>{const p=read('creation');if(p&&!p.completedGroupId)throw Error('LAUNCH_CREATION_PENDING');const k=key('creation');if(k)storage.removeItem(k);}
  };
}

export function findLaunchNameResemblances(rubrics){
  const names=new Map();
  for(const r of rubrics??[])for(const p of r.participants??[]){
    const name=String(p.name??'').trim(),normalized=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    if(!normalized)continue;const rows=names.get(normalized)??[];rows.push({name,personKey:p.key,rubricKey:r.key,rubricName:r.name});names.set(normalized,rows);
  }
  return [...names.values()].filter(rows=>rows.length>1);
}

export function assessLaunchSteps({fields={},rubrics=[]}={}){
  const out=Array.from({length:10},(_,i)=>({step:i+1,state:'INCOMPLETE',notes:[]}));
  const set=(i,ok,notes=[],bad=false)=>{out[i-1]={step:i,state:bad?'INCONSISTENT':ok?'COMPLETE':'INCOMPLETE',notes};};
  const get=id=>String(fields[id]?.value??'').trim();
  const positive=id=>Number.isSafeInteger(Number(get(id)))&&Number(get(id))>0;
  set(1,['NEW','IMPORT_EXISTING','TRANSFORM_REGISTERED'].includes(get('launchOrigin'))&&(get('launchOrigin')!=='TRANSFORM_REGISTERED'||Boolean(get('sourceGroupId'))));
  set(2,Boolean(get('projectName'))&&['association','rotating_tontine'].includes(get('groupKind')));
  set(3,Boolean(get('governanceModel')));
  set(4,Boolean(get('cycleStartsAt'))&&Boolean(get('cycleCadence'))&&positive('cycleExpectedSessions'));
  set(5,positive('expectedMembers')&&Boolean(get('rosterMode')));
  set(6,rubrics.length>0&&rubrics.every(r=>r.name&&r.kind));
  set(7,false); // Only the canonical simulator can qualify feasibility.
  set(8,['channelInApp','channelPrint','channelSms','channelWhatsapp','channelTelegram'].some(id=>fields[id]?.checked));
  set(9,['fr','en'].includes(get('projectLocale')));
  set(10,false); // Reading and adoption must be confirmed again after recovery.
  const names=findLaunchNameResemblances(rubrics);if(names.length)out[4].notes.push('POSSIBLE_NAMESAKE');
  if(get('cycleExpectedSessions')&&(!positive('cycleExpectedSessions'))){out[3].state='INCONSISTENT';out[3].notes.push('INVALID_SESSION_COUNT');}
  if(get('expectedMembers')&&!positive('expectedMembers'))out[4].state='INCONSISTENT';
  return out;
}
