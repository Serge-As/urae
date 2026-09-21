const byId=id=>document.getElementById(id);
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const button=(text,cls='secondary')=>{const b=el('button',text,cls);b.type='button';return b;};
const field=(label,node)=>{const l=el('label',label);l.append(node);return l;};
const date=v=>{try{return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}catch{return String(v??'—')}};

const DEFINITIONS={
  core:{
    titleFr:'1 · Association / Tontine d’abord',titleEn:'1 · Association / Tontine first',
    introFr:'Anticiper les besoins du groupe sans modifier automatiquement ses règles, son calendrier ou son Ledger.',introEn:'Anticipate group needs without automatically changing rules, calendar or Ledger.',
    items:[
      ['GROUP.ANTICIPATION','Anticipation du groupe','Group anticipation','Besoin ou événement à préparer','Need or event to prepare'],
      ['GROUP.MEETING_AUTOPILOT','Meeting Autopilot','Meeting Autopilot','Projet de préparation d’une séance','Meeting preparation draft'],
      ['GROUP.DOCTOR','Group Doctor','Group Doctor','Anomalie, risque ou friction observée','Observed anomaly, risk or friction']
    ]
  },
  opportunity:{
    titleFr:'2 · Besoins, opportunités et achats',titleEn:'2 · Needs, opportunities and buying',
    introFr:'Transformer un besoin réel en demande structurée, comparaison ou achat groupé. Une prévision n’est jamais une commande.',introEn:'Turn a real need into structured demand, comparison or group buying. A forecast is never an order.',
    items:[
      ['OPPORTUNITY.NEED','Exprimer un besoin','Express a need','Que cherchez-vous ou que pouvez-vous proposer ?','What do you need or offer?'],
      ['MARKETPLACE.DEMAND_EXCHANGE','Demand Exchange','Demand Exchange','Demande agrégée / besoin à confronter à l’offre','Aggregated demand / need to match with supply'],
      ['MARKETPLACE.PROCUREMENT','Smart Procurement','Smart Procurement','Demande de devis / sourcing','RFQ / sourcing request'],
      ['MARKETPLACE.GROUP_BUY','Achat groupé','Group buying','Préparer un achat collectif avant passage au moteur spécialisé','Prepare collective buying before specialized engine']
    ]
  },
  local:{
    titleFr:'3 · Eco NOW · Harvest · commerce local',titleEn:'3 · Eco NOW · Harvest · local commerce',
    introFr:'Faire circuler une capacité réelle : stock, récolte, surplus, besoin immédiat ou point de retrait. Les quantités prévues restent distinguées du stock confirmé.',introEn:'Circulate real capacity: stock, harvest, surplus, immediate need or pickup point. Forecast quantities remain distinct from confirmed stock.',
    items:[
      ['MARKETPLACE.ECO_NOW','Eco NOW','Eco NOW','J’ai besoin maintenant / Je peux fournir maintenant','I need now / I can supply now'],
      ['MARKETPLACE.HARVEST_LOCAL','Eco Harvest & Local Commerce','Eco Harvest & Local Commerce','Disponibilité prochaine / pré-récolte / groupe producteur','Upcoming availability / pre-harvest / producer group'],
      ['MARKETPLACE.FRESH_DROP','Fresh Drop','Fresh Drop','Arrivage daté, quantité, lieu et conditions','Timed arrival, quantity, place and conditions'],
      ['MARKETPLACE.PICKUP_NETWORK','Point de retrait / micro-hub','Pickup point / micro-hub','Capacité de collecte, retrait ou redistribution','Collection, pickup or redistribution capacity']
    ]
  },
  business:{
    titleFr:'4 · Valeur, activité, talent et création',titleEn:'4 · Value, business, talent and creation',
    introFr:'Aider une personne ou un groupe à identifier ce qu’il possède, sait faire ou peut transformer en valeur, sans promesse automatique de revenu.',introEn:'Help a person or group identify what they have, know or can turn into value, without automatic income promises.',
    items:[
      ['MANAGER.VALUE_DISCOVERY','Value Discovery','Value Discovery','Ce que j’ai / sais faire / peux mobiliser','What I have / know / can mobilize'],
      ['MANAGER.BUSINESS_STUDIO','Eco Business Studio','Eco Business Studio','Activité, offre, clients, catalogue ou projet','Activity, offer, customers, catalog or project'],
      ['MANAGER.BUSINESS_AGENT','Business Agent','Business Agent','Tâche commerciale à assister, jamais à inventer','Commercial task to assist, never invent'],
      ['LEARNING.TALENT','Talent · Learn → Prove → Work → Earn','Talent · Learn → Prove → Work → Earn','Compétence, preuve, apprentissage ou opportunité','Skill, proof, learning or opportunity'],
      ['CREATOR.STUDIO','Creator & Seller Studio','Creator & Seller Studio','Contenu relié à une action utile : apprendre, réserver, acheter, rejoindre','Content linked to useful action: learn, book, buy, join']
    ]
  },
  community:{
    titleFr:'5 · Communautés, forums et accompagnement',titleEn:'5 · Communities, forums and support',
    introFr:'Transformer les forums et communautés en espaces d’action sans casser leur rôle social : discuter, documenter un besoin, transmettre un savoir, présenter une offre, préparer un partenariat ou relayer une opportunité vers son moteur canonique.',introEn:'Turn forums and communities into action spaces without breaking their social role: discuss, document a need, share knowledge, present an offer, prepare a partnership or hand an opportunity to its canonical engine.',
    items:[
      ['COMMUNITY.FORUM','Forum principal et forums de groupe','Main and group forums','Discuter, décider, suivre la vie du groupe et orienter une publication vers une action utile','Discuss, decide, follow group life and route a post toward useful action'],
      ['COMMUNITY.PRO_HUBS','Hubs professionnels et thématiques','Professional and thematic hubs','Fédérer compétences, agriculture, business, emploi, créateurs ou territoires sans second forum','Federate skills, agriculture, business, jobs, creators or local areas without a second forum'],
      ['PARTNERS.DIRECTORY','Partenaires · ONG · programmes','Partners · NGOs · programs','Préparer un accompagnement traçable d’un groupe, d’une communauté ou d’un projet','Prepare traceable support for a group, community or project'],
      ['LEARNING.MANAGER_ACADEMY','Academy · transmission · savoir-faire','Academy · learning · know-how','Besoin ou offre de formation, mentorat, savoir-faire ou accompagnement','Training, mentoring, know-how or support need/offer']
    ]
  },
  trust:{
    titleFr:'6 · Confiance et intelligence de marché',titleEn:'6 · Trust and market intelligence',
    introFr:'Documenter les preuves et signaux collectifs sans transformer un score en verdict ni exploiter les finances individuelles pour la publicité.',introEn:'Document evidence and collective signals without turning a score into a verdict or using individual finance for advertising.',
    items:[
      ['TRUST.GRAPH','Trust Graph explicable','Explainable Trust Graph','Preuve de fiabilité, mandat, livraison ou compétence','Evidence of reliability, mandate, delivery or skill'],
      ['MARKETPLACE.MARKET_INTELLIGENCE','Market Intelligence','Market Intelligence','Signal agrégé de demande, offre, saisonnalité ou manque','Aggregated demand, supply, seasonality or gap'],
      ['SAFETY.ANTISCAM','Labo financier / anti-arnaques','Financial / anti-scam lab','Cas ou mécanisme financier à documenter avant analyse','Financial case or mechanism to document before analysis']
    ]
  }
};

