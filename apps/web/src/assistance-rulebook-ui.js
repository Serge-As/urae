const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const option=(value,label)=>{const o=el('option',label);o.value=value;return o;};
const money=n=>Number.isFinite(Number(n))&&Number(n)>0?{currency:'XAF',amount:Math.round(Number(n))}:undefined;

export function mountAssistanceRulebookUI({app,notify=()=>{},showError=console.error,isManager=()=>false}){
  const select=document.getElementById('assistanceRulebookRubric'),eventsRoot=document.getElementById('assistanceRulebookEvents'),summary=document.getElementById('assistanceRulebookSummary');
  if(!select||!eventsRoot||!summary)return{refresh:async()=>{}};
  let rubrics=[],current,events=[],globalControls={};

  const eventTemplate=(label='Nouvelle modalité')=>({key:'event_'+crypto.randomUUID(),label,fundingMode:'DISBURSEMENT',beneficiaryRule:'',eligibilityRule:'',representationRule:'',sourceEvidence:''});
  const readEventCard=card=>({
    key:card.dataset.key,
    label:card.querySelector('[data-field=label]').value.trim(),
    fundingMode:card.querySelector('[data-field=fundingMode]').value,
    amount:money(card.querySelector('[data-field=amount]').value),
    contributionPerMember:money(card.querySelector('[data-field=contributionPerMember]').value),
    beneficiaryRule:card.querySelector('[data-field=beneficiaryRule]').value.trim()||undefined,
    eligibilityRule:card.querySelector('[data-field=eligibilityRule]').value.trim()||undefined,
    representationRule:card.querySelector('[data-field=representationRule]').value.trim()||undefined,
    sourceEvidence:card.querySelector('[data-field=sourceEvidence]').value.trim()||undefined
  });

  const renderEvents=()=>{
    eventsRoot.replaceChildren();
    if(!current){eventsRoot.append(el('p','Aucune rubrique Assistance dans ce groupe. Ajoutez-la dans les rubriques si le groupe en prévoit une.','empty-state'));return;}
    if(!events.length)eventsRoot.append(el('p','Aucune modalité détaillée. Ajoutez un événement ou analysez une description / le RI.','hint'));
    events.forEach((row,index)=>{
      const card=el('fieldset',undefined,'assistance-event-card');card.dataset.key=row.key||('event_'+crypto.randomUUID());
      card.append(el('legend',(row.label||'Modalité')+' · '+(index+1)));
      const grid=el('div',undefined,'form-grid');
      const field=(label,key,value='',type='text')=>{const wrap=el('label',label),input=el('input');input.type=type;input.value=value??'';input.dataset.field=key;wrap.append(input);grid.append(wrap);return input;};
      field('Événement', 'label', row.label??'');
      const modeWrap=el('label','Mode de financement');const mode=el('select');mode.dataset.field='fundingMode';
      for(const [v,t] of [['DISBURSEMENT','Décaissement de caisse'],['LEVY','Main levée / collecte'],['MIXED','Mixte']])mode.append(option(v,t));mode.value=row.fundingMode??'DISBURSEMENT';modeWrap.append(mode);grid.append(modeWrap);
      field('Montant versé au bénéficiaire (XAF)','amount',row.amount?.amount??0,'number').min='0';
      field('Contribution par membre / main levée (XAF)','contributionPerMember',row.contributionPerMember?.amount??0,'number').min='0';
      const area=(label,key,value='')=>{const wrap=el('label',label);wrap.className='full';const t=el('textarea');t.rows=2;t.value=value??'';t.dataset.field=key;wrap.append(t);grid.append(wrap);return t;};
      area('Règle d’éligibilité','eligibilityRule',row.eligibilityRule);
      area('Règle bénéficiaire','beneficiaryRule',row.beneficiaryRule);
      area('Représentation / présence / cadeau / exception','representationRule',row.representationRule);
      area('Preuve / extrait du RI','sourceEvidence',row.sourceEvidence);
      card.append(grid);
      const actions=el('div',undefined,'actions');const remove=el('button','Retirer cette modalité','link-btn');remove.type='button';remove.onclick=()=>{events.splice(index,1);renderEvents();};actions.append(remove);card.append(actions);eventsRoot.append(card);
    });
  };

  const loadCurrent=()=>{
    current=rubrics.find(r=>r.id===select.value)??rubrics[0];
    if(current&&select.value!==current.id)select.value=current.id;
    const a=current?.policies?.assistance??{};
    events=structuredClone(a.eventRules??(a.eligibleEvents??[]).map(label=>eventTemplate(label)));
    summary.replaceChildren();
    if(!current){renderEvents();return;}
    const box=el('div',undefined,'form-grid');
    const selectField=(label,key,value,items)=>{const wrap=el('label',label),s=el('select');for(const [v,t] of items)s.append(option(v,t));s.value=value;s.dataset.control=key;wrap.append(s);box.append(wrap);return s;};
    globalControls.funding=selectField('Financement par défaut','funding',a.fundingMode??'DISBURSEMENT',[['DISBURSEMENT','Décaissement'],['LEVY','Main levée'],['MIXED','Mixte']]);
    globalControls.authorization=selectField('Autorité','authorization',a.authorization??'BUREAU',[['MANAGER','Gestionnaire'],['BUREAU','Bureau'],['ASSEMBLY','Assemblée'],['DOUBLE_VALIDATION','Double validation'],['CUSTOM','Règle spécifique']]);
    globalControls.source=selectField('Source','source',a.definitionSource??'MANUAL',[['GOVERNANCE_DOCUMENT','RI / document'],['TEXT','Texte'],['VOICE','Oral'],['MANUAL','Manuel']]);
    globalControls.review=selectField('État','review',a.reviewStatus??'DEFERRED',[['DEFERRED','Détails reportés'],['DRAFT','Brouillon'],['VALIDATED','Validé']]);
    const narrativeWrap=el('label','Décrire les modalités par écrit ou coller un extrait du RI');narrativeWrap.className='full';const narrative=el('textarea');narrative.id='assistanceRulebookNarrative';narrative.rows=4;narrativeWrap.append(narrative);box.append(narrativeWrap);
    const actions=el('div',undefined,'actions full');
    const analyze=el('button','Analyser cette description','secondary');analyze.type='button';analyze.onclick=()=>void(async()=>{try{
      const text=narrative.value.trim();if(!text)throw Error('Décrivez les modalités avant l’analyse.');
      const data=await app.analyzeGroupDocument(text),suggestion=(data.suggestions??[]).find(s=>s.rubric?.kind==='ASSISTANCE');
      if(!suggestion)throw Error('Aucune modalité Assistance assez claire n’a été détectée.');
      const found=suggestion.rubric.policyDraft?.assistance?.eventRules??[];
      if(found.length)events=[...events,...found.filter(x=>!events.some(e=>e.key===x.key||e.label===x.label))];
      globalControls.source.value='TEXT';globalControls.review.value='DRAFT';renderEvents();notify('Modalités détectées et ajoutées au brouillon.');
    }catch(e){showError(e);}})();
    const speak=el('button','🎙️ Décrire oralement','secondary');speak.type='button';speak.onclick=()=>{
      const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition){showError(Error('Reconnaissance vocale indisponible sur cet appareil.'));return;}
      const recognition=new SpeechRecognition();recognition.lang='fr-FR';recognition.interimResults=false;recognition.onresult=e=>{narrative.value=(narrative.value?narrative.value+'\n':'')+(e.results?.[0]?.[0]?.transcript??'');globalControls.source.value='VOICE';};recognition.onerror=e=>showError(Error('Voix non disponible : '+String(e.error??'erreur')));recognition.start();
    };
    actions.append(analyze,speak);box.append(actions);summary.append(box);renderEvents();
  };

  const refresh=async()=>{
    select.replaceChildren();summary.replaceChildren();eventsRoot.replaceChildren();
    if(!app.activeGroup()){select.append(option('','Aucun groupe actif'));renderEvents();return;}
    if(!isManager()){select.append(option('','Accès responsable requis'));eventsRoot.append(el('p','Seuls les responsables habilités peuvent valider les règles d’assistance.','hint'));return;}
    rubrics=(await app.listRubrics()).filter(r=>r.activityPlan?.kind==='ASSISTANCE'||r.policies?.assistance);
    if(!rubrics.length){select.append(option('','Aucune rubrique Assistance'));current=undefined;loadCurrent();return;}
    for(const r of rubrics)select.append(option(r.id,r.name));loadCurrent();
  };

  const save=async(validated)=>{
    try{
      if(!current)throw Error('Aucune rubrique Assistance sélectionnée.');
      const cards=[...eventsRoot.querySelectorAll('.assistance-event-card')],read=cards.map(readEventCard).filter(x=>x.label);
      const policies=structuredClone(current.policies??{});
      policies.assistance={...(policies.assistance??{}),fundingMode:globalControls.funding.value,authorization:globalControls.authorization.value,definitionSource:globalControls.source.value,
        reviewStatus:validated?'VALIDATED':globalControls.review.value==='VALIDATED'?'DRAFT':globalControls.review.value,
        eligibleEvents:read.map(x=>x.label),eventRules:read};
      const updated=await app.updateRubricPolicies(current.id,policies);current=updated;
      notify(validated?'Modalités Assistance validées.':'Brouillon Assistance enregistré.');await refresh();
    }catch(e){showError(e);}
  };

  select.addEventListener('change',loadCurrent);
  document.getElementById('assistanceRulebookAddEvent')?.addEventListener('click',()=>{events.push(eventTemplate());renderEvents();eventsRoot.lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'});});
  document.getElementById('assistanceRulebookSaveDraft')?.addEventListener('click',()=>void save(false));
  document.getElementById('assistanceRulebookValidate')?.addEventListener('click',()=>void save(true));
  document.getElementById('openAssistanceRulebookBtn')?.addEventListener('click',()=>document.getElementById('assistanceRulebookPanel')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.getElementById('openSavingsLabBtn')?.addEventListener('click',()=>document.getElementById('savingsYieldLab')?.scrollIntoView({behavior:'smooth',block:'start'}));
  document.addEventListener('eco:group-context-changed',()=>void refresh().catch(showError));
  return{refresh};
}
