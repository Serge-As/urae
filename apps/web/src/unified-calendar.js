const parseDate=value=>{const n=Date.parse(String(value??''));return Number.isFinite(n)?new Date(n):null;};
const explicitDate=(record)=>{
  const d=record?.data??{};
  for(const key of ['targetDate','scheduledAt','dueAt','expiresAt','nextReviewAt','validUntil','startsAt','endsAt']){
    const date=parseDate(d[key]);if(date)return{date,key};
  }
  return null;
};
export const buildUnifiedCalendar=({meetings=[],records=[],obligations=[],now=new Date()})=>{
  const events=[];
  for(const m of meetings){const date=parseDate(m.scheduledAt);if(date)events.push({id:'meeting:'+m.id,entityId:m.id,kind:'meeting',title:m.title||'Séance',at:date.toISOString(),status:String(m.status??''),source:'MEETING'});}
  for(const r of records){const hit=explicitDate(r);if(!hit)continue;events.push({id:'record:'+r.id+':'+hit.key,entityId:r.id,kind:'record',title:r.title||r.moduleId||'Échéance',at:hit.date.toISOString(),status:String(r.status??''),source:String(r.moduleId??'WORKSPACE'),dateField:hit.key});}
  for(const o of obligations){const date=parseDate(o.dueAt);if(!date)continue;events.push({id:'obligation:'+o.id,entityId:o.id,kind:'obligation',title:o.title||'Échéance',at:date.toISOString(),status:String(o.status??''),source:String(o.sourceType??'OBLIGATION'),dateField:'dueAt'});}
  const seen=new Set(),unique=events.filter(e=>{const k=[e.kind,e.entityId,e.at,e.source].join('|');if(seen.has(k))return false;seen.add(k);return true;});
  unique.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.title.localeCompare(b.title,'fr'));
  const t=now.getTime();return{all:unique,upcoming:unique.filter(x=>Date.parse(x.at)>=t),past:unique.filter(x=>Date.parse(x.at)<t)};
};
