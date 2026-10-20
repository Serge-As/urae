// Presentation contracts only. Business owners retain authorization and writes.
export const ASSISTANT_TOOL_VERSION=1;
export const assistantScope=c=>JSON.stringify([c?.actor||'',c?.tenant||'',c?.group||'']);
const views=new Set(['dashboard','assistant','sessions','members','operations','finance','discovery','ecosystem','documents','settings','services','launch','inbox']);
const topics=new Set(['resume','meeting','commerce','opportunity','risk','governance','paper','community','finance','founder','search','negotiation']);
export function validateAssistantAction(tool,{context,getContext,modules=[],origin='USER'}={}){
 if(origin!=='USER'||tool?.version!==ASSISTANT_TOOL_VERSION)throw Error('ASSISTANT_UNTRUSTED_ACTION');
 const current=getContext();
 if(!context?.actor||assistantScope(context)!==assistantScope(current))throw Error('ASSISTANT_CONTEXT_CHANGED');
 if(Object.keys(tool).some(k=>!['version','kind','view','moduleId','anchor'].includes(k)))throw Error('ASSISTANT_UNKNOWN_ARGUMENT');
 if(tool.kind==='NAVIGATE'){if(!views.has(tool.view)||tool.anchor&&!/^[a-zA-Z][\w-]{0,79}$/.test(tool.anchor))throw Error('ASSISTANT_UNKNOWN_TARGET');}
 else if(tool.kind==='MODULE'){const m=modules.find(m=>m.id===tool.moduleId);if(!m||!['FOUNDATION_ACTIVE','ACTIVE','BETA_OPEN','BETA'].includes(m.status))throw Error('ASSISTANT_SERVICE_UNAVAILABLE');}
 else if(tool.kind==='FINANCE_DRAFT'){if(!context.group||context.role!=='manager'||current.role!=='manager')throw Error('ASSISTANT_MANAGER_REQUIRED');}
 else if(!['LAUNCH_DRAFT','NEGOTIATION'].includes(tool.kind))throw Error('ASSISTANT_UNKNOWN_TOOL');
 return Object.freeze({version:1,kind:tool.kind,mode:tool.kind.endsWith('_DRAFT')?'PREPARE_ONLY':'NAVIGATION_OR_LOCAL',canWriteLedger:false,requiresBusinessConfirmation:tool.kind.endsWith('_DRAFT')});
}
export async function handoffAssistantDraft({tool,raw,context,getContext,modules,navigate,findTarget,fill,wait=()=>new Promise(r=>setTimeout(r,25))}){
 validateAssistantAction(tool,{context,getContext,modules});
 if(!['FINANCE_DRAFT','LAUNCH_DRAFT'].includes(tool.kind)||typeof raw!=='string'||!raw.trim()||raw.length>4000)throw Error('ASSISTANT_INVALID_DRAFT');
 const destination=tool.kind==='FINANCE_DRAFT'?'operations':'launch';
 await navigate(destination,{anchor:destination==='operations'?'voiceFinancialPanel':'launchAssistantPanel',force:true});
 for(let attempt=0;attempt<60;attempt++){
  validateAssistantAction(tool,{context,getContext,modules});
  if(getContext().view&&getContext().view!==destination)throw Error('ASSISTANT_CONTEXT_CHANGED');
  const target=findTarget(tool.kind);
  if(target){fill(target,raw,tool.kind);return{prepared:true,posted:false};}
  await wait();
 }
 throw Error('ASSISTANT_TARGET_UNAVAILABLE');
}
export function createAssistantMemory({storage,scope,memoryAllowed=()=>true,now=Date.now}={}){
 const key=()=>scope()?.actor?'eco.assistant.preferences.v1.'+encodeURIComponent(assistantScope(scope())):null;
 const read=()=>{let v;try{v=JSON.parse(storage.getItem(key())||'null');}catch{}return{enabled:memoryAllowed()&&v?.enabled===true,style:v?.style==='compact'?'compact':'guided',recent:memoryAllowed()&&v?.enabled===true&&Array.isArray(v.recent)?v.recent.filter(x=>topics.has(x?.topic)&&Number.isFinite(x.at)&&x.at<=now()&&now()-x.at<30*86400000).slice(0,12).map(x=>({topic:x.topic,at:x.at})):[]};};
 const write=v=>{try{const k=key();if(!k)return false;storage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
 return{snapshot:read,setEnabled:on=>write({...read(),enabled:Boolean(on)&&memoryAllowed(),recent:[]}),setStyle:style=>['compact','guided'].includes(style)&&write({...read(),style}),remember:topic=>{const v=read();if(!v.enabled||!topics.has(topic))return false;return write({...v,recent:[{topic,at:now()},...v.recent.filter(x=>x.topic!==topic)].slice(0,12)});},forget:topic=>write({...read(),recent:read().recent.filter(x=>x.topic!==topic)}),clear:()=>write({...read(),recent:[]}),reconcile:()=>memoryAllowed()?true:write({...read(),enabled:false,recent:[]})};
}
const clean=x=>String(x??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
export function prepareNegotiationDraft(input={},locale='fr'){
 const en=locale==='en',kind=input.kind||'offer';if(!['offer','counter','clarify'].includes(kind))throw Error('ASSISTANT_UNKNOWN_NEGOTIATION');
 const labels=en?{item:'Product or service',terms:'Proposed price and quantity',delivery:'Delivery and deadline',payment:'Payment conditions'}:{item:'Produit ou service',terms:'Prix et quantité proposés',delivery:'Livraison et échéance',payment:'Conditions de paiement'};
 const fields=Object.fromEntries(Object.keys(labels).map(k=>[k,clean(input[k])])),missing=Object.keys(labels).filter(k=>!fields[k]);
 const title=(en?{offer:'Offer to review',counter:'Counter-offer to review',clarify:'Request for clarification'}:{offer:'Proposition à relire',counter:'Contre-proposition à relire',clarify:'Demande de précisions'})[kind];
 const lines=[title,...Object.keys(labels).map(k=>labels[k]+': '+(fields[k]||'['+(en?'to complete':'à compléter')+']'))];
 lines.push(en?'Please confirm availability, evidence and all conditions before any agreement. This draft has not been sent or accepted.':'Merci de confirmer la disponibilité, les justificatifs et les conditions avant tout accord. Ce brouillon n’a été ni envoyé ni accepté.');
 return{kind,text:lines.join('\n\n'),missing,ready:missing.length===0,sent:false,committed:false};
}
export const ASSISTANT_GUIDE_STEPS={
 meeting:[['Choisir le groupe et une séance ouverte.','Choose the group and an open meeting.'],['Vérifier présences, rubriques et bénéficiaires.','Review attendance, rubrics and beneficiaries.'],['Relire les saisies et distinguer local, en attente et confirmé.','Review entries and distinguish local, pending and confirmed.']],
 commerce:[['Décrire offre ou besoin, lieu, quantité et délai.','Describe the offer or need, location, quantity and deadline.'],['Vérifier le profil et les conditions avec l’interlocuteur.','Check the profile and terms with the other party.'],['Relire dans Marketplace avant tout engagement.','Review in Marketplace before any commitment.']],
 opportunity:[['Préciser ce qui est proposé ou recherché.','Specify what is offered or needed.'],['Choisir visibilité et conditions.','Choose visibility and terms.'],['Vérifier le brouillon dans Eco NOW avant publication.','Review the Eco NOW draft before publishing.']],
 risk:[['Séparer les faits vérifiables des promesses.','Separate verifiable facts from promises.'],['Noter recrutement, retraits et identité vérifiable.','Record recruitment, withdrawals and verifiable identity.'],['Examiner les signaux dans le Labo sans conclure à un verdict légal.','Examine signals in the Lab without issuing a legal verdict.']],
 governance:[['Distinguer règle écrite et pratique observée.','Distinguish written rules and observed practice.'],['Soumettre les écarts à la gouvernance du groupe.','Submit differences to the group governance.'],['Faire valider la règle opérationnelle par l’autorité habilitée.','Have the authorized owner validate the operational rule.']],
 paper:[['Photographier les pages avec les en-têtes lisibles.','Photograph pages with readable column headers.'],['Corriger noms, rubriques et montants extraits.','Correct extracted names, rubrics and amounts.'],['Valider séparément dans le parcours métier disponible.','Confirm separately through the available business workflow.']],
 community:[['Choisir le forum et vérifier sa visibilité.','Choose a forum and check its visibility.'],['Décrire une question, compétence ou possibilité concrète.','Describe a concrete question, skill or opportunity.'],['Relire les pièces avant de publier.','Review attachments before publishing.']],
 finance:[['Choisir le groupe, le membre, la séance et la rubrique.','Choose the group, member, meeting and rubric.'],['Corriger toute ambiguïté dans la prévisualisation des deux feuilles.','Correct every ambiguity in the two-sheet preview.'],['Confirmer par le parcours existant puis vérifier le statut réel.','Confirm through the existing workflow, then check the actual status.']],
 founder:[['Ouvrir Founder AI dans le périmètre autorisé.','Open Founder AI within the authorized scope.'],['Vérifier sources, portée et propositions.','Check sources, scope and proposals.'],['Une proposition ne change pas automatiquement une règle active.','A proposal does not automatically change an active rule.']],
 search:[['Préciser le nom ou le service recherché.','Specify the name or service to find.'],['Rechercher dans l’espace autorisé courant.','Search the current authorized space.'],['Les données absentes ou non vérifiables ne sont pas inventées.','Missing or unverifiable data is not invented.']]
};
