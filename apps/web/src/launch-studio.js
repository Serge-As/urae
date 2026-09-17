import {createRubricEditor,readRubricEditors} from './launch-rubrics.js';
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
    textLine(card,'Création historique',profile.origin.historicalCreatedAt||'Nouveau groupe / non renseignée');
    textLine(card,'Exercice',profile.cycle.label||profile.origin.currentExerciseLabel||'À préciser');
    textLine(card,'Calendrier',[profile.cycle.cadence,profile.cycle.meetingDay,profile.cycle.expectedSessions?profile.cycle.expectedSessions+' séance(s) prévues':''].filter(Boolean).join(' · ')||'À préciser');
    textLine(card,'Membres prévus',String(profile.members.expectedMembers??'—'));
    textLine(card,'Constitution des membres',profile.members.rosterMode||'Progressive');
    const historical=profile.origin.mode==='IMPORT_EXISTING'||Boolean(profile.origin.historicalCreatedAt);
    textLine(card,'Adhésion après création',historical?'Lien/code sécurisé → rapprochement avec la fiche membre historique':'Lien/code sécurisé → adhésion directe possible sans seconde action du responsable');
    const rubrics=getRubrics();
    textLine(card,'Rubriques principales',rubrics.map(r=>r.name).join(', ')||'Aucune');
    const rubricBox=document.createElement('div');rubricBox.className='stack';
    for(const r of rubrics){
      const line=document.createElement('article');line.className='item';const p=r.activityPlan;
      textLine(line,r.name,[p?.kind,p?.participationMode,p?.nominalAmount?.amount!==undefined?p.nominalAmount.amount+' '+(p.nominalAmount.currency||'XAF'):'',p?.sessions?p.sessions+' séance(s)':''].filter(Boolean).join(' · '));
      rubricBox.append(line);
    }
    if(rubrics.length)card.append(rubricBox);
    textLine(card,'Petites rubriques « Autres »','Inscription (temporaire au démarrage) · Timbre de prêt · Amende · personnalisables ; plusieurs possibles pour un membre pendant la même séance');
    textLine(card,'Communication',(profile.communication.channels??[]).join(', '));
    textLine(card,'Accessibilité',[profile.accessibility.ultraSimple?'Ultra Simple':'',profile.accessibility.oralAssistant?'Oral':'',profile.accessibility.lowBandwidthPriority?'2G':'',profile.accessibility.oldDevicePriority?'Ancien appareil':''].filter(Boolean).join(', ')||'Standard');
    textLine(card,'Profil bêta','BETA_OPEN : apprentissage collectif non sensible, recommandations, communautés/partenaires et préférence first-party actifs pour tous les comptes pendant la bêta');
    textLine(card,'Live Ledger','Durable Object / synchronisation Live disponibles pour tous en bêta ; fallback offline conservé');
    textLine(card,'Argent réel','DÉSACTIVÉ — aucune opération Mobile Money réelle n’est autorisée par cette création');
    const warning=document.createElement('p');warning.className='truth-notice';warning.textContent='Aucune proposition de l’assistant ne crée une transaction financière. Après création, les règles restent versionnées et modifiables selon les droits du groupe. Les données sensibles restent exclues des apprentissages collectifs et commerciaux.';card.append(warning);root.append(card);
    const confirmed=checked('previewConfirmed');byId('createGroupBtn').disabled=!confirmed;
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
      managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0,participants:undefined,
      policyDraft:r.policyDraft?structuredClone(r.policyDraft):undefined
    };
  };

  const renderSuggestions=(data)=>{
    const root=byId('launchAssistantSuggestions');root.replaceChildren();
    if(data.fingerprint)fingerprints.add(data.fingerprint);
    for(const fp of data.fingerprints??[])fingerprints.add(fp);
    const suggestions=data.suggestions??[],cards=[];
    const openNext=index=>{
      for(let i=index+1;i<cards.length;i++){
        const next=cards[i];if(next?.dataset.rubric==='true'&&next.dataset.review!=='validated'&&next.dataset.review!=='deferred'){
          const btn=next.querySelector('[data-configure-suggestion]');btn?.click();next.scrollIntoView({behavior:'smooth',block:'center'});return;
        }
      }
      toast('Toutes les rubriques détectées ont été parcourues. Vous pouvez relire le récapitulatif ou continuer.');
    };
    suggestions.forEach((s,index)=>{
      const a=document.createElement('article');a.className='item suggestion-review-card';a.dataset.rubric=String(Boolean(s.rubric));a.dataset.review='pending';
      const h=document.createElement('strong');h.textContent=s.title+' · '+Math.round(Number(s.confidence??0)*100)+'%';
      const state=document.createElement('span');state.className='pill';state.textContent=s.rubric?'À vérifier':s.category;
      const p=document.createElement('p');p.textContent=s.explanation??'';const ev=document.createElement('p');ev.className='hint';ev.textContent=s.evidence?'Source : '+s.evidence:'';
      a.append(h,state,p,ev);
      if(s.rubric){
        const config=document.createElement('div');config.className='suggestion-inline-config';config.hidden=true;a.append(config);
        const b=document.createElement('button');b.type='button';b.className='primary';b.dataset.configureSuggestion='1';
        b.textContent=s.rubric.kind==='ASSISTANCE'?'Examiner l’Assistance — détails validables plus tard':'Configurer ici';
        let editor;
        b.onclick=()=>{
          for(const other of root.querySelectorAll('.suggestion-inline-config'))if(other!==config)other.hidden=true;
          config.hidden=false;
          if(!editor){
            let plan=rubricFromSuggestion(s);
            if(plan.policyDraft?.assistance&&!plan.policyDraft.assistance.sourceFingerprint){
              const fp=[...fingerprints].slice(-1)[0];if(fp)plan.policyDraft.assistance.sourceFingerprint=fp;
            }
            const editorRoot=document.createElement('div');config.append(editorRoot);
            editor=createRubricEditor(editorRoot,{plan,onChange:()=>{}});
            if(plan.kind==='ASSISTANCE'){
              const note=document.createElement('p');note.className='truth-notice';note.textContent='Les modalités longues détectées dans le RI sont conservées comme brouillon. Vous pourrez les valider événement par événement dans le menu Assistance après création du groupe.';config.prepend(note);
            }
            const actions=document.createElement('div');actions.className='actions';
            const validate=document.createElement('button');validate.type='button';validate.className='primary';validate.textContent='Valider cette rubrique et passer à la suivante';
            validate.onclick=()=>{
              try{
                const [validated]=readRubricEditors([editor]);addRubric({plan:validated,skipFocus:true});
                a.dataset.review='validated';state.textContent='Validée';state.className='pill online';config.hidden=true;b.disabled=true;b.textContent='Rubrique validée';
                toast(validated.name+' ajoutée sans déplacement en bas de page.');openNext(index);
              }catch(error){showError(error);}
            };
            const defer=document.createElement('button');defer.type='button';defer.className='link-btn';defer.textContent=s.rubric.kind==='ASSISTANCE'?'Reporter les détails, conserver le brouillon':'Traiter plus tard';
            defer.onclick=()=>{
              try{
                if(s.rubric.kind==='ASSISTANCE'){
                  const [validated]=readRubricEditors([editor]);addRubric({plan:validated,skipFocus:true});
                  a.dataset.review='validated';state.textContent='Brouillon Assistance conservé';b.disabled=true;b.textContent='Brouillon conservé';
                }else{a.dataset.review='deferred';state.textContent='À traiter plus tard';}
                config.hidden=true;openNext(index);
              }catch(error){showError(error);}
            };
            actions.append(validate,defer);config.append(actions);
          }
          config.scrollIntoView({behavior:'smooth',block:'nearest'});
        };
        a.append(b);
      }
      cards.push(a);root.append(a);
    });
    if(!suggestions.length){const p=document.createElement('p');p.className='hint';p.textContent='Aucune règle assez claire n’a été détectée. Décrivez-la oralement ou ajoutez la rubrique manuellement.';root.append(p);}
  };

  const renderSelectedFiles=async()=>{
    const input=byId('launchGovernanceFiles'),root=byId('launchGovernanceFileList'),status=byId('launchFileStatus');
    if(!input||!root||!status)return;root.replaceChildren();const files=[...(input.files??[])];
    if(!files.length){status.textContent='Aucun document sélectionné.';return;}
    const imageFiles=files.filter(f=>f.type.startsWith('image/')||/\.(?:jpe?g|png|webp|bmp|gif)$/i.test(f.name));
    status.textContent=imageFiles.length===1?'Une seule photo sélectionnée : si le RI ou la liste de rubriques comporte plusieurs pages, ajoutez les autres images avant analyse.':' '+files.length+' fichier(s) prêt(s) pour analyse.';
    for(const file of files){
      const row=document.createElement('article');row.className='item';const strong=document.createElement('strong');strong.textContent=file.name;
      const meta=document.createElement('p');meta.className='hint';meta.textContent=(file.type||'type inconnu')+' · '+Math.max(1,Math.round(file.size/1024)).toLocaleString('fr-FR')+' Ko';
      row.append(strong,meta);root.append(row);
      if(imageFiles.includes(file)&&'createImageBitmap'in window)try{
        const bitmap=await createImageBitmap(file);const q=document.createElement('span');q.className='pill';q.textContent=bitmap.width+'×'+bitmap.height+(Math.min(bitmap.width,bitmap.height)<900?' · résolution à vérifier':' · lisibilité probable');row.append(q);bitmap.close?.();
      }catch{}
    }
  };
  const analyzeFiles=async()=>{try{
    const input=byId('launchGovernanceFiles'),status=byId('launchFileStatus'),files=[...(input?.files??[])];
    if(!files.length)throw Error('Sélectionnez au moins un document ou plusieurs photos lisibles.');
    status.textContent='Téléversement sécurisé vers R2 et extraction du contenu en cours…';
    const data=await app.analyzeGroupDocumentFiles(files);
    for(const fp of data.fingerprints??[])fingerprints.add(fp);
    if(data.combinedText&&data.combinedText.length<=120000&&!value('launchAssistantText'))byId('launchAssistantText').value=data.combinedText;
    const friendly=(data.warnings??[]).map(w=>w.startsWith('PHOTO_SET_SINGLE_IMAGE')?'Une seule photo a été reçue : vérifiez qu’aucune page du RI ou de la liste de rubriques ne manque.':w.startsWith('LEGACY_DOC')?'Ancien Word .doc archivé : préférez .docx ou PDF pour une extraction automatique complète.':w.startsWith('DOCUMENT_CONVERSION_FAILED')?'Un fichier n’a pas pu être lu automatiquement ; l’original reste archivé.':w);
    status.textContent='Analyse terminée : '+(data.files?.length??files.length)+' fichier(s), '+(data.suggestions?.length??0)+' proposition(s).'+(friendly.length?' '+friendly.join(' '):'');
    renderSuggestions(data);invalidate();toast('Document analysé. Validez maintenant les rubriques une par une, sur place.');
  }catch(e){showError(e);if(byId('launchFileStatus'))byId('launchFileStatus').textContent='Analyse non terminée.';}};
  const clearFiles=()=>{const input=byId('launchGovernanceFiles');if(input)input.value='';byId('launchGovernanceFileList')?.replaceChildren();if(byId('launchFileStatus'))byId('launchFileStatus').textContent='Fichiers retirés du brouillon local.';};

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

  let launchVoiceRecognition=null,launchVoiceActive=false;
  const startVoice=()=>{
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const status=byId('voiceStatus'),button=byId('startLaunchVoice');
    if(!SpeechRecognition){status.textContent='Reconnaissance vocale non disponible sur cet appareil. Utilisez le champ texte : aucune fonction essentielle n’en dépend.';return;}
    if(launchVoiceActive){launchVoiceActive=false;try{launchVoiceRecognition?.stop?.();}catch{}button.textContent='🎙️ Dicter sans limite courte';status.textContent='Dictée arrêtée. Vous pouvez relire puis reprendre exactement où vous étiez.';return;}
    const recognition=new SpeechRecognition();launchVoiceRecognition=recognition;launchVoiceActive=true;recognition.lang=value('projectLocale')==='en'?'en-US':'fr-FR';recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
    recognition.onstart=()=>{button.textContent='⏹ Arrêter la dictée';status.textContent='Écoute continue en cours… Parlez normalement, faites des pauses : le micro reste actif.';};
    recognition.onerror=e=>{const code=String(e.error??'erreur');if(code==='not-allowed'||code==='service-not-allowed'){launchVoiceActive=false;button.textContent='🎙️ Dicter sans limite courte';}status.textContent='Voix : '+code+'. Le texte déjà capturé est conservé.';};
    recognition.onresult=e=>{const box=byId('launchAssistantText');let finals='';let interim='';for(let i=e.resultIndex??0;i<(e.results?.length??0);i++){const txt=e.results[i]?.[0]?.transcript??'';if(e.results[i]?.isFinal)finals+=txt+' ';else interim+=txt;}if(finals.trim()){box.value=(box.value&& !/\s$/.test(box.value)?box.value+' ':box.value)+finals.trim()+' ';box.dispatchEvent(new Event('input',{bubbles:true}));}status.textContent='Écoute continue… '+(interim?'En cours : « '+interim.trim()+' »':'Texte conservé ; continuez à parler.');};
    recognition.onend=()=>{if(launchVoiceActive){setTimeout(()=>{if(!launchVoiceActive)return;try{recognition.start();}catch{}},250);}else{button.textContent='🎙️ Dicter sans limite courte';status.textContent='Dictée arrêtée. Le texte capturé reste disponible.';}};
    try{recognition.start();}catch(error){launchVoiceActive=false;button.textContent='🎙️ Dicter sans limite courte';status.textContent='Impossible de démarrer le micro : '+String(error);}
  };

  byId('launchPrevBtn')?.addEventListener('click',()=>showStep(step-1));
  byId('launchNextBtn')?.addEventListener('click',()=>showStep(step+1));
  byId('launchOrigin')?.addEventListener('change',syncOrigin);
  byId('analyzeLaunchDocument')?.addEventListener('click',()=>void analyze());
  byId('launchGovernanceFiles')?.addEventListener('change',()=>void renderSelectedFiles());
  byId('analyzeLaunchFiles')?.addEventListener('click',()=>void analyzeFiles());
  byId('clearLaunchFiles')?.addEventListener('click',clearFiles);
  byId('interpretLaunchText')?.addEventListener('click',()=>void interpret());
  byId('startLaunchVoice')?.addEventListener('click',startVoice);
  byId('ecoAiNavBtn')?.addEventListener('click',()=>setTimeout(()=>{showStep(6);byId('launchAssistantPanel')?.scrollIntoView({behavior:'smooth',block:'start'});},80));
  byId('previewConfirmed')?.addEventListener('change',renderPreview);
  for(const p of panels)p.addEventListener('input',()=>{invalidate();if(step===10)renderPreview();});
  refreshGroups();syncOrigin();showStep(1);
  return{readProfile,refreshGroups,showStep,renderPreview,afterSimulation:()=>{window.__ecoLastProjectReady=true;renderPreview();},invalidateSimulation:()=>{window.__ecoLastProjectReady=false;if(byId('createGroupBtn'))byId('createGroupBtn').disabled=true;}};
}
