const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const val=(form,name)=>String(new FormData(form).get(name)??'').trim();
const num=(form,name)=>Number(new FormData(form).get(name)??0);
const makeForm=(fields,submit)=>{
  const f=el('form',undefined,'form-grid');
  for(const spec of fields){
    const l=el('label',spec.label),i=spec.type==='select'?document.createElement('select'):document.createElement('input');
    i.name=spec.name;if(spec.type&&spec.type!=='select')i.type=spec.type;if(spec.placeholder)i.placeholder=spec.placeholder;
    if(spec.required)i.required=true;if(spec.min!==undefined)i.min=String(spec.min);
    if(spec.options)for(const [v,t] of spec.options){const o=document.createElement('option');o.value=v;o.textContent=t;i.append(o);}
    l.append(i);f.append(l);
  }
  const b=el('button',submit,'primary');b.type='submit';f.append(b);return f;
};
const safeDate=v=>{try{return new Date(v).toLocaleDateString('fr-FR')}catch{return String(v??'')}};

export function mountCoreEconomicLearningUI({app,notify=()=>{},showError=console.error,isManager=()=>false}){
  const marketHub=document.getElementById('marketHub'),guidanceHub=document.getElementById('guidanceHub');
  if(!marketHub||!guidanceHub)return{refresh:async()=>{}};

  const valuePanel=el('details',undefined,'panel');valuePanel.id='valueNetworkOperational';
  valuePanel.append(el('summary','Besoins · offres · approvisionnement gouverné'));
  const valueIntro=el('p','Un besoin vient d’une séance, d’un forum, d’une prévision ou d’une saisie manuelle. Il doit être validé avant publication. Un rapprochement d’offre ne crée jamais de commande ni de dette.','truth-notice');
  const needForm=makeForm([
    {label:'Besoin',name:'title',required:true,placeholder:'Ex. 100 cartons de savons'},
    {label:'Catégorie',name:'category',required:true,placeholder:'savons'},
    {label:'Quantité',name:'quantity',type:'number',min:1,required:true},
    {label:'Unité',name:'unit',required:true,placeholder:'carton'},
    {label:'Localité',name:'locality',placeholder:'Yaoundé'},
    {label:'Date limite',name:'neededBy',type:'date'},
    {label:'Prix unitaire maximum (facultatif)',name:'maxUnitPrice',type:'number',min:0,placeholder:'0 = non précisé'},
    {label:'Budget total rendu maximum (facultatif)',name:'maxTotalBudget',type:'number',min:0,placeholder:'produit + livraison'},
    {label:'Qualité / spécification attendue',name:'qualityRequirement',placeholder:'Ex. A / premium / 72%'},
    {label:'Localité obligatoire',name:'localOnly',type:'select',options:[['false','Non'],['true','Oui']]}
  ],'Créer le besoin en brouillon');
  const offerForm=makeForm([
    {label:'Offre',name:'title',required:true,placeholder:'Ex. Savon carton 24'},
    {label:'Type',name:'kind',type:'select',options:[['SUPPLIER','Fournisseur'],['NOW','Eco NOW'],['HARVEST','Harvest'],['FRESH_DROP','Fresh Drop'],['PICKUP','Pickup'],['SERVICE','Service']]},
    {label:'Catégorie',name:'category',required:true,placeholder:'savons'},
    {label:'Quantité disponible',name:'availableQuantity',type:'number',min:1,required:true},
    {label:'Unité',name:'unit',required:true,placeholder:'carton'},
    {label:'Prix unitaire',name:'unitPrice',type:'number',min:0,placeholder:'0 = inconnu'},
    {label:'Coût livraison total',name:'deliveryCost',type:'number',min:0,placeholder:'0 = inconnu / inclus'},
    {label:'Localité',name:'locality',placeholder:'Yaoundé'},
    {label:'Disponible à partir du',name:'availableFrom',type:'date'},
    {label:'Délai livraison (jours)',name:'leadTimeDays',type:'number',min:0},
    {label:'Qualité / spécification',name:'qualityGrade',placeholder:'Ex. A / premium'},
    {label:'Fiabilité documentée (0–100)',name:'supplierReliability',type:'number',min:0},
    {label:'Offre valable jusqu’au',name:'expiresAt',type:'date',required:true}
  ],'Publier une offre disponible');
  const offers=el('div',undefined,'stack');
  const offerDetails=el('details');offerDetails.append(el('summary','Je propose une offre / capacité disponible'));offerDetails.append(offerForm,offers);
  const needs=el('div',undefined,'stack');valuePanel.append(valueIntro,needForm,offerDetails,needs);
  marketHub.closest('section')?.insertAdjacentElement('afterend',valuePanel);

  offerForm.addEventListener('submit',e=>void(async()=>{e.preventDefault();try{
    const expiresRaw=val(offerForm,'expiresAt'),expiresAt=expiresRaw?new Date(expiresRaw+'T23:59:59').toISOString():'';
    await app.createValueOffer({title:val(offerForm,'title'),kind:val(offerForm,'kind')||'SUPPLIER',category:val(offerForm,'category'),availableQuantity:num(offerForm,'availableQuantity'),unit:val(offerForm,'unit'),unitPrice:num(offerForm,'unitPrice')||0,deliveryCost:num(offerForm,'deliveryCost')||0,locality:val(offerForm,'locality'),availableFrom:val(offerForm,'availableFrom')||undefined,leadTimeDays:num(offerForm,'leadTimeDays')||0,qualityGrade:val(offerForm,'qualityGrade'),supplierReliability:num(offerForm,'supplierReliability')||0,currency:'XAF',expiresAt});
    offerForm.reset();notify('Offre publiée. Les champs inconnus restent signalés comme inconnus dans le matching.');await renderOffers();
  }catch(err){showError(err);}})());

  const renderOffers=async()=>{offers.replaceChildren();try{const rows=await app.valueOffers();for(const r of rows.slice().reverse().slice(0,12)){const card=el('article',undefined,'item');card.append(el('strong',r.title),el('span',String(r.data.kind??'OFFER'),'pill'),el('p',String(r.data.availableQuantity)+' '+String(r.data.unit)+' · '+(Number(r.data.unitPrice)>0?Number(r.data.unitPrice).toLocaleString('fr-FR')+' '+String(r.data.currency||'XAF'):'prix inconnu')+(r.data.locality?' · '+r.data.locality:''),'hint'));offers.append(card);}if(!rows.length)offers.append(el('p','Aucune offre disponible.','hint'));}catch(err){showError(err);}};
  offerDetails.addEventListener('toggle',()=>{if(offerDetails.open)void renderOffers();});

  needForm.addEventListener('submit',e=>void(async()=>{e.preventDefault();try{
    await app.createValueNeed({title:val(needForm,'title'),category:val(needForm,'category'),quantity:num(needForm,'quantity'),unit:val(needForm,'unit'),locality:val(needForm,'locality'),neededBy:val(needForm,'neededBy')||undefined,maxUnitPrice:num(needForm,'maxUnitPrice')||undefined,maxTotalBudget:num(needForm,'maxTotalBudget')||undefined,qualityRequirement:val(needForm,'qualityRequirement')||undefined,localOnly:val(needForm,'localOnly')==='true',currency:'XAF',sourceType:'MANUAL'});
    needForm.reset();notify('Besoin créé en brouillon.');await renderNeeds();
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
            for(const m of matches.slice(0,10)){const row=el('article',undefined,'item'),x=m.explanation??{},landed=x.landedTotal===null||x.landedTotal===undefined?'coût rendu inconnu':Number(x.landedTotal).toLocaleString('fr-FR')+' '+String(m.offer.data.currency||'XAF');row.append(el('strong',m.offer.title),el('span','score '+Math.round(m.score),'pill'),el('p',String(m.offer.data.availableQuantity)+' '+String(m.offer.data.unit)+' · coût rendu '+landed,'hint'),el('small','Atouts : '+(m.advantages??[]).join(', ')+' · Inconnus : '+((m.unknowns??[]).join(', ')||'aucun')));
              if(isManager()){const p=el('button','Préparer l’approvisionnement','secondary');p.type='button';p.onclick=()=>void app.prepareValueProcurement(r.id,m.offer.id).then(()=>{notify('Brouillon d’approvisionnement créé. Aucune commande ni dette n’a été créée.');return renderNeeds();}).catch(showError);row.append(p);}box.append(row);}
            card.append(box);
          }catch(err){showError(err);}})();actions.append(b);
        }
        card.append(actions);needs.append(card);
      }
    }catch(err){showError(err);}
  };

  const safetyPanel=el('details',undefined,'panel');safetyPanel.id='safetyOperational';
  safetyPanel.append(el('summary','Sécurité · anti-arnaque · anti-pyramide / Ponzi'));
  safetyPanel.append(el('p','Eco-System distingue un signal, un soupçon et une décision examinée. Une détection automatique ouvre un dossier de sécurité ; elle ne publie jamais une accusation contre une personne. Le parrainage rémunéré reste direct : aucun niveau, downline ou commission sur les recrues des recrues.','truth-notice'));
  const safetyActions=el('div',undefined,'actions'),safetyList=el('div',undefined,'stack');safetyPanel.append(safetyActions,safetyList);valuePanel.insertAdjacentElement('afterend',safetyPanel);
  const screenBtn=el('button','Analyser un texte / une offre','secondary');screenBtn.type='button';screenBtn.onclick=()=>void(async()=>{try{
    const value=prompt('Collez le texte à examiner (offre, message, campagne, promesse) :')?.trim();if(!value)return;
    const result=await app.screenSafety({text:value,title:'Analyse manuelle',groupId:app.activeGroup()||undefined,entityType:'MANUAL_REVIEW'});
    notify(result.assessment.flagged?'Signal détecté : dossier de sécurité ouvert.':'Aucun des signaux déterministes configurés n’a été détecté.');await renderSafety();
  }catch(err){showError(err);}})();safetyActions.append(screenBtn);
  const renderSafety=async()=>{safetyList.replaceChildren();try{
    const cases=await app.safetyCases(app.activeGroup()||undefined);if(!cases.length)safetyList.append(el('p','Aucun dossier de sécurité pour ce périmètre.','hint'));
    for(const c of cases.slice(0,30)){const card=el('article',undefined,'item'),state=String(c.data?.caseState??c.status),severity=String(c.data?.severity??'MEDIUM');card.append(el('strong',c.title),el('span',severity+' · '+state,'pill'),el('p',c.summary||'','hint'),el('small','Signaux : '+((c.data?.signals??[]).join(', ')||'—')));
      const actions=el('div',undefined,'actions');
      if(isManager()&&!['CLOSED','CLEARED'].includes(state)){for(const [decision,label] of [['TRIAGE','Prendre en revue'],['RESTRICT','Restreindre'],['CLEAR','Lever le signal'],['CLOSE','Clôturer']]){const b=el('button',label,decision==='RESTRICT'?'secondary':'link-btn');b.type='button';b.onclick=()=>void(async()=>{const note=prompt('Motif / preuve de la décision :')?.trim();if(!note)return;try{await app.reviewSafetyCase(c.id,{decision,note});await renderSafety();}catch(e){showError(e);}})();actions.append(b);}}
      if(['RESTRICTED','TRIAGED'].includes(state)){const appeal=el('button','Émettre un recours','link-btn');appeal.type='button';appeal.onclick=()=>void(async()=>{const note=prompt('Expliquez le recours :')?.trim();if(!note)return;try{await app.appealSafetyCase(c.id,note);await renderSafety();}catch(e){showError(e);}})();actions.append(appeal);}
      card.append(actions);safetyList.append(card);
    }
  }catch(err){showError(err);}};
  safetyPanel.addEventListener('toggle',()=>{if(safetyPanel.open)void renderSafety();});

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

  const campaignBtn=el('button','Créer une campagne bornée','secondary');campaignBtn.type='button';campaignBtn.onclick=()=>void(async()=>{try{
    if(!app.activeGroup())throw new Error('ACTIVE_GROUP_REQUIRED');
    const title=prompt('Nom de la campagne :')?.trim();if(!title)return;
    const budget=Number(prompt('Budget sandbox maximum (XAF) :')??0),reward=Number(prompt('Récompense sandbox par conversion vérifiée :')??0);
    await app.createReferralCampaign({title,targetKind:'GROUP',targetId:app.activeGroup(),budgetTotal:budget,rewardPerConversion:reward,rewardMode:'SANDBOX_CREDIT'});
    notify('Campagne créée en brouillon.');await renderReferral();
  }catch(err){showError(err);}})();referralActions.append(campaignBtn);

  const renderReferral=async()=>{
    referralList.replaceChildren();try{
      const d=await app.referralDashboard(),summary=el('article',undefined,'item');
      summary.append(el('strong','Mesures honnêtes'),el('p',(d.shares?.length??0)+' partage(s) lancé(s) · '+(d.leads?.length??0)+' lead(s) · '+(d.conversions?.length??0)+' conversion(s) vérifiée(s)','hint'));referralList.append(summary);
      for(const c of d.campaigns??[]){const card=el('article',undefined,'item'),b=c.budget??{};card.append(el('strong',c.record.title),el('span',String(b.state??c.record.data.state),'pill'),el('p','Budget '+Number(b.budgetTotal||0).toLocaleString('fr-FR')+' · réservé '+Number(b.reservedAmount||0).toLocaleString('fr-FR')+' · validé '+Number(b.spentAmount||0).toLocaleString('fr-FR'),'hint'));
        if(String(b.state)==='DRAFT'){const activate=el('button','Activer','secondary');activate.type='button';activate.onclick=()=>void app.setReferralCampaignState(c.record.id,'ACTIVE').then(renderReferral).catch(showError);card.append(activate);}referralList.append(card);}
    }catch(err){showError(err);}
  };

  const knowledgePanel=el('details',undefined,'panel');knowledgePanel.id='knowledgeOperational';
  knowledgePanel.append(el('summary','Knowledge Bank · Encyclopédie fonctionnelle · Founder AI'));
  const search=makeForm([{label:'Rechercher',name:'q',placeholder:'prêt, ONG, papier, publicité…'}],'Rechercher');
  const kResults=el('div',undefined,'stack');knowledgePanel.append(el('p','La Knowledge Bank versionne les observations, règles validées, cas et sources. L’IA peut expliquer et proposer, jamais activer une règle ni écrire dans le Ledger.','truth-notice'),search,kResults);
  guidanceHub.closest('section')?.insertAdjacentElement('afterend',knowledgePanel);
  search.addEventListener('submit',e=>void(async()=>{e.preventDefault();try{
    const q=val(search,'q'),[knowledge,ency,ctx]=await Promise.all([app.searchKnowledge(q,app.activeGroup()||undefined),app.encyclopedia(q),app.founderAiContext(q)]);
    kResults.replaceChildren();
    const cap=el('article',undefined,'item');cap.append(el('strong','Encyclopédie · '+ency.length+' capacité(s)'),el('p','Founder AI : '+(ctx.guardrails?.canWriteLedger?'écriture autorisée':'aucune écriture Ledger')+' · '+(ctx.guardrails?.canActivateRules?'activation règles autorisée':'aucune activation autonome'),'hint'));kResults.append(cap);
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

  const refresh=async()=>{await Promise.allSettled([renderNeeds(),renderOffers(),renderSafety(),renderReferral(),renderAcademy()]);};
  valuePanel.addEventListener('toggle',()=>{if(valuePanel.open)void renderNeeds();});
  referralPanel.addEventListener('toggle',()=>{if(referralPanel.open)void renderReferral();});
  academyPanel.addEventListener('toggle',()=>{if(academyPanel.open)void renderAcademy();});
  document.addEventListener('eco:group-context-changed',()=>void refresh());
  return{refresh};
}
