import type {PlatformRepository} from '../../../packages/repositories/src/index.js';
import type {PlatformKernel} from '../../../packages/platform-kernel/src/index.js';
import type {ReminderResolver} from '../../../packages/notifications/src/index.js';
import {BusinessStudioService} from '../../../packages/business-studio/src/index.js';
import {caseCareAdapter} from './care.js';

/** Read adapter only: each canonical owner authorizes its own current source. */
export function productiveReminderResolver(repo:PlatformRepository,kernel:PlatformKernel):ReminderResolver{
 const business=new BusinessStudioService(repo,kernel),care=caseCareAdapter(repo,kernel),en=kernel.context.get().locale?.startsWith('en');
 return async target=>{
  if(target.kind==='PLAN_STEP'){
   const plan=await business.launchPlan(target.id),step=plan.steps.find(s=>s.id===target.partId);
   if(plan.state!=='ACTIVE'||!step||['REPORTED','EVIDENCE_LINKED'].includes(step.state))return null;
   return{title:(en?'My milestone: ':'Mon jalon : ')+step.title,dueAt:step.dueAt,anchor:JSON.stringify([plan.id,step.id,step.dueAt,step.version]),action:{view:'ecosystem',anchor:'productiveCommunityCenter',entityId:plan.id}};
  }
  if(target.kind==='JOB_SLOT'||target.kind==='JOB_DEADLINE'){
   const job=await business.job(target.id);if(job.state!=='PUBLISHED')return null;
   const own=job.applications.find(a=>a.actorId===kernel.context.get().actorId&&!['WITHDRAWN','REJECTED'].includes(a.state));
   if(target.kind==='JOB_DEADLINE'){
    if(!own&&!job.owner)return null;return{title:en?'Employment application deadline':'Échéance de candidature',dueAt:String(job.deadline),anchor:JSON.stringify([job.id,job.deadline,own?.id??'owner',own?.state??'owner']),action:{view:'ecosystem',anchor:'productiveCommunityCenter',entityId:job.id}};
   }
   const slot=job.slots.find(s=>s.id===target.partId&&(s.myBooking||job.owner&&s.applicationId));if(!slot)return null;
   return{title:en?'My confirmed interview':'Mon entretien confirmé',dueAt:slot.at,anchor:JSON.stringify([job.id,slot.id,slot.at,slot.applicationId??own?.id]),action:{view:'ecosystem',anchor:'productiveCommunityCenter',entityId:job.id}};
  }
  const {record}=await care.detail(target.id),state=record.care;
  if(['RESOLVED','CLOSED'].includes(record.status)||!state?.indicativeDueAt||state.waitingFor==='NONE')return null;
  return{title:en?'My Eco Care next step':'Ma prochaine étape Eco Care',dueAt:state.indicativeDueAt,anchor:JSON.stringify([record.id,state.indicativeDueAt,state.nextAction,state.waitingFor]),action:{view:'inbox',anchor:'ecoCarePanel',entityId:record.id}};
 };
}
