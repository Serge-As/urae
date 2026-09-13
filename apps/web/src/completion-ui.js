const KIND_LABELS = {
  IDENTITY_CLAIM:['Rapprochement d’identité historique','Historical identity claim'],
  TONTINE_CYCLE:['Cycle de tontine','Tontine cycle'],
  TONTINE_SHARE:['Part / nom de tontine','Tontine share / name'],
  OBLIGATION_PLAN:['Plan d’obligations','Obligation plan'],
  LOAN:['Prêt interne','Internal loan'],
  SAVINGS_PLAN:['Plan d’épargne','Savings plan'],
  GOVERNANCE_DECISION:['Décision gouvernée','Governed decision'],
  IMPORT_BATCH:['Import historique contrôlé','Controlled historical import'],
  COMMUNITY_THREAD:['Discussion communautaire','Community thread'],
  MARKET_ORDER:['Commande de marché','Marketplace order'],
  AMOUNT_EXPLANATION:['Explication d’un montant','Amount explanation'],
  TONTINE_SCHEDULE:['Proposition de programmation','Schedule proposal'],
  SCENARIO:['Laboratoire de scénario','Scenario lab'],
  DOCUMENT:['Document gouverné','Governed document'],
  OCR_DRAFT:['Lecture papier à valider','Paper OCR draft'],
  VOICE_DRAFT:['Saisie vocale à confirmer','Voice draft'],
  OFFLINE_SNAPSHOT:['Séance préparée hors ligne','Prepared offline meeting'],
  CONFLICT:['Conflit de synchronisation','Synchronization conflict'],
  RELAY_ENVELOPE:['Paquet Relay chiffré','Encrypted Relay package'],
  CALENDAR_EVENT:['Événement calendrier','Calendar event'],
  NOTIFICATION_PREF:['Préférences de rappels','Reminder preferences'],
  RULE_COMPARISON:['Comparaison de règles','Rule comparison'],
  APPROVAL_REQUEST:['Validation multi-personnes','Multi-person approval'],
  ANOMALY:['Anomalie expliquée','Explained anomaly'],
  GROUP_BUY:['Achat groupé','Group buy'],
  SKILL_PROFILE:['Compétence / entraide','Skill / mutual help'],
  ACCESSIBILITY_PROFILE:['Profil d’accessibilité','Accessibility profile'],
  ACADEMY_EXERCISE:['Exercice Academy','Academy exercise'],
  BACKUP_PROOF:['Preuve de sauvegarde','Backup proof'],
  READINESS_PASSPORT:['Passeport de préparation','Readiness passport'],
  EXPECTATION_TRACE:['Traçabilité d’une attente','Expectation trace'],
  DIFFICULT_DAY:['Parcours jour difficile','Hard-day flow']
};

const safeJson=(value,fallback={})=>{try{return value?JSON.parse(value):fallback;}catch{return fallback;}};
const primitiveVersion=record=>Number(record?.data?.completionVersion??0);
const primitiveState=record=>String(record?.data?.completionState??'');
const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};
const article=(title,meta,body='')=>{
  const a=document.createElement('article');a.className='item';
  const h=document.createElement('strong');h.textContent=title;a.append(h);
  if(body){const p=document.createElement('p');p.textContent=body;a.append(p);}
  const s=document.createElement('small');s.textContent=meta;a.append(s);
  return a;
};

