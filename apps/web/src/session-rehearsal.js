import {planFinancialRubricLayout,splitFinancialRubrics,sumFinancialRubrics} from './smart-grid-view.js';

// The table model uses educational values only and has no application ports.
// The dialog can additionally mount the explicitly requested, isolated engine
// rehearsal. Neither surface submits commands to the user's financial group.
export const REHEARSAL_MEMBERS=Object.freeze(['Amina','Boris','Chloé']);
export const REHEARSAL_RUBRICS=Object.freeze(['Solidarité','Collation','Transport','Projet commun','Adhésion','Épargne exemple','Culture','Sport','Formation','Entraide','Communication','Événement','Équipement','Bibliothèque','Jardin','Atelier','Jeunesse','Rencontre','Entretien','Réserve collective'].map((name,index)=>Object.freeze({id:'practice-r'+index,name})));
export function parseRehearsalAmount(raw){
  const text=String(raw).trim();if(!/^\d{1,10}$/.test(text))throw Error('PRACTICE_WHOLE_AMOUNT_REQUIRED');
  const amount=Number(text);if(!Number.isSafeInteger(amount)||amount>1000000000)throw Error('PRACTICE_AMOUNT_LIMIT');return amount;
}
export function createSessionRehearsal(){
  const values=new Map();let revision=0,lastMember=null,pending=null,reviewCount=0;
  const member=id=>{if(!REHEARSAL_MEMBERS.includes(id))throw Error('PRACTICE_MEMBER_UNKNOWN');return id;};
  const rubric=id=>{if(!REHEARSAL_RUBRICS.some(x=>x.id===id))throw Error('PRACTICE_RUBRIC_UNKNOWN');return id;};
  const amount=(who,id)=>values.get(JSON.stringify([member(who),rubric(id)]))??0;
  const total=who=>sumFinancialRubrics(REHEARSAL_RUBRICS,row=>amount(who,row.id));
  const snapshot=who=>Object.freeze({member:who,revision,total:total(who),lines:Object.freeze(REHEARSAL_RUBRICS.map(row=>Object.freeze({...row,amount:amount(who,row.id)})))});
  return{
    amount,total,get revision(){return revision;},get reviewCount(){return reviewCount;},get pending(){return pending;},
    report(){return{protocol:'ECO_SESSION_REHEARSAL_1',syntheticExerciseOnly:true,realDataRead:false,financialWrites:false,canonicalFinancialPosting:false,createdAt:new Date().toISOString(),revision,reviewCount,pendingMemberReview:pending?{member:pending.member,nextMember:pending.nextMember,revision:pending.revision}:null,rubricCount:REHEARSAL_RUBRICS.length,members:REHEARSAL_MEMBERS.map(who=>snapshot(who)),limits:['Fictional local values only','Shares canonical table partition and total helpers','Does not simulate loans, Live transport, outbox or server acknowledgment']};},
    visit(who){member(who);if(pending)return pending;if(lastMember&&lastMember!==who)pending=Object.freeze({...snapshot(lastMember),nextMember:who});return pending;},
    save(who,id,raw){member(who);rubric(id);if(pending||lastMember&&lastMember!==who)throw Error('PRACTICE_REVIEW_REQUIRED');const value=parseRehearsalAmount(raw),key=JSON.stringify([who,id]);if(values.get(key)!==value){values.set(key,value);revision++;}lastMember=who;return snapshot(who);},
    confirmReview(expectedRevision){if(!pending||pending.revision!==expectedRevision||revision!==expectedRevision)throw Error('PRACTICE_REVIEW_STALE');lastMember=pending.nextMember;pending=null;reviewCount++;},
    cancelReview(){pending=null;return lastMember;},
    reset(){values.clear();revision=0;lastMember=null;pending=null;reviewCount=0;}
  };
}

