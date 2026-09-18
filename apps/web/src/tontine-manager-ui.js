const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const num=id=>Number(value(id));

export function mountTontineManagerUI({app,getRubrics,getMembers,notify=()=>{},showError=console.error,fmt=n=>String(n),isManager=()=>false}){
  const cycleForm=document.getElementById('tontineCycleForm'),shareForm=document.getElementById('tontineShareForm'),root=document.getElementById('tontineManagerList');
  if(!cycleForm||!shareForm||!root)return{refresh:async()=>{}};
  let cycles=[],shares=[],liveRubrics=[];
  const option=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
  const tontineRubrics=()=>((liveRubrics.length?liveRubrics:getRubrics())??[]).filter(r=>r.status!=='ARCHIVED'&&r.activityPlan?.kind==='TONTINE');
  const potAmountFor=r=>{
    const plan=r?.activityPlan??{};
    if(plan.contributionMode&&plan.contributionMode!=='MONEY')return undefined;
    const nominal=Number(plan.nominalAmount?.amount??0),parts=Number(plan.shareCount??plan.memberCount??0),pots=Math.max(1,Number(plan.potCount??1));
    if(!(nominal>0&&parts>0))return undefined;
    return Math.round(nominal*parts/pots);
  };
  const explainPot=()=>{
    const input=document.getElementById('tontineCycleAmount');if(!input)return;
    let hint=document.getElementById('tontinePotExplanation');
    if(!hint){hint=el('small','');hint.id='tontinePotExplanation';hint.className='hint';input.closest('label')?.append(hint);}
    const rubric=tontineRubrics().find(r=>r.id===value('tontineCycleRubric'));
    if(!rubric){hint.textContent='Choisissez d’abord une Tontine.';return;}
    const cycleName=document.getElementById('tontineCycleName');if(cycleName&&(!cycleName.value||cycleName.dataset.autoName==='1')){cycleName.value=rubric.name+' — exercice '+new Date().getFullYear();cycleName.dataset.autoName='1';}
    const plan=rubric.activityPlan??{},nominal=Number(plan.nominalAmount?.amount??0),parts=Number(plan.shareCount??plan.memberCount??0),pots=Math.max(1,Number(plan.potCount??1)),computed=potAmountFor(rubric);
    if(computed){
      input.value=String(computed);
      const potsInput=document.getElementById('tontineCyclePots');if(potsInput&&Number(plan.potCount)>0)potsInput.value=String(plan.potCount);
      if(!value('tontineCycleRounds')){const rounds=Math.max(1,Number(plan.sessions??plan.duration?.value??0));if(rounds)document.getElementById('tontineCycleRounds').value=String(rounds);}
      hint.textContent=`Montant total prévu pour un bénéficiaire : ${nominal.toLocaleString('fr-FR')} × ${parts} part(s) cotisantes ÷ ${pots} pot(s) servi(s) par tour = ${computed.toLocaleString('fr-FR')} F CFA. Vous pouvez l’ajuster si la règle du groupe diffère.`;
    }else{
      hint.textContent=plan.contributionMode&&plan.contributionMode!=='MONEY'?'Tontine en nature : décrivez la quantité/valeur du lot dans la rubrique ; ce champ monétaire n’est pas calculé automatiquement.':'Renseignez la valeur nominale et le nombre de parts dans la rubrique pour calculer le pot automatiquement.';
    }
  };
  const populate=()=>{
    const rubric=document.getElementById('tontineCycleRubric'),cycle=document.getElementById('tontineShareCycle'),member=document.getElementById('tontineShareMember');
    const previousRubric=rubric.value,previousCycle=cycle.value,previousMember=member.value;
    rubric.replaceChildren(option('','Choisir une rubrique Tontine'));
    for(const r of tontineRubrics())rubric.append(option(r.id,r.name));
    if([...rubric.options].some(o=>o.value===previousRubric))rubric.value=previousRubric;
    cycle.replaceChildren(option('','Choisir un cycle'));for(const c of cycles)cycle.append(option(c.id,c.title));
    if([...cycle.options].some(o=>o.value===previousCycle))cycle.value=previousCycle;
    member.replaceChildren(option('','Choisir un membre'));for(const m of getMembers())member.append(option(m.id,m.displayName));
    if([...member.options].some(o=>o.value===previousMember))member.value=previousMember;
    if(!rubric.value&&rubric.options.length===2)rubric.selectedIndex=1;
    if(!cycle.value&&cycle.options.length===2)cycle.selectedIndex=1;
    if(!member.value&&member.options.length===2)member.selectedIndex=1;
    explainPot();
  };
  const renderCatalog=()=>{
    const catalog=document.getElementById('tontineRubricCatalog');if(!catalog)return;catalog.replaceChildren();
    const rows=tontineRubrics();if(!rows.length){catalog.append(el('p','Aucune rubrique Tontine dans ce groupe.','hint'));return;}
    for(const r of rows){const p=r.activityPlan??{},a=el('article',undefined,'item'),parts=Number(p.shareCount??p.memberCount??0),nominal=Number(p.nominalAmount?.amount??0),pots=Math.max(1,Number(p.potCount??1)),total=potAmountFor(r);a.append(el('strong',r.name),el('p',`${nominal.toLocaleString('fr-FR')} F × ${parts} part(s) ÷ ${pots} pot(s) = ${total===undefined?'—':total.toLocaleString('fr-FR')+' F'}`));const choose=el('button','Configurer cette Tontine','secondary');choose.type='button';choose.onclick=()=>{const s=document.getElementById('tontineCycleRubric');if(s){s.value=r.id;s.dispatchEvent(new Event('change'));s.scrollIntoView({behavior:'smooth',block:'center'});}};a.append(choose);catalog.append(a);}
  };
  const renderRanking=()=>{
    const box=document.getElementById('tontineRankingList');if(!box)return;box.replaceChildren();if(!cycles.length){box.append(el('p','Créez d’abord un exercice / cycle pour classer les bénéficiaires.','hint'));return;}
    for(const cycle of cycles){const card=el('article',undefined,'item');card.append(el('strong',cycle.title));const related=shares.filter(s=>s.data?.cycleId===cycle.id).sort((a,b)=>Number(a.data?.scheduledRound??999)-Number(b.data?.scheduledRound??999)||Number(a.data?.scheduledSlot??999)-Number(b.data?.scheduledSlot??999));
      if(!related.length){card.append(el('p','Aucun bénéficiaire / part ajouté.','hint'));box.append(card);continue;}let rank=0;for(const share of related){rank++;const m=getMembers().find(x=>x.id===share.data?.membershipId),row=el('div',undefined,'result-row'),left=el('span',`${rank}. ${m?.displayName??share.data?.membershipId??'Membre'} · ${share.title}`),right=el('strong',share.data?.scheduledRound?`Tour ${share.data.scheduledRound} · pot ${share.data?.scheduledSlot??'—'}`:'Non classé');row.append(left,right);if(isManager()&&String(share.data?.completionState??'')!=='SERVED'){const b=el('button','Classer / déplacer','link-btn');b.type='button';b.onclick=()=>void(async()=>{try{const raw=prompt('Numéro du tour / rang',String(share.data?.scheduledRound??rank));if(raw===null)return;const round=Number(raw);if(!Number.isSafeInteger(round)||round<1)throw Error('Rang invalide.');await app.scheduleTontineShare(share.id,round,Number(share.data?.completionVersion??1));notify('Classement mis à jour.');await refresh();}catch(e){showError(e);}})();row.append(b);}card.append(row);}box.append(card);}
  };
  const render=()=>{
    renderCatalog();renderRanking();root.replaceChildren();
    if(!app.activeGroup()){root.append(el('p','Sélectionnez un groupe.','hint'));return;}
    if(!tontineRubrics().length){root.append(el('p','Ce groupe n’a encore aucune rubrique Tontine active. Créez ou activez une rubrique Tontine avant de créer un cycle.','truth-notice'));return;}
    if(!cycles.length){root.append(el('p','Aucun cycle Tontine permanent enregistré. Créez-en un depuis une rubrique Tontine du groupe.','hint'));return;}
    for(const cycle of cycles){
      const card=el('article',undefined,'item'),data=cycle.data??{};
      card.append(el('strong',cycle.title),el('p',(data.rounds??'—')+' tour(s) · '+(data.potsPerRound??'—')+' pot(s) par tour'+(data.nominalPotAmount?' · pot prévu '+fmt(Number(data.nominalPotAmount)):'') ));
      const list=el('div',undefined,'stack'),own=shares.filter(s=>s.data?.cycleId===cycle.id).sort((a,b)=>Number(a.data?.scheduledRound??999)-Number(b.data?.scheduledRound??999));
      for(const share of own){
        const row=el('article',undefined,'item'),m=getMembers().find(x=>x.id===share.data?.membershipId),state=String(share.data?.completionState??'REGISTERED');
        row.append(el('strong',share.title),el('p',(m?.displayName??share.data?.membershipId??'Membre')+' · '+state+' · tour '+(share.data?.scheduledRound??'non programmé')));
        if(isManager()){
          const actions=el('div',undefined,'actions');
          if(state!=='SERVED'&&state!=='CANCELLED'){
            const schedule=el('button','Programmer / reprogrammer','secondary');schedule.type='button';schedule.onclick=()=>void(async()=>{try{const raw=prompt('Numéro du tour',String(share.data?.scheduledRound??1));if(raw===null)return;const round=Number(raw);if(!Number.isSafeInteger(round)||round<1)throw Error('Le numéro du tour doit être un entier positif.');await app.scheduleTontineShare(share.id,round,Number(share.data?.completionVersion??1));notify('Part programmée.');await refresh();}catch(e){showError(e);}})();actions.append(schedule);
          }
          if(state==='SCHEDULED'){
            const serve=el('button','Servir le pot','primary');serve.type='button';serve.onclick=()=>void(async()=>{try{const raw=prompt('Montant réellement décaissé (F CFA)',String(data.nominalPotAmount??''));if(raw===null)return;const amount=Number(raw);if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Le montant réellement décaissé doit être positif.');await app.serveTontineShare(share.id,{amount,expectedVersion:Number(share.data?.completionVersion??1)});notify('Pot servi avec preuve Ledger canonique.');await refresh();}catch(e){showError(e);}})();actions.append(serve);
          }
          if(state!=='SERVED'&&state!=='CANCELLED'){
            const cancel=el('button','Annuler la part','link-btn');cancel.type='button';cancel.onclick=()=>void(async()=>{try{await app.transitionCompletion(share.id,'CANCELLED',Number(share.data?.completionVersion??1),{},'Annulation depuis le gestionnaire Tontines');notify('Part annulée sans effacer son historique.');await refresh();}catch(e){showError(e);}})();actions.append(cancel);
          }
          row.append(actions);
        }
        list.append(row);
      }
      if(!own.length)list.append(el('p','Aucune part enregistrée.','hint'));card.append(list);root.append(card);
    }
  };
  const refresh=async()=>{
    if(!app.activeGroup()){cycles=[];shares=[];liveRubrics=[];populate();render();return;}
    [cycles,shares,liveRubrics]=await Promise.all([app.listCompletion('TONTINE_CYCLE'),app.listCompletion('TONTINE_SHARE'),app.listRubrics()]);populate();render();
  };
  document.getElementById('tontineCycleRubric')?.addEventListener('change',explainPot);
  document.getElementById('tontineCycleName')?.addEventListener('input',e=>{e.currentTarget.dataset.autoName='0';});
  document.getElementById('tontineCyclePots')?.addEventListener('input',explainPot);
  cycleForm.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    const rubricId=value('tontineCycleRubric');if(!rubricId)throw Error('Choisissez une rubrique Tontine avant de créer le cycle.');
    const rubric=tontineRubrics().find(r=>r.id===rubricId);if(!rubric)throw Error('La rubrique choisie n’est pas une rubrique Tontine active.');
    const rounds=num('tontineCycleRounds'),potsPerRound=num('tontineCyclePots');if(!Number.isSafeInteger(rounds)||rounds<1||!Number.isSafeInteger(potsPerRound)||potsPerRound<1)throw Error('Renseignez un nombre de tours et de pots valide.');
    await app.createTontineCycle({rubricId,name:value('tontineCycleName')||rubric.name,rounds,potsPerRound,nominalPotAmount:value('tontineCycleAmount')?num('tontineCycleAmount'):potAmountFor(rubric)});
    notify('Cycle Tontine créé.');cycleForm.reset();await refresh();
  }catch(err){showError(err);}})();});
  shareForm.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    const cycleId=value('tontineShareCycle');if(!cycleId)throw Error('Créez ou sélectionnez d’abord un cycle Tontine.');
    if(!cycles.some(c=>c.id===cycleId))throw Error('Le cycle sélectionné n’existe plus. Actualisez la page avant de continuer.');
    const membershipId=value('tontineShareMember');if(!membershipId)throw Error('Choisissez le membre qui porte cette part.');
    await app.addTontineShare({cycleId,membershipId,label:value('tontineShareLabel')});
    notify('Part Tontine ajoutée.');document.getElementById('tontineShareLabel').value='';await refresh();
  }catch(err){showError(err);}})();});
  document.getElementById('tontineRubricCreateForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    const name=value('tontineRubricCreateName'),nominal=num('tontineRubricCreateNominal'),sharesCount=num('tontineRubricCreateShares'),pots=num('tontineRubricCreatePots');if(!name||!Number.isSafeInteger(nominal)||nominal<0||!Number.isSafeInteger(sharesCount)||sharesCount<1||!Number.isSafeInteger(pots)||pots<1||pots>sharesCount)throw Error('Vérifiez le nom, le montant, les parts et les pots.');
    const model={ruleRealityStatus:'UNKNOWN',targetMode:'OPEN',mandatoryForAbsentees:false,shortfallHandling:'LEAVE_SHORT',payoutMode:'COLLECTED_ONLY',immediateFullPayout:false};
    const created=await app.createRubric({name,model}),sessions=Math.max(1,Math.ceil(sharesCount/pots)),key='tontine_'+Date.now().toString(36);
    await app.updateRubricActivityPlan(created.id,{key,name,kind:'TONTINE',nominalAmount:{currency:'XAF',amount:nominal},amountBasis:'PER_SHARE',participationMode:'OPTIONAL',contributionMode:'MONEY',memberCount:sharesCount,shareCount:sharesCount,potCount:pots,sessions,duration:{value:sessions,unit:'SESSIONS'},managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0});
    notify('Rubrique Tontine créée dans ce groupe.');e.currentTarget.reset();await refresh();const s=document.getElementById('tontineCycleRubric');if(s){s.value=created.id;s.dispatchEvent(new Event('change'));}
  }catch(err){showError(err);}})();});
  return{refresh};
}