export function mountBlueprintExecutableUI({app,getGroups,getMeetings,navigate,notify,showError}){
  const root=byId('blueprintExecutableRoot');if(!root)return{refresh:async()=>{}};root.dataset.blueprintVersion='5.0.0';
  let active='core',workContext='GROUP';

  const activeGroup=()=>getGroups().find(x=>x.id===app.activeGroup());
  const contextControl=()=>{
    const select=document.createElement('select');select.id='blueprintContext';select.append(new Option(t('Groupe actif','Active group'),'GROUP'),new Option(t('Personnel / hors groupe','Personal / outside group'),'PERSONAL'));select.value=workContext;return select;
  };

  const renderHeader=()=>{
    const tabs=el('nav',undefined,'blueprint-tabs');for(const key of Object.keys(DEFINITIONS)){const d=DEFINITIONS[key],b=button(t(d.titleFr,d.titleEn));b.classList.toggle('primary',key===active);b.onclick=()=>{active=key;void refresh();};tabs.append(b);}root.append(tabs);
  };

  const starterFacts=async()=>{
    const group=activeGroup();if(!group)return[];
    const facts=[],meetings=getMeetings().slice().sort((a,b)=>String(a.scheduledAt??a.openedAt).localeCompare(String(b.scheduledAt??b.openedAt))),future=meetings.find(x=>new Date(x.scheduledAt??x.openedAt).getTime()>=Date.now());
    if(future)facts.push({level:'CERTAIN',title:t('Séance à préparer','Session to prepare'),detail:(future.scheduledAt??future.openedAt)+' · '+(future.location??t('lieu à compléter','location to complete')),moduleId:'GROUP.MEETING_AUTOPILOT'});
    else facts.push({level:'CERTAIN',title:t('Aucune prochaine séance datée','No dated upcoming session'),detail:t('Le calendrier actuel ne montre pas de séance future datée. Vous pouvez préparer une proposition sans modifier le calendrier automatiquement.','The current calendar has no dated upcoming session. You may prepare a proposal without automatically changing the calendar.'),moduleId:'GROUP.ANTICIPATION'});
    try{const arrears=await app.arrears();if(arrears.length)facts.push({level:'CERTAIN',title:t('Créances ouvertes à examiner','Open receivables to review'),detail:t('Le service canonique signale ','The canonical service reports ')+arrears.length+t(' créance(s) ouverte(s).',' open receivable(s).'),moduleId:'GROUP.DOCTOR'});}catch{}
    return facts;
  };

  const workflowForm=(def,context)=>{
    const [moduleId,fr,en,phFr,phEn]=def,box=el('article',undefined,'blueprint-workflow-card');box.append(el('span',moduleId,'blueprint-state'),el('h3',t(fr,en)),el('p',t(phFr,phEn),'hint'));
    if(moduleId==='MARKETPLACE.GROUP_BUY'){
      const notice=el('p',t('Cette activité possède déjà un moteur canonique d’achats groupés. Le Blueprint ne crée donc aucun second enregistrement : il vous transmet vers le Marketplace existant.','This activity already has a canonical group-buy engine. Blueprint therefore creates no second record and hands off to the existing Marketplace.'),'truth-notice');
      const go=button(t('Ouvrir les achats groupés canoniques','Open canonical group buying'),'primary');go.onclick=()=>{navigate('ecosystem');setTimeout(()=>byId('marketEnginePanel')?.scrollIntoView({behavior:'smooth',block:'start'}),100);};box.append(notice,go);return box;
    }
    if(['COMMUNITY.FORUM','COMMUNITY.PRO_HUBS'].includes(moduleId)){
      const notice=el('p',t('Les forums et Hubs possèdent déjà leur moteur canonique. Le Blueprint 5.0.0 ne crée donc pas un second forum : il vous transmet vers Communautés vivantes avec des préréglages Besoin, Offre, Achat groupé, Récolte, Compétence, Formation, Business, Partenaire, Créateur et Info sourcée.','Forums and Hubs already have their canonical engine. Blueprint 5.0.0 therefore creates no second forum and hands off to Living Communities with action presets.'),'truth-notice');
      const go=button(t('Ouvrir les communautés et forums','Open communities and forums'),'primary');go.onclick=()=>{navigate('ecosystem');setTimeout(()=>byId('communityEnginePanel')?.scrollIntoView({behavior:'smooth',block:'start'}),100);};box.append(notice,go);return box;
    }
    if(moduleId==='PARTNERS.DIRECTORY'){
      const notice=el('p',t('Les partenaires, ONG et programmes utilisent le répertoire/programmes existant. Le Blueprint prépare le contexte mais n’invente aucun financement ni soutien public.','Partners, NGOs and programs use the existing directory/program engine. Blueprint prepares context but invents no funding or public support.'),'truth-notice');
      const go=button(t('Ouvrir Partenaires · ONG · Programmes','Open Partners · NGOs · Programs'),'primary');go.onclick=()=>{navigate('ecosystem');setTimeout(()=>byId('externalProgramsPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),100);};box.append(notice,go);return box;
    }
    const form=el('form',undefined,'form-grid'),title=document.createElement('input'),summary=document.createElement('textarea'),locality=document.createElement('input'),quantity=document.createElement('input'),due=document.createElement('input'),evidence=document.createElement('input'),confidence=document.createElement('select'),save=button(t('Créer le workflow','Create workflow'),'primary');
    title.placeholder=t('Titre concret','Concrete title');summary.placeholder=t('Contexte, besoin, proposition, contraintes…','Context, need, proposal, constraints…');summary.rows=3;locality.placeholder=t('Lieu / zone si utile','Location / area if useful');quantity.type='number';quantity.min='0';quantity.step='1';quantity.placeholder=t('Quantité si utile','Quantity if useful');due.type='date';evidence.placeholder=t('Source / preuve / référence','Source / evidence / reference');for(const [v,l] of [['CERTAIN',t('Certain : fait observé','Certain: observed fact')],['VERY_PROBABLE',t('Très probable','Very probable')],['HISTORICAL_INFERENCE',t('Inférence historique','Historical inference')],['OPPORTUNITY',t('Opportunité','Opportunity')]])confidence.append(new Option(l,v));save.type='submit';
    form.append(field(t('Titre','Title'),title),field(t('Description','Description'),summary),field(t('Localité','Locality'),locality),field(t('Quantité','Quantity'),quantity),field(t('Date / fenêtre','Date / window'),due),field(t('Preuve / source','Evidence / source'),evidence),field(t('Niveau','Level'),confidence),save);
    form.onsubmit=e=>void(async()=>{e.preventDefault();try{const ctx=context.value,groupId=ctx==='GROUP'?app.activeGroup():'';if(ctx==='GROUP'&&!groupId)throw Error(t('Sélectionnez d’abord un groupe.','Select a group first.'));if(!title.value.trim())throw Error(t('Titre requis.','Title required.'));save.disabled=true;
      if(moduleId==='OPPORTUNITY.NEED'){
        await app.createOpportunity({title:title.value.trim(),summary:summary.value.trim()||undefined,direction:'NEED',quantity:quantity.value?Number(quantity.value):undefined,locality:locality.value.trim()||undefined,targetDate:due.value||undefined,urgency:'NORMAL',visibility:ctx==='GROUP'?'GROUP':'PRIVATE',source:'BLUEPRINT',sourceRef:evidence.value.trim()||undefined,groupId:groupId||undefined});
      }else{
        await app.createWorkspaceRecord({moduleId,title:title.value.trim(),summary:summary.value.trim()||undefined,status:'DRAFT',tags:['blueprint','human-validation-required',active],groupId,data:{blueprintLayer:active,context:ctx,locality:locality.value.trim()||'',quantity:Number(quantity.value||0),targetDate:due.value||'',evidenceRef:evidence.value.trim()||'',confidence:confidence.value,humanValidated:false,commercialCommitment:false,realMoney:false}});
      }
      notify(moduleId==='OPPORTUNITY.NEED'?t('Besoin enregistré en brouillon. Il doit être ouvert explicitement avant tout matching. Aucune transaction n’a été créée.','Need saved as draft. It must be explicitly opened before matching. No transaction was created.'):t('Workflow créé en brouillon. Aucune transaction ni règle de groupe n’a été engagée.','Workflow created as draft. No transaction or group rule has been committed.'));form.reset();confidence.value='CERTAIN';await renderRecords(moduleId,box);}catch(err){showError(err);}finally{save.disabled=false;}})();
    box.append(form);const records=el('div',undefined,'blueprint-records');records.dataset.moduleId=moduleId;box.append(records);return box;
  };

  const renderRecords=async(moduleId,box)=>{
    const host=box.querySelector('.blueprint-records');if(!host)return;host.replaceChildren();
    const context=byId('blueprintContext')?.value??'GROUP',groupId=context==='GROUP'?app.activeGroup():'',isOpportunity=moduleId==='OPPORTUNITY.NEED';
    const rows=await (isOpportunity?app.listOpportunities(groupId||undefined):app.listWorkspaceRecords(moduleId,groupId||undefined)).catch(()=>[]);
    const scoped=context==='PERSONAL'?rows.filter(x=>!x.groupId):rows.filter(x=>x.groupId===groupId);
    if(!scoped.length){host.append(el('p',t('Aucun workflow enregistré.','No saved workflow.'),'hint'));return;}
    for(const r of scoped.slice().reverse().slice(0,12)){const businessState=isOpportunity?String(r.data?.opportunityState??r.status):r.status,item=el('article',undefined,'item'),head=el('div',undefined,'actions');head.append(el('strong',r.title),el('span',businessState,'blueprint-state'));item.append(head,el('p',r.summary??''),el('small',date(r.updatedAt)));
      const acts=el('div',undefined,'actions');
      if(r.status==='DRAFT'){const validate=button(isOpportunity?t('Ouvrir le besoin','Open need'):t('Valider humainement','Human validate'),'primary');validate.onclick=()=>void(async()=>{try{validate.disabled=true;if(isOpportunity)await app.transitionOpportunity(r.id,'OPEN');else await app.updateWorkspaceRecord(r.id,{status:'ACTIVE',data:{...r.data,humanValidated:true,validatedAt:new Date().toISOString()}});notify(isOpportunity?t('Besoin ouvert. Il reste non financier et peut maintenant être confronté à des offres.','Need opened. It remains non-financial and can now be matched with offers.'):t('Proposition validée comme workflow actif. Cela ne crée toujours pas de transaction financière.','Proposal validated as active workflow. This still creates no financial transaction.'));await renderRecords(moduleId,box);}catch(e){showError(e);}finally{validate.disabled=false;}})();acts.append(validate);}
      if(r.status==='ACTIVE'){const done=button(isOpportunity?t('Marquer satisfait','Mark fulfilled'):t('Marquer réalisé','Mark done'));done.onclick=()=>void(async()=>{try{if(isOpportunity)await app.transitionOpportunity(r.id,'FULFILLED');else await app.updateWorkspaceRecord(r.id,{status:'DONE',data:{...r.data,completedAt:new Date().toISOString()}});await renderRecords(moduleId,box);}catch(e){showError(e);}})();acts.append(done);}
      if(isOpportunity&&['DRAFT','ACTIVE'].includes(r.status)){const cancel=button(t('Annuler le besoin','Cancel need'));cancel.onclick=()=>void(async()=>{try{await app.transitionOpportunity(r.id,'CANCELLED');await renderRecords(moduleId,box);}catch(e){showError(e);}})();acts.append(cancel);}
      if(!isOpportunity&&['DRAFT','ACTIVE','DONE'].includes(r.status)){const archive=button(t('Archiver','Archive'));archive.onclick=()=>void(async()=>{try{await app.updateWorkspaceRecord(r.id,{status:'ARCHIVED'});await renderRecords(moduleId,box);}catch(e){showError(e);}})();acts.append(archive);}

      item.append(acts);host.append(item);
    }
  };

  async function refresh(){
    root.replaceChildren();renderHeader();
    const d=DEFINITIONS[active],head=el('section',undefined,'blueprint-layer'),intro=el('article',undefined,'truth-notice');intro.append(el('strong',t(d.titleFr,d.titleEn)),el('p',t(d.introFr,d.introEn)));head.append(intro);
    const context=contextControl(),contextRow=el('div',undefined,'actions');contextRow.append(field(t('Contexte de travail','Work context'),context));head.append(contextRow);
    if(active==='core'){
      const facts=await starterFacts();if(facts.length){const factBox=el('article',undefined,'blueprint-workflow-card');factBox.append(el('h3',t('Signaux certains observés maintenant','Certain signals observed now')));for(const f of facts){const item=el('div',undefined,'item');item.append(el('span',f.level,'blueprint-state'),el('strong',f.title),el('p',f.detail));const use=button(t('Préparer à partir de ce signal','Prepare from this signal'));use.onclick=()=>{const target=[...head.querySelectorAll('.blueprint-workflow-card')].find(x=>x.querySelector('.blueprint-state')?.textContent===f.moduleId);const title=target?.querySelector('input');const summary=target?.querySelector('textarea');if(title)title.value=f.title;if(summary)summary.value=f.detail;target?.scrollIntoView({behavior:'smooth',block:'center'});};item.append(use);factBox.append(item);}head.append(factBox);}
    }
    for(const def of d.items)head.append(workflowForm(def,context));
    root.append(head);
    context.onchange=()=>{workContext=context.value;void refresh();};
    for(const box of head.querySelectorAll('.blueprint-workflow-card')){const moduleId=box.querySelector('.blueprint-state')?.textContent;if(moduleId&&String(moduleId).includes('.'))await renderRecords(moduleId,box);}
    const doctrine=el('article',undefined,'truth-notice');doctrine.append(el('strong',t('Doctrine d’exécution','Execution doctrine')),el('p',t('PRÉDIRE / OBSERVER → PROPOSER → VALIDATION HUMAINE → EXÉCUTER DANS LE MOTEUR CANONIQUE. Prévision ≠ demande ≠ engagement ≠ transaction. Aucun argent réel n’est déclenché par ce cockpit.','PREDICT / OBSERVE → PROPOSE → HUMAN VALIDATION → EXECUTE IN THE CANONICAL ENGINE. Forecast ≠ demand ≠ commitment ≠ transaction. This cockpit triggers no real-money action.')));root.append(doctrine);
  }

  byId('blueprintRefreshBtn')?.addEventListener('click',()=>void refresh());
  return{refresh};
}
