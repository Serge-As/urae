// Voluntary, local snapshots of freshly reauthorized canonical jobs and plans.
// A downloaded file has no channel back to Eco and never changes a business state.
const text=value=>String(value??'').replace(/\r\n|\r/g,'\n').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
const stamp=value=>{const time=Date.parse(value);if(!Number.isFinite(time))throw Error('INVALID_CALENDAR_DATE');return new Date(time).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');};
function fold(line){const encoder=new TextEncoder();let part='',size=0,out=[];for(const char of line){const length=encoder.encode(char).length;if(size+length>75){out.push(part);part=' ';size=1;}part+=char;size+=length;}out.push(part);return out.join('\r\n');}
async function uid(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('')+'@eco.local';}
export async function createProductiveCalendar(kind,record,{actorId,now=new Date().toISOString(),language='fr'}={}){
 const en=language==='en',events=[];
 const add=(key,title,at,description,alarm)=>{if(Date.parse(at)>Date.parse(now))events.push({key,title,at,description,alarm});};
 if(kind==='JOB'){
  if(!['PUBLISHED'].includes(record.state))throw Error('CALENDAR_JOB_NOT_ACTIVE');
  const own=record.applications?.find(a=>a.actorId===actorId&&a.state!=='WITHDRAWN'&&a.state!=='REJECTED');
  if(!record.owner&&!own)throw Error('CALENDAR_JOB_PARTY_REQUIRED');
  for(const s of record.slots??[])if(s.myBooking||record.owner&&s.applicationId)add('job:'+record.id+':interview:'+s.id,(en?'Interview · ':'Entretien · ')+record.title,s.at,en?'Confirmed in Eco when exported. Recheck the current record before attending.':'Confirmé dans Eco à cet export. Relire le dossier avant le rendez-vous.','-PT15M');
  if(!record.owner&&own)add('job:'+record.id+':deadline',(en?'Application deadline · ':'Échéance de candidature · ')+record.title,record.deadline,en?'This snapshot does not report an interview, recruitment or payment as completed.':'Cette copie ne confirme ni entretien réalisé, ni recrutement, ni paiement.','-P1D');
 }else if(kind==='PLAN'){
  if(record.state!=='ACTIVE'||record.private!==true)throw Error('CALENDAR_PLAN_NOT_ACTIVE');
  for(const s of record.steps??[])if(!['REPORTED','EVIDENCE_LINKED'].includes(s.state))add('plan:'+record.id+':step:'+s.id,s.title,s.dueAt,en?'Personal milestone. Recheck the current plan. No contract or funding is changed.':'Jalon personnel. Relire le parcours actuel. Aucun contrat ou financement modifié.','-P1D');
 }else throw Error('INVALID_CALENDAR_KIND');
 if(!events.length||events.length>50)throw Error('CALENDAR_NO_UPCOMING_EVENT');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Eco-System//Voluntary productive calendar//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const e of events){if(String(e.title).length>500||String(e.key).length>800)throw Error('CALENDAR_EVENT_TOO_LONG');lines.push('BEGIN:VEVENT','UID:'+await uid(e.key),'DTSTAMP:'+stamp(now),'DTSTART:'+stamp(e.at),'DURATION:PT30M','SUMMARY:'+text(e.title),'DESCRIPTION:'+text(e.description),'CLASS:PRIVATE','TRANSP:TRANSPARENT','BEGIN:VALARM','TRIGGER:'+e.alarm,'ACTION:DISPLAY','DESCRIPTION:'+text(e.title),'END:VALARM','END:VEVENT');}
 lines.push('END:VCALENDAR');return{content:lines.map(fold).join('\r\n')+'\r\n',eventCount:events.length,filename:'eco-'+kind.toLowerCase()+'-calendar.ics',snapshotAt:now,automaticSync:false};
}
export function downloadProductiveCalendar(result){const url=URL.createObjectURL(new Blob([result.content],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=result.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
