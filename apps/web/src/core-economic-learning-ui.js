import {mountOpportunityLanes}from'./opportunity-lanes.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const val=(form,name)=>String(new FormData(form).get(name)??'').trim();
const num=(form,name)=>Number(new FormData(form).get(name)??0);
const makeForm=(fields,submit)=>{
  const f=el('form',undefined,'form-grid');
  for(const spec of fields){
    const l=el('label',spec.label),i=spec.type==='select'?document.createElement('select'):document.createElement('input');
    i.name=spec.name;if(spec.type&&spec.type!=='select')i.type=spec.type;if(spec.placeholder)i.placeholder=spec.placeholder;
    if(spec.required)i.required=true;if(spec.min!==undefined)i.min=String(spec.min);if(spec.type==='checkbox')i.checked=Boolean(spec.checked);
    if(spec.options)for(const [v,t] of spec.options){const o=document.createElement('option');o.value=v;o.textContent=t;i.append(o);}
    l.append(i);f.append(l);
  }
  const b=el('button',submit,'primary');b.type='submit';f.append(b);return f;
};
const safeDate=v=>{try{return new Date(v).toLocaleDateString('fr-FR')}catch{return String(v??'')}};

export function mountCoreEconomicLearningUI({app,notify=()=>{},showError=console.error,isManager=()=>false}){
  const marketHub=document.getElementById('marketHub'),guidanceHub=document.getElementById('guidanceHub');
  if(!marketHub||!guidanceHub)return{refresh:async()=>{}};
  const opportunities=mountOpportunityLanes({app,host:marketHub.closest('section'),showError,notify});

  const valuePanel=el('details',undefined,'panel');valuePanel.id='valueNetworkOperational';
  valuePanel.append(el('summary','Besoins · offres · approvisionnement gouverné'));
  const valueIntro=el('p','Un besoin vient d’une séance, d’un forum, d’une prévision ou d’une saisie manuelle. Il doit être validé avant publication. Un rapprochement d’offre ne crée jamais de commande ni de dette.','truth-notice');
  const needForm=makeForm([
    {label:'Besoin',name:'title',required:true,placeholder:'Ex. 100 cartons de savons'},
    {label:'Catégorie',name:'category',required:true,placeholder:'savons'},
    {label:'Quantité',name:'quantity',type:'number',min:1,required:true},
    {label:'Unité',name:'unit',required:true,placeholder:'carton'},
    {label:'Spécification',name:'specification',placeholder:'Ex. savon 400 g, parfum neutre'},
    {label:'Qualité exigée',name:'quality',placeholder:'Ex. standard A'},
    {label:'Localité',name:'locality',placeholder:'Yaoundé'},
    {label:'Date limite',name:'neededBy',type:'date'},
    {label:'Budget maximum rendu (XAF)',name:'budgetMax',type:'number',min:0},
    {label:'Accepter des substitutions à confirmer',name:'substitutionsAllowed',type:'checkbox'},
    {label:'J’autorise la publication de ce besoin après validation',name:'publicationConsent',type:'checkbox'}
  ],'Créer le besoin en brouillon');
  const offerForm=makeForm([
    {label:'Offre / produit / service',name:'title',required:true,placeholder:'Ex. Cartons de savon disponibles'},
    {label:'Type',name:'kind',type:'select',options:[['SUPPLIER','Fournisseur'],['NOW','Disponible maintenant'],['HARVEST','Récolte'],['FRESH_DROP','Arrivage frais'],['PICKUP','Point de retrait'],['SERVICE','Service']]},
    {label:'Catégorie',name:'category',required:true,placeholder:'savons'},
    {label:'Quantité disponible',name:'availableQuantity',type:'number',min:1,required:true},
    {label:'Unité',name:'unit',required:true,placeholder:'carton, kg, litre…'},
    {label:'Spécification',name:'specification',placeholder:'Ex. savon 400 g'},
    {label:'Qualité',name:'quality',placeholder:'Ex. standard A'},
    {label:'Localité',name:'locality',placeholder:'Yaoundé'},
    {label:'Autres zones desservies',name:'serviceZones',placeholder:'Mbalmayo, Obala'},
    {label:'Disponible au plus tard',name:'availableBy',type:'date'},
    {label:'Offre valable jusqu’au',name:'expiresAt',type:'date',required:true},
    {label:'Prix unitaire XAF — vide = sur devis',name:'unitPrice',type:'number',min:0},
    {label:'Transport rendu XAF — vide = inconnu',name:'transportCost',type:'number',min:0},
    {label:'Autres coûts XAF — vide = inconnu',name:'otherCosts',type:'number',min:0},
    {label:'Remise XAF',name:'discount',type:'number',min:0},
    {label:'Livraisons documentées',name:'documentedDeliveries',type:'number',min:0},
    {label:'Litiges confirmés',name:'confirmedDisputes',type:'number',min:0},
    {label:'Offre sponsorisée — affichage séparé du score',name:'sponsored',type:'checkbox'}
  ],'Publier / actualiser l’offre');
  const needs=el('div',undefined,'stack'),offerBox=document.createElement('details');offerBox.append(el('summary','Proposer une offre compatible'),el('p','Le sponsoring est signalé mais ne peut pas améliorer le score de confiance ou de pertinence. Les coûts inconnus restent inconnus.','truth-notice'),offerForm);
  valuePanel.append(valueIntro,needForm,offerBox,needs);
  marketHub.closest('section')?.insertAdjacentElement('afterend',valuePanel);
  const forumOrigin=el('p',undefined,'truth-notice');
  forumOrigin.hidden=true;valuePanel.insertBefore(forumOrigin,needForm);
  window.addEventListener('eco:forum-opportunity-intent',event=>{
    const data=event instanceof CustomEvent?event.detail:null;
    if(!data||!['REQUEST','OFFER'].includes(String(data.kind)))return;
    if(data.kind==='REQUEST'&&(!app.activeGroup()||String(data.groupId)!==String(app.activeGroup())))return;
    if(data.groupId&&String(data.groupId)!==String(app.activeGroup()))return;
    const en=document.documentElement.lang?.startsWith('en');
    const form=data.kind==='REQUEST'?needForm:offerForm;
    const touched=['title','category','quantity','availableQuantity','unit','specification'].some(name=>String(form.elements[name]?.value??'').trim());
    if(touched&&!window.confirm(en?'Replace your current unsaved business form with this forum idea?':'Remplacer votre formulaire économique non enregistré par cette idée du Fora ?'))return;
    if(touched)form.reset();
    if(data.kind==='REQUEST'){
      // Preserve true source provenance in the canonical opportunity owner.
      form.dataset.sourceType=data.messageId?'COMMUNITY_MESSAGE':'MANUAL';
      form.dataset.sourceRef=data.messageId?String(data.messageId):'';
    }
    const text=String(data.body??'').trim();
    const sourceTitle=String(data.title??'').trim();
    const title=sourceTitle&&!['REQUEST','OFFER'].includes(sourceTitle)?sourceTitle:text.slice(0,100);
    if(form.elements.title)form.elements.title.value=title.slice(0,160);
    if(form.elements.specification)form.elements.specification.value=text.slice(0,400);
    // Commercial fields (price, quantity, validity and category) must be
    // provided by a human in the canonical form. No write occurs here.
    valuePanel.open=true;
    offerBox.open=data.kind==='OFFER';
    forumOrigin.hidden=false;
    forumOrigin.textContent=en
      ?'Draft based on a forum message. Verify quantities, price, category, availability and rights before explicitly submitting. The original forum post is unchanged.'
      :'Brouillon inspiré d’un message du Fora. Vérifiez quantités, prix, catégorie, disponibilité et droits avant toute validation explicite. La publication d’origine reste inchangée.';
    window.dispatchEvent(new CustomEvent('eco:open-economic-opportunity',{detail:{groupId:data.groupId,kind:data.kind}}));
    form.elements.title?.focus();
  });
  window.addEventListener('eco:value-network-preset',event=>{
    const kind=String(event instanceof CustomEvent?event.detail?.kind??'':'');if(!['NOW','HARVEST','FRESH_DROP','PICKUP','SUPPLIER','SERVICE'].includes(kind))return;
    const select=offerForm.elements.kind;if(select)select.value=kind;
    const title=offerForm.elements.title;if(title){title.focus();title.placeholder=kind==='NOW'?'Disponible maintenant…':kind==='HARVEST'?'Récolte / pré-récolte…':kind==='FRESH_DROP'?'Arrivage daté…':kind==='PICKUP'?'Point de retrait / micro-hub…':'Offre / service…';}
    offerBox.open=true;
  });

  offerForm.addEventListener('submit',e=>void(async()=>{e.preventDefault();try{
    const dateEnd=val(offerForm,'expiresAt'),available=val(offerForm,'availableBy');
    await app.createValueOffer({title:val(offerForm,'title'),kind:val(offerForm,'kind'),category:val(offerForm,'category'),availableQuantity:num(offerForm,'availableQuantity'),unit:val(offerForm,'unit'),specification:val(offerForm,'specification'),quality:val(offerForm,'quality'),locality:val(offerForm,'locality'),serviceZones:val(offerForm,'serviceZones').split(',').map(x=>x.trim()).filter(Boolean),availableBy:available?new Date(available+'T12:00:00').toISOString():undefined,expiresAt:new Date(dateEnd+'T23:59:59').toISOString(),unitPrice:val(offerForm,'unitPrice')?num(offerForm,'unitPrice'):undefined,transportCost:val(offerForm,'transportCost')?num(offerForm,'transportCost'):undefined,otherCosts:val(offerForm,'otherCosts')?num(offerForm,'otherCosts'):undefined,discount:val(offerForm,'discount')?num(offerForm,'discount'):0,documentedDeliveries:val(offerForm,'documentedDeliveries')?num(offerForm,'documentedDeliveries'):0,confirmedDisputes:val(offerForm,'confirmedDisputes')?num(offerForm,'confirmedDisputes'):0,sponsored:Boolean(offerForm.elements.sponsored?.checked),currency:'XAF'});
    offerForm.reset();notify('Offre enregistrée. Elle sera comparée avec des raisons explicables.');await renderNeeds();
  }catch(err){showError(err);}})());

  needForm.addEventListener('submit',e=>void(async()=>{e.preventDefault();try{
    await app.createValueNeed({title:val(needForm,'title'),category:val(needForm,'category'),quantity:num(needForm,'quantity'),unit:val(needForm,'unit'),specification:val(needForm,'specification'),quality:val(needForm,'quality'),locality:val(needForm,'locality'),neededBy:val(needForm,'neededBy')||undefined,budgetMax:val(needForm,'budgetMax')?num(needForm,'budgetMax'):undefined,substitutionsAllowed:Boolean(needForm.elements.substitutionsAllowed?.checked),publicationConsent:Boolean(needForm.elements.publicationConsent?.checked),currency:'XAF',sourceType:needForm.dataset.sourceType==='COMMUNITY_MESSAGE'?'COMMUNITY_MESSAGE':'MANUAL',sourceRef:needForm.dataset.sourceRef||undefined});
    needForm.reset();delete needForm.dataset.sourceType;delete needForm.dataset.sourceRef;notify('Besoin créé en brouillon.');await renderNeeds();
  }catch(err){showError(err);}})());

  const renderNeeds=async()=>{
    needs.replaceChildren();if(!app.activeGroup()){needs.append(el('p','Sélectionnez un groupe pour gérer ses besoins.','hint'));return;}
    try{
      const rows=await app.valueNeeds();if(!rows.length)needs.append(el('p','Aucun besoin collectif.','hint'));
      for(const r of rows){
        const card=el('article',undefined,'item'),state=String(r.data.state??'DRAFT');
        card.append(el('strong',r.title),el('span',state,'pill'),el('p',String(r.data.quantity)+' '+String(r.data.unit)+' · '+String(r.data.category)+(r.data.locality?' · '+r.data.locality:''),'hint'));
        const actions=el('div',undefined,'actions');
        if(state==='DRAFT'&&isManager()){const b=el('button','Valider','secondary');b.type='button';b.onclick=()=>void app.validateValueNeed(r.id).then(()=>{notify('Besoin validé.');return renderNeeds();}).catch(showError);actions.append(b);}
        if(['VALIDATED','MATCHED'].includes(state)&&isManager()){const b=el('button','Publier','secondary');b.type='button';b.onclick=()=>void app.publishValueNeed(r.id).then(()=>{notify('Besoin publié.');return renderNeeds();}).catch(showError);actions.append(b);}
        if(['VALIDATED','PUBLISHED','MATCHED'].includes(state)){
          const b=el('button','Chercher des offres compatibles','link-btn');b.type='button';b.onclick=()=>void(async()=>{try{
            const matches=await app.valueNeedMatches(r.id),box=el('div',undefined,'stack');
            if(!matches.length)box.append(el('p','Aucune offre éligible : quantité, zone, catégorie et validité sont vérifiées avant classement.','hint'));
            for(const m of matches.slice(0,10)){const row=el('article',undefined,'item'),head=el('div',undefined,'actions');head.append(el('strong',m.offer.title),el('span','pertinence '+Math.round(m.score)+'/100','pill'));if(m.sponsored)head.append(el('span','Sponsorisé','pill'));row.append(head);
              row.append(el('p',String(m.offer.data.availableQuantity)+' '+String(m.offer.data.unit)+' · '+(m.landedTotal===null?'coût rendu inconnu':Number(m.landedTotal).toLocaleString('fr-FR')+' '+String(m.offer.data.currency||'XAF')+' rendu'),'hint'));
              if(m.explanations?.length){const why=el('ul',undefined,'match-reasons');for(const x of m.explanations)why.append(el('li',x));row.append(why);}
              if(m.warnings?.length){const warn=el('p','À vérifier : '+m.warnings.join(' · '),'truth-notice');row.append(warn);}
              if(isManager()){const p=el('button','Préparer l’approvisionnement','secondary');p.type='button';p.onclick=()=>void app.prepareValueProcurement(r.id,m.offer.id).then(()=>{notify('Brouillon d’approvisionnement créé. Aucune commande ni dette n’a été créée.');return renderNeeds();}).catch(showError);row.append(p);}box.append(row);}
            card.append(box);
          }catch(err){showError(err);}})();actions.append(b);
        }
        card.append(actions);needs.append(card);
      }
    }catch(err){showError(err);}
  };

  const referralPanel=el('details',undefined,'panel');referralPanel.id='referralOperational';
  referralPanel.append(el('summary','Bouche-à-oreille · recommandation directe'));
  referralPanel.append(el('p','Un partage est volontaire et mesuré comme « lancé ». Il ne devient « reçu », « lead » ou « conversion » qu’après événement distinct. Aucun parrainage multiniveau.','truth-notice'));
  const referralActions=el('div',undefined,'actions'),referralList=el('div',undefined,'stack');referralPanel.append(referralActions,referralList);
  guidanceHub.closest('section')?.insertAdjacentElement('beforebegin',referralPanel);

  const shareBtn=el('button','Recommander le groupe actif','primary');shareBtn.type='button';shareBtn.onclick=()=>void(async()=>{try{
    if(!app.activeGroup())throw new Error('ACTIVE_GROUP_REQUIRED');
    const share=await app.createReferralShare({targetKind:'GROUP',targetId:app.activeGroup(),channel:navigator.share?'SYSTEM_SHARE':'LINK'});
    const text='Eco-System · recommandation volontaire\nCode : '+share.code;
    if(navigator.share){await navigator.share({title:'Recommandation Eco-System',text}).catch(()=>{});}else if(navigator.clipboard){await navigator.clipboard.writeText(text);}
    notify('Partage enregistré comme lancé. Il n’est pas compté comme reçu.');
    await renderReferral();
  }catch(err){showError(err);}})();referralActions.append(shareBtn);

  const campaignDetails=el('details',undefined,'referral-campaign-builder');campaignDetails.append(el('summary','Créer une campagne rémunérée bornée'));
  const campaignForm=makeForm([
    {label:'Nom de la campagne',name:'title',required:true,placeholder:'Ex. Ambassadeurs du groupe'},
    {label:'Budget maximum sandbox XAF',name:'budgetTotal',type:'number',min:0,required:true},
    {label:'Prime par conversion vérifiée XAF',name:'rewardPerConversion',type:'number',min:0,required:true},
    {label:'Fin de campagne',name:'endsAt',type:'date'},
    {label:'Plafond de primes par ambassadeur (0 = budget seul)',name:'maxRewardsPerBeneficiary',type:'number',min:0},
    {label:'Source du budget',name:'fundingSource',type:'select',options:[['SANDBOX_BUDGET','Sandbox — aucun argent réel'],['PRIVATE_BUSINESS','Budget privé Business Studio'],['GROUP_APPROVED_BUDGET','Budget groupe approuvé'],['SPONSOR','Sponsor documenté']]},
    {label:'Preuve de financement si hors sandbox',name:'fundingEvidenceRef',placeholder:'PV, mandat, contrat sponsor…'},
    {label:'Conversions admissibles',name:'eligibleConversionKinds',placeholder:'MEMBERSHIP_APPROVED, LEAD_QUALIFIED, ORDER_CONFIRMED'}
  ],'Créer la campagne en brouillon');
  campaignDetails.append(el('p','Un seul niveau direct. Aucun rendement lié au recrutement. Les cotisations et l’épargne ne financent pas les primes. Argent réel désactivé : les primes restent sandbox/non-cash tant qu’un partenaire qualifié n’est pas activé.','truth-notice'),campaignForm);referralPanel.append(campaignDetails);
  campaignForm.addEventListener('submit',e=>void(async()=>{e.preventDefault();try{
    if(!app.activeGroup())throw new Error('ACTIVE_GROUP_REQUIRED');
    const payload={title:val(campaignForm,'title'),targetKind:'GROUP',targetId:app.activeGroup(),budgetTotal:num(campaignForm,'budgetTotal'),rewardPerConversion:num(campaignForm,'rewardPerConversion'),rewardMode:'SANDBOX_CREDIT',endsAt:val(campaignForm,'endsAt')?new Date(val(campaignForm,'endsAt')+'T23:59:59').toISOString():undefined,maxRewardsPerBeneficiary:num(campaignForm,'maxRewardsPerBeneficiary'),fundingSource:val(campaignForm,'fundingSource'),fundingEvidenceRef:val(campaignForm,'fundingEvidenceRef')||undefined,eligibleConversionKinds:val(campaignForm,'eligibleConversionKinds').split(',').map(x=>x.trim()).filter(Boolean),levels:1,rewardForRecruitingRecruiters:false,promisedReturnLinkedToRecruitment:false};
    await app.createReferralCampaign(payload);campaignForm.reset();notify('Campagne créée en brouillon avec garde-fou anti-pyramide.');await renderReferral();
  }catch(err){showError(err);}})());

  const renderReferral=async()=>{
    referralList.replaceChildren();try{
      const d=await app.referralDashboard(),summary=el('article',undefined,'item');
      const verified=(d.conversions??[]).filter(x=>x.data?.verificationState==='VERIFIED').length,pending=(d.conversions??[]).filter(x=>x.data?.verificationState==='PENDING_VERIFICATION').length;
      summary.append(el('strong','Mesures honnêtes'),el('p',(d.shares?.length??0)+' partage(s) lancé(s) · '+(d.leads?.length??0)+' lead(s) · '+(d.conversions?.length??0)+' conversion(s) déclarée(s) · '+verified+' vérifiée(s) · '+pending+' à examiner','hint'));referralList.append(summary);
      for(const c of d.campaigns??[]){const card=el('article',undefined,'item'),b=c.budget??{};card.append(el('strong',c.record.title),el('span',String(b.state??c.record.data.state),'pill'),el('p','Budget '+Number(b.budgetTotal||0).toLocaleString('fr-FR')+' · réservé '+Number(b.reservedAmount||0).toLocaleString('fr-FR')+' · approuvé sandbox '+Number(b.spentAmount||0).toLocaleString('fr-FR'),'hint'),el('p','1 niveau direct · argent réel OFF · source : '+String(c.record.data?.fundingSource??'SANDBOX_BUDGET'),'truth-notice'));
        if(String(b.state)==='DRAFT'){const activate=el('button','Activer après revue','secondary');activate.type='button';activate.onclick=()=>void app.setReferralCampaignState(c.record.id,'ACTIVE').then(renderReferral).catch(showError);card.append(activate);}
        for(const conv of c.pendingConversions??[]){const row=el('article',undefined,'item');row.append(el('strong','Conversion à vérifier · '+String(conv.data?.eventKind??'')),el('p',String(conv.data?.evidenceSummary??''),'hint'));const acts=el('div',undefined,'actions'),accept=el('button','Vérifier et réserver la prime','primary'),reject=el('button','Rejeter','link-btn');accept.type=reject.type='button';accept.onclick=()=>void app.verifyReferralConversion(c.record.id,conv.id,{accepted:true,reason:'Événement vérifié par le propriétaire de campagne',reviewEvidenceRef:String(conv.data?.eventRef??'')}).then(renderReferral).catch(showError);reject.onclick=()=>void app.verifyReferralConversion(c.record.id,conv.id,{accepted:false,reason:'Preuve insuffisante ou événement non admissible'}).then(renderReferral).catch(showError);acts.append(accept,reject);row.append(acts);card.append(row);}
        referralList.append(card);}
    }catch(err){showError(err);}
  };

  const knowledgePanel=el('details',undefined,'panel');knowledgePanel.id='knowledgeOperational';
  knowledgePanel.append(el('summary','Knowledge Bank · Encyclopédie fonctionnelle · Founder AI'));
  const search=makeForm([{label:'Rechercher',name:'q',placeholder:'prêt, ONG, papier, publicité…'}],'Rechercher');
  const kResults=el('div',undefined,'stack');knowledgePanel.append(el('p','La Knowledge Bank versionne les observations, règles validées, cas et sources. L’IA peut expliquer et proposer, jamais activer une règle ni écrire dans le Ledger.','truth-notice'),search,kResults);
  guidanceHub.closest('section')?.insertAdjacentElement('afterend',knowledgePanel);
  search.addEventListener('submit',e=>void(async()=>{e.preventDefault();try{
    const q=val(search,'q'),[knowledge,ency,ctx]=await Promise.all([app.searchKnowledge(q,app.activeGroup()||undefined),app.encyclopedia(q),app.founderAiContext(q).catch(()=>null)]);
    kResults.replaceChildren();
    const cap=el('article',undefined,'item');cap.append(el('strong','Encyclopédie · '+ency.length+' capacité(s)'),el('p',ctx?'Founder AI disponible pour l’équipe fondatrice · '+(ctx.guardrails?.canWriteLedger?'écriture autorisée':'aucune écriture Ledger')+' · '+(ctx.guardrails?.canActivateRules?'activation règles autorisée':'aucune activation autonome'):'Founder AI réservé à l’équipe fondatrice ; la Knowledge Bank reste accessible selon vos droits.','hint'));kResults.append(cap);
    for(const x of ency.slice(0,15)){const c=el('article',undefined,'item');c.append(el('strong',x.labelFr+' · '+x.id),el('span',String(x.truth),'pill'),el('p','Owner/dépendances : '+(x.canonicalDependencies??[]).join(', '),'hint'));kResults.append(c);}
    for(const x of knowledge.slice(0,10)){const c=el('article',undefined,'item');c.append(el('strong',x.title),el('span',String(x.data.knowledgeState??x.status),'pill'),el('p',String(x.data.body??'').slice(0,500),'hint'));kResults.append(c);}
  }catch(err){showError(err);}})());

  const addKnowledge=el('button','Ajouter une connaissance','secondary');addKnowledge.type='button';addKnowledge.onclick=()=>void(async()=>{try{
    const title=prompt('Titre :')?.trim(),body=prompt('Contenu / règle / observation :')?.trim();if(!title||!body)return;
    await app.createKnowledge({title,body,kind:'OBSERVATION',groupId:app.activeGroup()||undefined,tags:[]});notify('Connaissance créée en brouillon et à valider.');
  }catch(err){showError(err);}})();knowledgePanel.append(addKnowledge);

  const academyPanel=el('details',undefined,'panel');academyPanel.id='academyOperational';
  academyPanel.append(el('summary','Academy · apprendre → prouver → exercer'));
  academyPanel.append(el('p','Une attestation prouve un parcours. Elle ne donne jamais automatiquement un rôle de président, trésorier, gestionnaire ou un droit financier.','truth-notice'));
  const academyList=el('div',undefined,'stack'),academyActions=el('div',undefined,'actions');academyPanel.append(academyActions,academyList);knowledgePanel.insertAdjacentElement('afterend',academyPanel);

  const courseBtn=el('button','Créer un parcours','secondary');courseBtn.type='button';courseBtn.onclick=()=>void(async()=>{try{
    const title=prompt('Titre du parcours :')?.trim(),audience=prompt('Public : ex. Trésoriers débutants')?.trim(),lesson=prompt('Première leçon / objectif :')?.trim();if(!title||!lesson)return;
    await app.createAcademyCourse({title,audience:audience||'Tous',description:'Parcours créé dans Eco-System.',lessons:[{id:'lesson-1',title:lesson,objective:lesson}],requiredEvidenceCount:0});notify('Parcours Academy créé.');await renderAcademy();
  }catch(err){showError(err);}})();academyActions.append(courseBtn);

  const renderAcademy=async()=>{academyList.replaceChildren();try{
    const d=await app.academy();if(!(d.courses?.length))academyList.append(el('p','Aucun parcours publié.','hint'));
    for(const c of d.courses??[]){const card=el('article',undefined,'item');card.append(el('strong',c.title),el('p',String(c.data.audience??'Tous'),'hint'));const enrolled=(d.myEnrollments??[]).some(x=>String(x.data.courseId)===c.id);if(!enrolled){const b=el('button','M’inscrire','primary');b.type='button';b.onclick=()=>void app.enrollAcademy(c.id).then(()=>{notify('Inscription enregistrée.');return renderAcademy();}).catch(showError);card.append(b);}academyList.append(card);}
    for(const cert of d.myCertificates??[]){const c=el('article',undefined,'item');c.append(el('strong',cert.title),el('span','Attestation','pill'),el('p','Aucun pouvoir financier ou administratif automatique.','hint'));academyList.append(c);}
  }catch(err){showError(err);}};

  const refresh=async()=>{await Promise.allSettled([opportunities.refresh(),renderNeeds(),renderReferral(),renderAcademy()]);};
  valuePanel.addEventListener('toggle',()=>{if(valuePanel.open)void renderNeeds();});
  referralPanel.addEventListener('toggle',()=>{if(referralPanel.open)void renderReferral();});
  academyPanel.addEventListener('toggle',()=>{if(academyPanel.open)void renderAcademy();});
  document.addEventListener('eco:group-context-changed',()=>void refresh());
  window.addEventListener('eco:context-changed',opportunities.clearForContext);
  return{refresh,clearForContext:opportunities.clearForContext};
}