export function openSessionRehearsal({tx=(fr)=>fr,engineRequest,scope,getReleaseVersion}={}){
  if(document.querySelector('dialog[open]'))return;
  const model=createSessionRehearsal(),drafts=new Map(),previous=document.activeElement,hostId=previous?.closest('[data-canonical-financial-host]')?.id;
  const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const button=(text,action,cls='secondary')=>{const b=node('button',text,cls);b.type='button';b.onclick=action;return b;};
  const money=value=>new Intl.NumberFormat(document.documentElement.lang==='en'?'en-CM':'fr-CM').format(value)+' F CFA';
  const dialog=node('dialog',undefined,'eco-session-practice-dialog');dialog.id='ecoSessionPractice';dialog.setAttribute('aria-labelledby','ecoSessionPracticeTitle');
  const header=node('div',undefined,'eco-session-practice-heading'),heading=node('h2',tx('Répétition de séance','Meeting rehearsal'));heading.id='ecoSessionPracticeTitle';
  header.append(heading,button(tx('Fermer','Close'),()=>dialog.close(),'ghost'));
  const notice=node('p',tx('EXERCICE LOCAL · 3 personnes fictives · aucune écriture dans votre caisse. Les valeurs sont effacées à la fermeture.','LOCAL EXERCISE · 3 fictional people · no entries in your cashbook. Values are cleared on closing.'),'eco-session-practice-notice');
  const guide=node('p',tx('1. Saisissez et validez un exemple. 2. Changez de membre et vérifiez sa synthèse. 3. Parcourez les parties : le total général couvre toujours les 20 rubriques.','1. Enter and confirm an example. 2. Change member and review the summary. 3. Explore every part: the general total always covers all 20 categories.'));
  const controls=node('div',undefined,'eco-session-practice-controls'),layoutLabel=node('label',tx('Lecture du tableau','Table layout')),layoutSelect=node('select'),partLabel=node('label',tx('Partie à afficher','Part to display')),partSelect=node('select');
  layoutSelect.setAttribute('aria-label',tx('Découpage de l’exercice','Exercise layout'));partSelect.setAttribute('aria-label',tx('Partie de l’exercice','Exercise part'));layoutLabel.append(layoutSelect);partLabel.append(partSelect);
  controls.append(layoutLabel,partLabel,button(tx('Recommencer l’exercice','Restart exercise'),()=>{model.reset();drafts.clear();pendingInput=null;index=0;visited=new Set();review.replaceChildren();review.hidden=true;status.textContent=tx('Exercice réinitialisé.','Exercise restarted.');render();}));
  controls.append(button(tx('Exemple guidé : correction puis synthèse','Guided example: correction then review'),()=>{model.reset();drafts.clear();pendingInput=null;index=0;review.hidden=true;model.save('Amina','practice-r0','1000');model.save('Amina','practice-r0','1500');model.save('Amina','practice-r1','500');render();[...tableHost.querySelectorAll('input[data-practice-member]')].find(input=>input.dataset.practiceMember==='Boris')?.focus();status.textContent=tx('Exemple fictif : 1 000 remplacé par 1 500, puis 500 dans une autre rubrique. Total attendu : 2 000. Vérifiez la synthèse avant Boris.','Fictional example: 1,000 replaced by 1,500, then 500 in another category. Expected total: 2,000. Review the summary before Boris.');}),button(tx('Exporter le rapport de cet exercice','Export this exercise report'),()=>{const report={...model.report(),layout:{parts,visited:[...visited].sort((a,b)=>a-b),allRubricsIncluded:true}},url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download='eco-exercice-seance.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
  const coverage=node('p',undefined,'hint'),status=node('p',undefined,'eco-session-practice-status');status.setAttribute('role','status');
  const review=node('section',undefined,'eco-session-practice-review');review.hidden=true;review.setAttribute('aria-live','polite');review.tabIndex=-1;
  const tableHost=node('div',undefined,'eco-session-practice-table');
  const totals=node('div',undefined,'eco-session-practice-totals');
  for(const who of REHEARSAL_MEMBERS){const p=node('p',who+' · '),strong=node('strong',money(0));strong.dataset.practiceTotal=who;p.append(strong);totals.append(p);}
  const explanation=node('p',tx('Total des valeurs de l’exercice : ce n’est ni un solde de caisse ni une dette. La présence, les conflits, les prêts et les acquittements serveur de votre feuille réelle restent gérés par leurs mécanismes habituels.','Sum of exercise values: this is neither cash balance nor debt. Presence, conflicts, loans and server acknowledgments in your real sheet keep their usual mechanisms.'),'hint');
  dialog.append(header,notice,guide,controls,coverage,review,status,tableHost,totals,explanation);
  let engines=null;
  if(engineRequest)void import('./engine-rehearsal-ui.js').then(({mountEngineRehearsalPanel})=>{if(dialog.isConnected)engines=mountEngineRehearsalPanel({host:dialog,request:engineRequest,scope,getReleaseVersion,tx});});
  let parts=null,index=0,pendingInput=null,layoutSignature='',visited=new Set();
  const refreshTotals=()=>{for(const target of totals.querySelectorAll('[data-practice-total]'))target.textContent=money(model.total(target.dataset.practiceTotal));for(const target of tableHost.querySelectorAll('[data-practice-row-total]'))target.textContent=money(model.total(target.dataset.practiceRowTotal));};
  const showReview=(frozen,input)=>{
    pendingInput=input;input.readOnly=true;review.hidden=false;review.replaceChildren(node('h3',tx('Synthèse avant le membre suivant','Summary before the next member')),
      node('p',frozen.member+' · '+money(frozen.total)+' · '+tx('révision ','revision ')+frozen.revision));
    const lines=frozen.lines.filter(row=>row.amount!==0);for(const row of lines)review.append(node('p',row.name+' : '+money(row.amount)));
    const actions=node('div',undefined,'eco-session-practice-controls');
    actions.append(button(tx('Valider la synthèse et continuer l’exercice','Confirm summary and continue exercise'),()=>{model.confirmReview(frozen.revision);review.hidden=true;const target=pendingInput;pendingInput=null;if(target?.isConnected){target.readOnly=false;target.focus({preventScroll:true});}status.textContent=tx('Synthèse de l’exercice vérifiée. La prochaine saisie peut commencer.','Exercise summary reviewed. The next entry can begin.');},'primary'),
      button(tx('Revenir au membre précédent','Return to previous member'),()=>{const who=model.cancelReview();review.hidden=true;if(pendingInput)pendingInput.readOnly=false;pendingInput=null;[...tableHost.querySelectorAll('input[data-practice-member]')].find(x=>x.dataset.practiceMember===who)?.focus({preventScroll:true});}));
    review.append(actions);review.focus({preventScroll:true});
  };
  const editor=(who,row)=>{
    const wrap=node('div',undefined,'eco-session-practice-editor'),input=node('input'),key=JSON.stringify([who,row.id]);input.type='text';input.inputMode='numeric';input.autocomplete='off';input.maxLength=10;input.value=drafts.get(key)??(model.amount(who,row.id)?String(model.amount(who,row.id)):'');input.placeholder='0';input.dataset.practiceMember=who;input.dataset.practiceRubric=row.id;input.setAttribute('aria-label',who+' · '+row.name);
    input.oninput=()=>drafts.set(key,input.value);
    input.onfocus=()=>{const frozen=model.visit(who);if(frozen)showReview(frozen,input);};
    const save=()=>{try{model.save(who,row.id,input.value);input.setAttribute('aria-invalid','false');refreshTotals();status.textContent=tx('Exercice uniquement : valeur totale conservée localement pour ','Exercise only: total value kept locally for ')+who+'.';}catch(error){input.setAttribute('aria-invalid','true');status.textContent=error.message==='PRACTICE_REVIEW_REQUIRED'?tx('Vérifiez d’abord la synthèse du membre précédent.','Review the previous member summary first.'):tx('Saisissez un montant entier entre 0 et 1 000 000 000 pour cet exercice.','Enter a whole amount from 0 to 1,000,000,000 for this exercise.');}};
    input.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();save();}};
    const apply=button('✓',save,'primary');apply.setAttribute('aria-label',tx('Valider dans l’exercice : ','Confirm in exercise: ')+who+' · '+row.name);wrap.append(input,apply);return wrap;
  };
  const render=()=>{
    if(model.pending)return;
    const width=Math.max(0,tableHost.clientWidth||dialog.clientWidth-48),mode=document.documentElement.dataset.uiMode||'visual',plan=planFinancialRubricLayout({count:20,width,mode}),cards=plan.recommended===null;
    if(cards)parts=20;else if(!plan.choices.includes(parts))parts=plan.recommended;
    const signature=JSON.stringify([cards,plan.choices,parts]);if(signature!==layoutSignature){layoutSignature=signature;layoutSelect.replaceChildren();for(const n of cards?[20]:plan.choices){const option=new Option(cards?tx('Vue fiche · petit écran','Card view · small screen'):n===1?tx('Vue intégrale','Full view'):tx(n+' parties complètes',n+' complete parts'),String(n));layoutSelect.append(option);}layoutSelect.value=String(parts);visited=new Set();}
    const groups=splitFinancialRubrics(REHEARSAL_RUBRICS,parts);index=Math.max(0,Math.min(index,groups.length-1));visited.add(index);
    partSelect.replaceChildren(...groups.map((rows,i)=>new Option((i+1)+' / '+groups.length+' · '+rows[0].name+' → '+rows.at(-1).name,String(i))));partSelect.value=String(index);
    coverage.textContent=tx('20 rubriques · toutes réparties une seule fois · parties parcourues : ','20 categories · all included exactly once · parts visited: ')+visited.size+' / '+groups.length;
    tableHost.replaceChildren();const rows=groups[index];
    if(cards){for(const who of REHEARSAL_MEMBERS){const card=node('div',undefined,'eco-session-practice-card');card.append(node('strong',who+' · '+rows[0].name),editor(who,rows[0]));tableHost.append(card);}}
    else{const table=node('table');table.dataset.practiceTable='1';table.dataset.practiceFitted=String(plan.fits(parts));const head=node('tr');head.append(node('th',tx('Membre fictif','Fictional member')));for(const row of rows)head.append(node('th',row.name));head.append(node('th',tx('Total général · 20 rubriques','General total · 20 categories')));const thead=node('thead');thead.append(head);table.append(thead);const body=node('tbody');for(const who of REHEARSAL_MEMBERS){const tr=node('tr');tr.append(node('th',who));for(const row of rows){const td=node('td');td.append(editor(who,row));tr.append(td);}const total=node('td',money(model.total(who)));total.dataset.practiceRowTotal=who;tr.append(total);body.append(tr);}table.append(body);tableHost.append(table);}
    refreshTotals();
  };
  layoutSelect.onchange=()=>{parts=Number(layoutSelect.value);index=0;render();};partSelect.onchange=()=>{index=Number(partSelect.value);render();};
  document.body.append(dialog);dialog.showModal();render();
  let scheduled=0,observedWidth=tableHost.clientWidth;const observer=new ResizeObserver(()=>{const width=tableHost.clientWidth;if(width===observedWidth)return;observedWidth=width;cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(render);});observer.observe(tableHost);
  dialog.addEventListener('close',()=>{observer.disconnect();cancelAnimationFrame(scheduled);engines?.dispose();model.reset();drafts.clear();dialog.remove();const owner=hostId?document.getElementById(hostId)?.querySelector('.eco-session-practice-open'):null;(previous?.isConnected?previous:owner||document.getElementById('ecoNavigationOpen'))?.focus({preventScroll:true});},{once:true});
}