export const mountCompletionUI=({app,notify,showError,getMembers,getMeetings,getRubrics,getLocale,fmt,date})=>{
  let workflows={};
  let cycles=[],shares=[],loans=[],decisions=[],pendingSchedule=null;

  const locale=()=>getLocale()==='en'?'en':'fr';
  const tr=(fr,en)=>locale()==='en'?en:fr;
  const byId=id=>document.getElementById(id);
  const value=id=>String(byId(id)?.value??'').trim();
  const number=id=>Number(value(id));
  const nameOfMember=id=>getMembers().find(x=>x.id===id)?.displayName??id;
  const setBusy=(form,busy)=>form?.querySelectorAll('button,input,select,textarea').forEach(el=>{
    if(el.dataset.keepEnabled==='true')return;
    if(busy){el.dataset.wasDisabled=String(el.disabled);el.disabled=true;}
    else if(el.dataset.wasDisabled!==undefined){el.disabled=el.dataset.wasDisabled==='true';delete el.dataset.wasDisabled;}
  });
  const run=async(form,fn)=>{try{setBusy(form,true);await fn();}catch(e){showError(e);}finally{setBusy(form,false);}};

  const refill=(select,items,placeholder)=>{
    if(!select)return;const current=select.value;select.replaceChildren(option('',placeholder));
    for(const item of items)select.append(option(item.id,item.label));
    if(items.some(x=>x.id===current))select.value=current;
  };

  const renderTontine=async()=>{
    if(!app.activeGroup()){cycles=[];shares=[];return;}
    [cycles,shares]=await Promise.all([app.listCompletion('TONTINE_CYCLE'),app.listCompletion('TONTINE_SHARE')]);
    refill(byId('tontineShareCycle'),cycles.map(x=>({id:x.id,label:x.title})),tr('Choisir un cycle','Choose a cycle'));
    refill(byId('tontineShareMember'),getMembers().map(x=>({id:x.id,label:x.displayName})),tr('Choisir un membre','Choose a member'));
    refill(byId('tontineCycleRubric'),getRubrics().filter(x=>x.status==='ACTIVE').map(x=>({id:x.id,label:x.name})),tr('Choisir une rubrique','Choose a rubric'));
    refill(byId('tontineServeMeeting'),getMeetings().filter(x=>x.status==='open').map(x=>({id:x.id,label:x.title})),tr('Sans séance','No meeting'));
    refill(byId('tontineServeShare'),shares.filter(x=>primitiveState(x)==='SCHEDULED').map(x=>({
      id:x.id,label:x.title+' · '+tr('tour ','round ')+String(x.data.scheduledRound??'?')
    })),tr('Choisir une part programmée','Choose a scheduled share'));

    const root=byId('tontineCompletionList');if(!root)return;root.replaceChildren();
    if(!cycles.length){root.append(article(tr('Aucun cycle','No cycle'),'',tr('Créez d’abord un cycle lié à une rubrique.','Create a cycle linked to a rubric first.')));return;}
    for(const cycle of cycles){
      const related=shares.filter(x=>x.data.cycleId===cycle.id);
      const served=related.filter(x=>primitiveState(x)==='SERVED').length;
      const scheduled=related.filter(x=>primitiveState(x)==='SCHEDULED').length;
      const a=article(cycle.title,
        tr('Tours','Rounds')+': '+cycle.data.rounds+' · '+tr('Pots/tour','Pots/round')+': '+cycle.data.potsPerRound,
        tr('Parts','Shares')+': '+related.length+' · '+tr('programmées','scheduled')+': '+scheduled+' · '+tr('servies','served')+': '+served);
      root.append(a);
      for(const share of related){
        root.append(article('↳ '+share.title,
          primitiveState(share)+' · '+tr('tour','round')+' '+String(share.data.scheduledRound??'—'),
          nameOfMember(String(share.data.membershipId??''))));
      }
    }
  };

  const proposeSchedule=async()=>{
    const cycleId=value('tontineShareCycle')||cycles[0]?.id;if(!cycleId)throw Error('TONTINE_CYCLE_NOT_FOUND');
    const cycle=cycles.find(x=>x.id===cycleId);if(!cycle)throw Error('TONTINE_CYCLE_NOT_FOUND');
    const cycleShares=shares.filter(x=>x.data.cycleId===cycleId&&primitiveState(x)!=='SERVED'&&primitiveState(x)!=='CANCELLED');
    const result=await app.suggestTontineSchedule({
      shareIds:cycleShares.map(x=>x.id),rounds:Number(cycle.data.rounds),potsPerRound:Number(cycle.data.potsPerRound)
    });
    pendingSchedule={cycleId,assignments:result.assignments,warnings:result.warnings};
    const root=byId('tontineSchedulePreview');root.replaceChildren();
    const title=document.createElement('strong');title.textContent=tr('Proposition — aucune modification appliquée','Proposal — no change applied');root.append(title);
    const ul=document.createElement('ul');
    for(const x of result.assignments){const li=document.createElement('li');const share=cycleShares.find(s=>s.id===x.shareId);li.textContent=(share?.title??x.shareId)+' → '+tr('tour','round')+' '+x.round+', '+tr('pot','pot')+' '+x.slot;ul.append(li);}
    root.append(ul);
    if(result.warnings.length){const p=document.createElement('p');p.textContent=result.warnings.join(', ');root.append(p);}
    byId('applyTontineScheduleBtn').disabled=result.unassigned.length>0||!result.assignments.length;
  };

  const applySchedule=async()=>{
    if(!pendingSchedule)throw Error('NO_SCHEDULE_PROPOSAL');
    for(const x of pendingSchedule.assignments){
      const share=shares.find(s=>s.id===x.shareId);if(!share)continue;
      await app.scheduleTontineShare(share.id,x.round,primitiveVersion(share));
      const refreshed=(await app.listCompletion('TONTINE_SHARE')).find(s=>s.id===share.id);if(refreshed){const i=shares.findIndex(s=>s.id===share.id);shares[i]=refreshed;}
    }
    pendingSchedule=null;byId('applyTontineScheduleBtn').disabled=true;
    byId('tontineSchedulePreview').textContent=tr('Planning appliqué et versionné.','Schedule applied and versioned.');
    await renderTontine();notify(tr('Planning appliqué.','Schedule applied.'));
  };

  const renderLoans=async()=>{
    if(!app.activeGroup()){loans=[];decisions=[];return;}
    [loans,decisions]=await Promise.all([app.listCompletion('LOAN'),app.listCompletion('GOVERNANCE_DECISION')]);
    refill(byId('loanBorrower'),getMembers().map(x=>({id:x.id,label:x.displayName})),tr('Choisir un membre','Choose a member'));
    refill(byId('obligationMember'),getMembers().map(x=>({id:x.id,label:x.displayName})),tr('Choisir un membre','Choose a member'));
    const root=byId('loanList');if(root){root.replaceChildren();
      for(const loan of loans){
        const state=primitiveState(loan),a=article(loan.title,state,
          tr('Capital','Principal')+': '+fmt(Number(loan.data.principal??0))+' · '+tr('reste','outstanding')+': '+fmt(Number(loan.data.outstandingPrincipal??0)));
        const actions=document.createElement('div');actions.className='actions';
        if(state==='SUBMITTED'){
          const b=document.createElement('button');b.type='button';b.textContent=tr('Approuver','Approve');b.onclick=()=>void run(null,async()=>{await app.transitionCompletion(loan.id,'APPROVED',primitiveVersion(loan),{approvedAt:new Date().toISOString()});await renderLoans();});actions.append(b);
        }
        if(state==='APPROVED'){
          const b=document.createElement('button');b.type='button';b.className='primary';b.textContent=tr('Décaisser','Disburse');b.onclick=()=>void run(null,async()=>{await app.disburseLoan(loan.id,{amount:Number(loan.data.principal),expectedVersion:primitiveVersion(loan)});await renderLoans();notify(tr('Prêt décaissé dans le ledger.','Loan disbursed in the ledger.'));});actions.append(b);
        }
        if(state==='DISBURSED'||state==='REPAYING'){
          const b=document.createElement('button');b.type='button';b.textContent=tr('Rembourser','Repay');b.onclick=()=>void run(null,async()=>{
            const raw=window.prompt(tr('Capital remboursé :','Principal repaid:'),'10000');if(raw===null)return;
            const amount=Number(raw);if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_LOAN_REPAYMENT');
            await app.repayLoan(loan.id,{principalAmount:amount,expectedVersion:primitiveVersion(loan)});await renderLoans();
          });actions.append(b);
        }
        if(actions.childNodes.length)a.append(actions);root.append(a);
      }
    }
    const decisionsRoot=byId('decisionList');if(decisionsRoot){decisionsRoot.replaceChildren();
      for(const d of decisions){
        const a=article(d.title,primitiveState(d)+' · '+tr('approbations','approvals')+' '+String(d.data.approvalCount??0)+'/'+String(d.data.threshold??1),String(d.data.subject??''));
        if(primitiveState(d)==='OPEN'){
          const b=document.createElement('button');b.type='button';b.textContent=tr('Valider avec mon compte','Approve with my account');
          b.onclick=()=>void run(null,async()=>{await app.approveGovernanceDecision(d.id,primitiveVersion(d));await renderLoans();});a.append(b);
        }
        decisionsRoot.append(a);
      }
    }
  };

  const renderQuote=schedule=>{
    const root=byId('loanQuoteResult');if(!root)return;root.replaceChildren();
    for(const row of schedule){
      root.append(article('#'+row.installment,
        tr('Échéance','Due')+': '+fmt(row.due),
        tr('Capital','Principal')+' '+fmt(row.principal)+' · '+tr('intérêt','interest')+' '+fmt(row.interest)+' · '+tr('frais','fees')+' '+fmt(row.fees)));
    }
  };

  const fillCompletionKinds=()=>{
    const select=byId('completionKind');if(!select)return;const current=select.value;select.replaceChildren();
    for(const kind of Object.keys(workflows).sort()){const label=KIND_LABELS[kind]?.[locale()==='en'?1:0]??kind;select.append(option(kind,label));}
    if(current&&workflows[current])select.value=current;
  };

  const renderCompletionRecords=async()=>{
    const root=byId('completionRecords');if(!root||!app.activeGroup())return;
    const kind=value('completionKind');if(!kind)return;
    const records=await app.listCompletion(kind);root.replaceChildren();
    if(!records.length){root.append(article(tr('Aucun workflow','No workflow'),'',tr('Créez le premier élément.','Create the first item.')));return;}
    const spec=workflows[kind];
    for(const record of records.slice().reverse()){
      const state=primitiveState(record),version=primitiveVersion(record);
      const a=article(record.title,state+' · v'+version,record.summary??'');
      const actions=document.createElement('div');actions.className='actions';
      for(const next of spec?.transitions?.[state]??[]){
        const b=document.createElement('button');b.type='button';b.textContent=tr('Passer à ','Move to ')+next;
        b.onclick=()=>void run(null,async()=>{await app.transitionCompletion(record.id,next,version);await renderCompletionRecords();});actions.append(b);
      }
      if(actions.childNodes.length)a.append(actions);root.append(a);
    }
  };

  const refresh=async()=>{
    if(!workflows||!Object.keys(workflows).length){const result=await app.completionWorkflows();workflows=result.workflows;fillCompletionKinds();}
    await Promise.all([renderTontine(),renderLoans(),renderCompletionRecords()]);
  };

  byId('tontineCycleForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    await app.createTontineCycle({rubricId:value('tontineCycleRubric'),name:value('tontineCycleName'),rounds:number('tontineRounds'),potsPerRound:number('tontinePots'),nominalPotAmount:number('tontinePotAmount')});
    byId('tontineCycleName').value='';await renderTontine();notify(tr('Cycle créé.','Cycle created.'));
  });});
  byId('tontineShareForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    await app.addTontineShare({cycleId:value('tontineShareCycle'),membershipId:value('tontineShareMember'),label:value('tontineShareLabel')});
    byId('tontineShareLabel').value='';await renderTontine();notify(tr('Part ajoutée.','Share added.'));
  });});
  byId('suggestTontineScheduleBtn')?.addEventListener('click',()=>void run(null,proposeSchedule));
  byId('applyTontineScheduleBtn')?.addEventListener('click',()=>void run(null,applySchedule));
  byId('tontineServeForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    const share=shares.find(x=>x.id===value('tontineServeShare'));if(!share)throw Error('TONTINE_SHARE_NOT_FOUND');
    await app.serveTontineShare(share.id,{amount:number('tontineServeAmount'),expectedVersion:primitiveVersion(share),meetingId:value('tontineServeMeeting')||undefined});
    await renderTontine();notify(tr('Pot servi et comptabilisé.','Pot served and posted to the ledger.'));
  });});
  byId('readinessBtn')?.addEventListener('click',()=>void run(null,async()=>{
    const p=await app.createReadinessPassport();const blockers=safeJson(p.data.blockers,[]);
    byId('readinessResult').textContent=p.data.ready===true?tr('Groupe prêt : aucun blocage détecté.','Group ready: no blocker detected.'):tr('À compléter : ','To complete: ')+blockers.join(', ');
  }));

  byId('loanForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    const principal=number('loanPrincipal'),installments=number('loanInstallments'),rate=Math.round(number('loanRate')*100),fees=number('loanFees');
    const quote=await app.quoteLoan({principal,installments,annualRateBasisPoints:rate,feesTotal:fees,method:value('loanMethod')});
    renderQuote(quote.schedule);
    let loan=await app.createCompletion('LOAN',{title:tr('Prêt de ','Loan of ')+fmt(principal),data:{
      principal,currency:'XAF',borrowerMembershipId:value('loanBorrower'),installments,annualRateBasisPoints:rate,feesTotal:fees,method:value('loanMethod'),schedule:quote.schedule,outstandingPrincipal:0
    }});
    loan=await app.transitionCompletion(loan.id,'SUBMITTED',primitiveVersion(loan));await renderLoans();notify(tr('Demande de prêt créée.','Loan request created.'));
  });});
  byId('obligationForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    await app.createObligation({membershipId:value('obligationMember'),type:'CONTRIBUTION_DUE',title:value('obligationTitle'),
      dueAt:value('obligationDueAt')?new Date(value('obligationDueAt')).toISOString():undefined,
      amount:value('obligationAmount')?number('obligationAmount'):undefined});
    byId('obligationTitle').value='';notify(tr('Obligation créée dans la boîte de travail.','Obligation created in the work inbox.'));
  });});
  byId('decisionForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    let d=await app.createGovernanceDecision({title:value('decisionTitle'),subject:value('decisionSubject'),threshold:number('decisionThreshold')});
    d=await app.transitionCompletion(d.id,'OPEN',primitiveVersion(d));await renderLoans();notify(tr('Décision ouverte.','Decision opened.'));
  });});

  byId('completionForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    const raw=value('completionData');let data={};if(raw){try{data=JSON.parse(raw);}catch{throw Error('INVALID_JSON');}}
    await app.createCompletion(value('completionKind'),{title:value('completionTitle'),summary:value('completionSummary')||undefined,data});
    byId('completionTitle').value='';byId('completionSummary').value='';byId('completionData').value='';await renderCompletionRecords();notify(tr('Workflow créé.','Workflow created.'));
  });});
  byId('completionKind')?.addEventListener('change',()=>void renderCompletionRecords().catch(showError));
  byId('completionReload')?.addEventListener('click',()=>void refresh().catch(showError));

  const setLocale=()=>{fillCompletionKinds();void refresh().catch(showError);};
  return{refresh,setLocale};
};
