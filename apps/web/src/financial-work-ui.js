import {openSessionRehearsal} from './session-rehearsal.js';
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
export function createFinancialWorkUI({app,tx,notify,summary,edit,resume,waitForEntries=async()=>{},isLiveConnected=()=>false}){
  const modes=new Map(),passages=new Map();let current=null,busy=null;
  const scope=(meetingId)=>JSON.stringify([app.currentActor(),app.activeGroup(),meetingId]);
  const prompt=({title,content,actions,loading})=>new Promise(resolve=>{
    const previous=document.activeElement,d=node('dialog',undefined,'eco-work-dialog');d.append(node('h2',title));if(content)d.append(content);
    const controls=node('div',undefined,'eco-work-actions');for(const action of actions){const b=node('button',action.label,action.primary?'primary':'secondary');b.type='button';if(action.value===false)b.dataset.return='1';b.onclick=()=>{d.close();d.remove();previous?.focus?.();resolve(action.value);};controls.append(b);}d.append(controls);
    d.addEventListener('cancel',()=>{d.remove();resolve(null);},{once:true});document.body.append(d);d.showModal();
    if(loading){for(const b of controls.querySelectorAll('button'))b.disabled=true;void loading(content).then(()=>{for(const b of controls.querySelectorAll('button'))b.disabled=false;}).catch(error=>{content.replaceChildren(node('p',tx('La synthèse ne peut pas encore être chargée. Vos saisies validées sont conservées. Réessayez.','The summary cannot be loaded yet. Your confirmed entries are saved. Please retry.')));for(const b of controls.querySelectorAll('[data-return]'))b.disabled=false;notify(String(error.message));});}
  });
  const toolbar=()=>{
    const hosts=[...document.querySelectorAll('[data-canonical-financial-host="1"][data-canonical-table-ready="1"]')];
    for(const root of hosts){
      let bar=root.querySelector(':scope > .eco-work-toolbar');if(!bar){bar=node('div',undefined,'eco-work-toolbar');root.prepend(bar);}bar.replaceChildren();
      const meetingId=root.dataset.meetingId||current?.meetingId||'',mode=meetingId?modes.get(scope(meetingId)):null;
      const label=mode==='REUNION'?tx('Réunion','Meeting'):mode==='HORS_REUNION'?tx('Hors réunion','Outside meeting'):tx('Mode à choisir','Choose a mode');
      const status=navigator.onLine===false?tx('hors ligne · saisies conservées ici','offline · entries saved here'):isLiveConnected()?tx('Live connecté','Live connected'):tx('connexion Live en attente','Live connection pending');
      const indicator=node('strong',label+' · '+status);indicator.setAttribute('role','status');bar.append(indicator);
      const review=node('button',tx('Vérifier le membre et terminer','Review member and finish'),'secondary');review.type='button';review.disabled=!current||Boolean(meetingId&&current.meetingId!==meetingId);review.onclick=()=>void finish().catch(e=>notify(String(e.message)));bar.append(review);
      const change=node('button',tx('Choisir le mode','Choose mode'),'secondary');change.type='button';change.disabled=!meetingId;change.onclick=()=>void choose(meetingId,true).catch(e=>notify(String(e.message)));bar.append(change);
      const practice=node('button',tx('S’entraîner sans toucher la caisse','Practice without changing the cashbook'),'secondary eco-session-practice-open');practice.type='button';practice.onclick=()=>openSessionRehearsal({tx,engineRequest:input=>app.engineRehearsal(input),scope:()=>JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]),getReleaseVersion:()=>document.querySelector('meta[name="eco-release"]')?.content||'1.5.2.37-engine-rehearsal'});bar.append(practice);
    }
  };
  const choose=async(meetingId,change=false)=>{
    const key=scope(meetingId);if(modes.has(key)&&!change)return modes.get(key);
    let context;try{context=(await app.financialWorkContext(meetingId)).context;}catch{}
    if(context&&!change){modes.set(key,context.mode);window.dispatchEvent(new CustomEvent('eco:financial-work-mode',{detail:context}));return context.mode;}
    const content=node('p',tx('Les montants sont synchronisés immédiatement dans les deux modes. En réunion, le contrôle Live est renforcé et la notification est regroupée au départ du membre.','Amounts synchronize immediately in both modes. Meeting mode strengthens Live monitoring and groups notifications when leaving a member.'));
    const mode=await prompt({title:tx('Comment travaillez-vous sur cette séance ?','How are you working on this meeting?'),content,actions:[{label:tx('En réunion','In a meeting'),value:'REUNION',primary:true},{label:tx('Hors réunion','Outside a meeting'),value:'HORS_REUNION'}]});if(!mode)return null;
    await app.chooseFinancialWorkMode(meetingId,mode,change);modes.set(key,mode);window.dispatchEvent(new CustomEvent('eco:financial-work-mode',{detail:{meetingId,mode}}));void resume();toolbar();return mode;
  };
  const finish=async()=>{
    if(!current)return true;const selected={...current},key=JSON.stringify([scope(selected.meetingId),selected.membershipId]),changed=passages.get(key)??new Set();
    let data,modified=null;const content=node('div');content.append(node('p',tx('Préparation de la synthèse… Les validations en cours se terminent avant son affichage.','Preparing summary… Entries being saved will finish before it is displayed.')));
    // Open synchronously on the other member's focus, before a network wait or
    // any typing. The modal never gates persistence of a previous validation.
    const result=await prompt({title:tx('Synthèse du membre avant de continuer','Review member before continuing'),content,actions:[{label:tx('Valider la synthèse et continuer','Confirm summary and continue'),value:true,primary:true},{label:tx('Revenir à la saisie','Return to entry'),value:false}],loading:async()=>{
      await waitForEntries(selected.meetingId,selected.membershipId);
      if(navigator.onLine!==false)await resume();
      data=await summary(selected.meetingId,selected.membershipId,[...changed]);const table=node('table',undefined,'eco-work-summary');const head=node('tr');for(const label of [tx('Rubrique','Category'),tx('Avant la séance','Before meeting'),tx('Séance actuelle','Current meeting'),tx('Total','Total'),tx('Action','Action')])head.append(node('th',label));const thead=node('thead');thead.append(head);table.append(thead);const body=node('tbody');
      for(const row of data.lines){const tr=node('tr');for(const value of [row.rubricName,row.before,row.current,row.total])tr.append(node('td',typeof value==='number'?new Intl.NumberFormat('fr-CM').format(value)+' F CFA':value));const td=node('td'),b=node('button',tx('Modifier','Change'),'secondary');b.type='button';b.onclick=()=>{modified=row.rubricId;table.closest('dialog')?.querySelector('[data-return]')?.click();};td.append(b);tr.append(td);body.append(tr);}const total=node('tr',undefined,'table-total-row');total.append(node('th',tx('Total des flux affichés','Total displayed flows')));for(const key of ['before','current','total'])total.append(node('td',new Intl.NumberFormat('fr-CM').format(data.totals[key])+' F CFA'));total.append(node('td',''));body.append(total);table.append(body);
      content.replaceChildren();if(data.local)content.append(node('p',tx('Cette synthèse présente les saisies enregistrées sur cet appareil. La connexion permettra de les partager.','This summary shows entries saved on this device. A connection will share them.')));content.append(node('p',tx('Vérifiez les montants. Le total ci-dessous additionne les flux affichés ; il ne représente pas le solde de caisse ni la dette.','Check the amounts. This total sums displayed flows; it is not the cash balance or debt.')),table);
    }});
    if(modified){edit(selected,modified);return false;}if(!result)return false;
    await app.closeFinancialPassage(selected.meetingId,selected.membershipId,data.lines.map(x=>({rubricId:x.rubricId,amount:Math.abs(x.current),cellVersion:x.cellVersion})));current=null;passages.delete(key);void resume();toolbar();return true;
  };
  const before=async(meetingId,membershipId,rubricId)=>{
    // A fast validation during the member review must await it, never silently
    // become an uncommitted draft because a focus handler already set busy.
    if(busy&&!await busy)return false;if(current&&(current.groupId!==app.activeGroup()||current.actorId!==app.currentActor()))current=null;busy=(async()=>{if(current&&(current.meetingId!==meetingId||current.membershipId!==membershipId)&&!await finish())return false;
      const mode=await choose(meetingId);if(!mode)return false;current={meetingId,membershipId,groupId:app.activeGroup(),actorId:app.currentActor()};app.beginFinancialPassage(meetingId,membershipId,mode);const key=JSON.stringify([scope(meetingId),membershipId]),set=passages.get(key)??new Set();set.add(rubricId);passages.set(key,set);toolbar();return true;})();try{return await busy;}finally{busy=null;}
  };
  window.addEventListener('eco:live-signal',e=>{if(e.detail?.type==='WORK_MODE_PROPOSAL'&&current&&e.detail.payload?.meetingId===current.meetingId&&!busy)notify(tx('Plusieurs gestionnaires saisissent cette séance : vous pouvez activer le mode Réunion.','Several managers are entering this meeting: Meeting mode is available.'));});
  window.addEventListener('eco:financial-work-mode',e=>{if(e.detail?.meetingId)modes.set(scope(e.detail.meetingId),e.detail.mode);toolbar();});
  window.addEventListener('eco:live-connected',toolbar);
  window.addEventListener('eco:live-disconnected',toolbar);
  window.addEventListener('offline',toolbar);
  const needsReview=(meetingId,membershipId)=>Boolean(current&&current.groupId===app.activeGroup()&&current.actorId===app.currentActor()&&(current.meetingId!==meetingId||current.membershipId!==membershipId));
  const visit=async(meetingId,membershipId)=>{if(busy)return busy;if(!needsReview(meetingId,membershipId))return true;busy=finish();try{return await busy;}finally{busy=null;}};
  return{before,finish,toolbar,visit,needsReview};
}

