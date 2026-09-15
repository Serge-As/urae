const byId=id=>document.getElementById(id);
const value=id=>String(byId(id)?.value??'').trim();
const checked=id=>Boolean(byId(id)?.checked);
const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};

export function mountLaunchStudio({app,getGroups,getRubrics,addRubric,invalidate,toast,showError}){
  let step=1;
  const fingerprints=new Set();
  const panels=[...document.querySelectorAll('[data-launch-step]')];
  const indicators=[...document.querySelectorAll('[data-launch-indicator]')];

  const showStep=next=>{
    step=Math.max(1,Math.min(10,Number(next)||1));
    for(const p of panels)p.hidden=Number(p.dataset.launchStep)!==step;
    for(const i of indicators){
      const n=Number(i.dataset.launchIndicator);i.classList.toggle('active',n===step);i.classList.toggle('done',n<step);
    }
    byId('launchPrevBtn').disabled=step===1;
    byId('launchNextBtn').hidden=step===10;
    byId('launchStepStatus').textContent='Étape '+step+' sur 10';
    if(step===10)renderPreview();
  };

  const syncOrigin=()=>{
    const mode=value('launchOrigin');
    byId('sourceGroupWrap').hidden=mode!=='TRANSFORM_REGISTERED';
    byId('historicalCreatedAtWrap').hidden=mode==='NEW';
    byId('currentExerciseLabelWrap').hidden=mode==='NEW';
    byId('historyNoteWrap').hidden=mode==='NEW';
    if(mode==='IMPORT_EXISTING'&&byId('rosterMode'))byId('rosterMode').value='HISTORICAL_RECONCILIATION';
    invalidate();
  };

  const refreshGroups=()=>{
    const select=byId('sourceGroupId');if(!select)return;const previous=select.value;select.replaceChildren();
    select.append(option('','Choisir la tontine enregistrée'));
    for(const group of getGroups().filter(g=>['rotating_tontine','in_kind_tontine'].includes(g.kind)))select.append(option(group.id,group.name));
    if([...select.options].some(o=>o.value===previous))select.value=previous;
  };

  const communication=()=>['IN_APP','PRINT','SMS','WHATSAPP','TELEGRAM'].filter(k=>({
    IN_APP:'channelInApp',PRINT:'channelPrint',SMS:'channelSms',WHATSAPP:'channelWhatsapp',TELEGRAM:'channelTelegram'
  })[k]&&checked(({IN_APP:'channelInApp',PRINT:'channelPrint',SMS:'channelSms',WHATSAPP:'channelWhatsapp',TELEGRAM:'channelTelegram'})[k]));

  const readProfile=()=>({
    origin:{
      mode:value('launchOrigin')||'NEW',
      sourceGroupId:value('launchOrigin')==='TRANSFORM_REGISTERED'?(value('sourceGroupId')||undefined):undefined,
      historicalCreatedAt:value('historicalCreatedAt')||undefined,
      currentExerciseLabel:value('currentExerciseLabel')||undefined,
      historyNote:value('historyNote')||undefined
    },
    cycle:{
      label:value('cycleLabel')||undefined,startsAt:value('cycleStartsAt')||undefined,
      expectedSessions:Number(value('cycleExpectedSessions')||0)||undefined,cadence:value('cycleCadence')||undefined,
      meetingDay:value('meetingDay')||undefined,physicalMeetingExpected:checked('physicalMeetingExpected')
    },
    members:{
      expectedMembers:Number(value('expectedMembers')||0)||undefined,rosterMode:value('rosterMode')||undefined,
      allowWaitingList:checked('allowWaitingList'),allowProbation:checked('allowProbation')
    },
    communication:{channels:communication(),publishMemberStatements:checked('publishMemberStatements')},
    accessibility:{ultraSimple:checked('ultraSimpleMode'),oralAssistant:checked('oralAssistant'),lowBandwidthPriority:checked('lowBandwidthPriority'),oldDevicePriority:checked('oldDevicePriority'),preferredLocale:value('projectLocale')||'fr'},
    sourceDocumentFingerprints:[...fingerprints],
    previewConfirmed:checked('previewConfirmed')
  });

  const textLine=(root,label,value)=>{
    const row=document.createElement('p');const b=document.createElement('strong');b.textContent=label+' : ';row.append(b,document.createTextNode(value||'—'));root.append(row);
  };
  const renderPreview=()=>{
    const root=byId('launchPreview');if(!root)return;root.replaceChildren();const profile=readProfile();
    const card=document.createElement('article');card.className='item';
    textLine(card,'Origine',profile.origin.mode);
    textLine(card,'Groupe',value('projectName'));
    textLine(card,'Famille',value('groupKind'));
    textLine(card,'Gouvernance',value('governanceModel'));
    textLine(card,'Exercice',profile.cycle.label||profile.origin.currentExerciseLabel||'À préciser');
    textLine(card,'Membres prévus',String(profile.members.expectedMembers??'—'));
    textLine(card,'Rubriques',getRubrics().map(r=>r.name).join(', ')||'Aucune');
    textLine(card,'Communication',(profile.communication.channels??[]).join(', '));
    textLine(card,'Accessibilité',[profile.accessibility.ultraSimple?'Ultra Simple':'',profile.accessibility.oralAssistant?'Oral':'',profile.accessibility.lowBandwidthPriority?'2G':'',profile.accessibility.oldDevicePriority?'Ancien appareil':''].filter(Boolean).join(', ')||'Standard');
    const warning=document.createElement('p');warning.className='truth-notice';warning.textContent='Aucune proposition de l’assistant ne crée une transaction financière. Après création, les règles restent versionnées et modifiables selon les droits du groupe.';card.append(warning);root.append(card);
    const confirmed=checked('previewConfirmed');byId('createGroupBtn').disabled=!confirmed||!window.__ecoLastProjectReady;
  };

  const rubricFromSuggestion=s=>{
    const r=s.rubric??{};const kind=r.kind??'OTHER',isTontine=kind==='TONTINE';
    const members=Number(value('expectedMembers')||1)||1;
    return{
      key:crypto.randomUUID(),name:r.name??s.title,kind,
      nominalAmount:{currency:'XAF',amount:Number(r.nominalAmount??0)},amountBasis:isTontine?'PER_SHARE':'PER_MEMBER',
      participationMode:r.participationMode??'RULE_BASED',contributionMode:r.contributionMode??'MONEY',
      contributionLabel:r.contributionLabel,contributionUnit:r.contributionUnit,contributionQuantity:r.contributionQuantity,
      contextNote:[r.contextNote,s.evidence?'Source RI : '+s.evidence:''].filter(Boolean).join('\n').slice(0,1000),
      memberCount:members,shareCount:isTontine?members:undefined,potCount:isTontine?1:undefined,
      sessions:Number(value('cycleExpectedSessions')||12)||12,duration:{value:Number(value('cycleExpectedSessions')||12)||12,unit:'SESSIONS'},
      managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0,participants:undefined
    };
  };

  const renderSuggestions=(data)=>{
    const root=byId('launchAssistantSuggestions');root.replaceChildren();
    if(data.fingerprint)fingerprints.add(data.fingerprint);
    for(const s of data.suggestions??[]){
      const a=document.createElement('article');a.className='item';
      const h=document.createElement('strong');h.textContent=s.title+' · '+Math.round(Number(s.confidence??0)*100)+'%';
      const p=document.createElement('p');p.textContent=s.explanation??'';const ev=document.createElement('p');ev.className='hint';ev.textContent=s.evidence?'Source : '+s.evidence:'';
      a.append(h,p,ev);
      if(s.rubric){const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='Ajouter comme rubrique à vérifier';b.onclick=()=>{addRubric({plan:rubricFromSuggestion(s)});toast('Proposition ajoutée au brouillon. Vérifiez-la avant simulation.');};a.append(b);}
      root.append(a);
    }
    if(!(data.suggestions??[]).length){const p=document.createElement('p');p.className='hint';p.textContent='Aucune règle assez claire n’a été détectée. Décrivez-la oralement ou ajoutez la rubrique manuellement.';root.append(p);}
  };

  const analyze=async()=>{try{const text=value('launchAssistantText');if(!text)throw Error('Ajoutez le texte du règlement ou une description.');renderSuggestions(await app.analyzeGroupDocument(text));}catch(e){showError(e);}};
  const interpret=async()=>{try{
    const text=value('launchAssistantText');if(!text)throw Error('Décrivez le groupe avant de lancer l’assistant.');
    const {draft}=await app.interpretGroupLaunch(text);const root=byId('launchAssistantSuggestions');root.replaceChildren();
    const a=document.createElement('article');a.className='item';const p=document.createElement('p');p.textContent='Brouillon compris : '+JSON.stringify(draft).replace(/[{}"]/g,' ');a.append(p);
    const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='Appliquer seulement ces champs au brouillon';
    b.onclick=()=>{
      if(draft.origin?.mode)byId('launchOrigin').value=draft.origin.mode;
      if(draft.family)byId('groupKind').value=draft.family;
      if(draft.members?.expectedMembers)byId('expectedMembers').value=String(draft.members.expectedMembers);
      if(draft.cycle?.cadence)byId('cycleCadence').value=draft.cycle.cadence;
      if(draft.accessibility?.ultraSimple)byId('ultraSimpleMode').checked=true;
      if(draft.accessibility?.oralAssistant)byId('oralAssistant').checked=true;
      if(draft.accessibility?.lowBandwidthPriority)byId('lowBandwidthPriority').checked=true;
      if(draft.accessibility?.oldDevicePriority)byId('oldDevicePriority').checked=true;
      syncOrigin();invalidate();toast('Brouillon appliqué. Relisez chaque étape avant de continuer.');
    };a.append(b);root.append(a);
  }catch(e){showError(e);}};

  const startVoice=()=>{
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const status=byId('voiceStatus');
    if(!SpeechRecognition){status.textContent='Reconnaissance vocale non disponible sur cet appareil. Utilisez le champ texte : aucune fonction essentielle n’en dépend.';return;}
    const recognition=new SpeechRecognition();recognition.lang=value('projectLocale')==='en'?'en-US':'fr-FR';recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onstart=()=>status.textContent='Écoute en cours… Parlez du groupe, de ses membres, rubriques ou règles.';
    recognition.onerror=e=>status.textContent='Voix non disponible : '+String(e.error??'erreur')+'. Vous pouvez continuer au clavier.';
    recognition.onresult=e=>{const transcript=e.results?.[0]?.[0]?.transcript??'';const box=byId('launchAssistantText');box.value=(box.value?box.value+'\n':'')+transcript;status.textContent='Texte capturé. Relisez-le avant de demander une interprétation.';};
    recognition.onend=()=>{if(!status.textContent.includes('capturé'))status.textContent='Écoute terminée.';};
    recognition.start();
  };

  byId('launchPrevBtn')?.addEventListener('click',()=>showStep(step-1));
  byId('launchNextBtn')?.addEventListener('click',()=>showStep(step+1));
  byId('launchOrigin')?.addEventListener('change',syncOrigin);
  byId('analyzeLaunchDocument')?.addEventListener('click',()=>void analyze());
  byId('interpretLaunchText')?.addEventListener('click',()=>void interpret());
  byId('startLaunchVoice')?.addEventListener('click',startVoice);
  byId('previewConfirmed')?.addEventListener('change',renderPreview);
  for(const p of panels)p.addEventListener('input',()=>{invalidate();if(step===10)renderPreview();});
  syncOrigin();showStep(1);
  return{readProfile,refreshGroups,showStep,renderPreview,afterSimulation:()=>{window.__ecoLastProjectReady=true;renderPreview();},invalidateSimulation:()=>{window.__ecoLastProjectReady=false;if(byId('createGroupBtn'))byId('createGroupBtn').disabled=true;}};
}
