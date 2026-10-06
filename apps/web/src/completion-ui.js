import {MeetingSnapshotStore} from './offline-snapshot.js';
import {openLoanSimulationDialog} from './loan-simulation-ui.js';
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
  const snapshotStore=new MeetingSnapshotStore();

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
    if(!byId('tontineCompletionPanel'))return;
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

  const loanRecapTable=(title,data,selector)=>{
    const section=document.createElement('section'),h=document.createElement('h4');h.textContent=title;section.append(h);
    const meetings=data?.meetings??[],members=getMembers().filter(x=>x.status!=='left'),periods=(data?.loanPeriods??[]).slice(),meetingIndex=new Map(meetings.map((m,i)=>[m.id,i]));
    const wrap=document.createElement('div');wrap.className='matrix-wrap';const table=document.createElement('table');table.className='meeting-matrix';const head=document.createElement('thead'),hr=document.createElement('tr');hr.append(document.createElement('th'));hr.firstChild.textContent=tr('Membre','Member');for(const m of meetings){const th=document.createElement('th');th.textContent='S'+String(m.session??'');hr.append(th);}const thTotal=document.createElement('th');thTotal.textContent=tr('Dernier état','Latest');hr.append(thTotal);head.append(hr);table.append(head);
    const body=document.createElement('tbody'),columnTotals=new Map();
    for(const member of members){
      const row=document.createElement('tr'),name=document.createElement('th');name.textContent=member.displayName;row.append(name);let last=0;
      for(const meeting of meetings){
        const idx=meetingIndex.get(meeting.id)??0,eligible=periods.filter(p=>p.memberId===member.id&&(meetingIndex.get(p.meetingId)??-1)<=idx&&(meetingIndex.get(p.meetingId)??-1)>=0).sort((a,b)=>(meetingIndex.get(a.meetingId)??0)-(meetingIndex.get(b.meetingId)??0));
        const latestByLoan=new Map();for(const p of eligible)latestByLoan.set(p.loanId,p);
        const amount=[...latestByLoan.values()].reduce((n,p)=>n+Number(selector(p)??0),0);last=amount;columnTotals.set(meeting.id,(columnTotals.get(meeting.id)??0)+amount);const td=document.createElement('td');td.textContent=amount?fmt(amount):'—';row.append(td);
      }
      const latest=document.createElement('td');latest.textContent=fmt(last);row.append(latest);body.append(row);
    }
    const total=document.createElement('tr');total.className='table-total-row';const label=document.createElement('th');label.textContent='TOTAL';total.append(label);let latestTotal=0;for(const meeting of meetings){const amount=Number(columnTotals.get(meeting.id)??0);latestTotal=amount;const td=document.createElement('td');td.textContent=fmt(amount);total.append(td);}const end=document.createElement('td');end.textContent=fmt(latestTotal);total.append(end);body.append(total);table.append(body);wrap.append(table);section.append(wrap);return section;
  };
  const renderLoanDebtRecap=async()=>{
    const root=byId('loanDebtRecap');if(!root||!app.activeGroup())return;
    const data=await app.savingsYieldSourceData().catch(()=>null);if(!data)return;
    root.querySelectorAll('.loan-recap-generated').forEach(x=>x.remove());
    const holder=document.createElement('div');holder.className='loan-recap-generated stack';
    const totals=data.totals??{},metrics=document.createElement('div');metrics.className='metrics small';
    for(const [labelText,amount] of [[tr('Capital en cours','Outstanding principal'),totals.outstandingPrincipal],[tr('Intérêts dus','Interest due'),totals.outstandingInterest],[tr('Prochains intérêts projetés','Projected next interest'),totals.nextInterestProjected],[tr('Autres dettes','Other debt'),totals.otherDebt],[tr('Dette totale exigible','Total due debt'),totals.totalDebt],[tr('Dette + prochaine échéance','Debt + next interest'),totals.totalDebtIncludingNextInterest??totals.totalDebt]]){const card=document.createElement('div'),s=document.createElement('span'),strong=document.createElement('strong');s.textContent=labelText;strong.textContent=fmt(Number(amount??0));card.append(s,strong);metrics.append(card);}holder.append(metrics);
    const note=document.createElement('p');note.className='truth-notice';note.textContent=tr('Intérêts dus = déjà exigibles. Prochains intérêts projetés = montant calculé sur le capital restant pour la prochaine période ; il n’est pas ajouté au Ledger tant que la règle du groupe ne le rend pas exigible.','Interest due = already payable. Projected next interest = calculated on outstanding principal for the next period; it is not posted to the Ledger until group policy makes it due.');holder.append(note);

    // One grouped table, four simultaneous criteria for every distinct loan.
    // Canonical loan periods are used as the only historic source: never
    // synthesize paid interest, double a repayment or merge separate loans.
    const recap=document.createElement('section'),recapTitle=document.createElement('h4');
    recapTitle.textContent=tr('Récapitulatif de l’évolution des dettes','Debt evolution recap');
    const recapWrap=document.createElement('div');recapWrap.className='matrix-wrap loan-recap-wrap';
    const recapTable=document.createElement('table');recapTable.className='meeting-matrix loan-four-criteria-table';
    const sessionRows=data.meetings??[],periods=data.loanPeriods??[],openLoans=data.loanDebts??[];
    const sessionOrder=new Map(sessionRows.map((m,i)=>[String(m.id),i]));
    const definitions=new Map();
    for(const debt of openLoans)if(debt.loanId)definitions.set(String(debt.loanId),{memberId:String(debt.memberId??''),title:String(debt.title??debt.loanId),open:debt});
    for(const p of periods)if(p.loanId){
      const key=String(p.loanId),existing=definitions.get(key);
      if(!existing)definitions.set(key,{memberId:String(p.memberId??''),title:String(p.loanTitle??key),open:null});
      else if(!existing.memberId&&p.memberId)existing.memberId=String(p.memberId);
    }
    const orderedPeriods=new Map();
    periods.forEach((p,originalIndex)=>{
      const key=String(p.loanId??'');
      if(!definitions.has(key))return;
      const rows=orderedPeriods.get(key)??[];
      rows.push({period:p,index:originalIndex,sessionIndex:sessionOrder.get(String(p.meetingId??''))??Number.MAX_SAFE_INTEGER});
      orderedPeriods.set(key,rows);
    });
    for(const rows of orderedPeriods.values())rows.sort((a,b)=>a.sessionIndex-b.sessionIndex||a.index-b.index);
    const criteria=[
      [tr('Capital restant','Outstanding principal'),p=>p.principalAfter,'principal'],
      [tr('Intérêts dus','Interest due'),p=>p.interestAfter,'interest'],
      [tr('Prochains intérêts projetés','Projected next interest'),p=>p.nextInterestProjected,'projected'],
      [tr('Total dette exigible','Total due debt'),p=>p.totalDebtAfter,'due']
    ];
    const head=document.createElement('thead'),header=document.createElement('tr');
    for(const name of [tr('Membre','Member'),tr('Prêt','Loan'),tr('Critère','Criterion'),...sessionRows.map(m=>'S'+String(m.session??'')),tr('Situation actuelle','Current')]){
      const th=document.createElement('th');th.textContent=name;header.append(th);
    }
    head.append(header);recapTable.append(head);
    const body=document.createElement('tbody'),sums=criteria.map(()=>sessionRows.map(()=>0)),latestTotals=criteria.map(()=>0);
    const sorted=[...definitions.entries()].sort((a,b)=>nameOfMember(a[1].memberId).localeCompare(nameOfMember(b[1].memberId))||String(a[1].memberId??'').localeCompare(String(b[1].memberId??''))||a[0].localeCompare(b[0]));
    // Derived subtotals are grouped by stable member ID, never by display
    // name: two people sharing a name must not have their debts merged.
    let currentMemberKey=null;
    let memberSessions=criteria.map(()=>sessionRows.map(()=>0));
    let memberLatest=criteria.map(()=>0);
    const appendMemberTotals=key=>{
      if(key===null)return;
      for(let i=0;i<criteria.length;i++){
        const row=document.createElement('tr');row.className='loan-member-subtotal loan-criterion-'+criteria[i][2];
        const th=document.createElement('th');th.colSpan=3;
        th.textContent=tr('SOUS-TOTAL MEMBRE · ','MEMBER SUBTOTAL · ')+nameOfMember(key)+' · '+criteria[i][0];
        row.append(th);
        for(const amount of memberSessions[i]){const cell=document.createElement('td');cell.textContent=fmt(amount);row.append(cell);}
        const now=document.createElement('td');now.textContent=fmt(memberLatest[i]);row.append(now);body.append(row);
      }
    };
    for(const [loanId,def] of sorted){
      const memberKey=String(def.memberId??'');
      if(currentMemberKey!==null&&memberKey!==currentMemberKey){
        appendMemberTotals(currentMemberKey);
        memberSessions=criteria.map(()=>sessionRows.map(()=>0));memberLatest=criteria.map(()=>0);
      }
      currentMemberKey=memberKey;
      const rows=orderedPeriods.get(loanId)??[],progress=sessionRows.map((_,i)=>{
        let last;for(const row of rows)if(row.sessionIndex<=i)last=row.period;
        return last;
      });
      for(let criterionIndex=0;criterionIndex<criteria.length;criterionIndex++){
        const [label,selector,kind]=criteria[criterionIndex],row=document.createElement('tr');
        row.className='loan-criteria-row loan-criterion-'+kind+(criterionIndex===0?' loan-criteria-start':'');
        if(criterionIndex===0){const memberCell=document.createElement('th'),loanCell=document.createElement('th');
          memberCell.rowSpan=criteria.length;loanCell.rowSpan=criteria.length;
          memberCell.className='loan-member-key';loanCell.className='loan-name-key';
          memberCell.textContent=nameOfMember(def.memberId);loanCell.textContent=def.title;
          row.append(memberCell,loanCell);
        }
        const criterionCell=document.createElement('th');criterionCell.className='loan-criterion-key';criterionCell.textContent=label;row.append(criterionCell);
        progress.forEach((state,index)=>{
          const raw=state?Number(selector(state)??0):0,value=Number.isFinite(raw)?raw:0;
          sums[criterionIndex][index]+=value;memberSessions[criterionIndex][index]+=value;
          const cell=document.createElement('td');cell.textContent=state?fmt(value):'—';row.append(cell);
        });
        const latestState=progress[progress.length-1]??rows[rows.length-1]?.period;
        let latest=latestState?Number(selector(latestState)??0):0;
        if(!latestState&&def.open)latest=Number(({
          principal:def.open.principal,interest:def.open.interest,projected:def.open.nextInterestProjected,due:def.open.totalDue
        })[kind]??0);
        latest=Number.isFinite(latest)?latest:0;latestTotals[criterionIndex]+=latest;memberLatest[criterionIndex]+=latest;
        const currentCell=document.createElement('td');currentCell.textContent=fmt(latest);row.append(currentCell);body.append(row);
      }
    }
    appendMemberTotals(currentMemberKey);
    for(let i=0;i<criteria.length;i++){
      const row=document.createElement('tr');row.className='table-total-row loan-criterion-'+criteria[i][2];
      const label=document.createElement('th');label.colSpan=3;label.textContent=tr('TOTAL GROUPE · ','GROUP TOTAL · ')+criteria[i][0];row.append(label);
      for(const sum of sums[i]){const cell=document.createElement('td');cell.textContent=fmt(sum);row.append(cell);}
      const latest=document.createElement('td');latest.textContent=fmt(latestTotals[i]);row.append(latest);body.append(row);
    }
    if(!sorted.length){
      const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4+sessionRows.length;
      cell.textContent=tr('Aucun prêt ni historique à afficher.','No loans or history to display.');row.append(cell);body.append(row);
    }
    recapTable.append(body);recapWrap.append(recapTable);recap.append(recapTitle,recapWrap);holder.append(recap);

    const current=document.createElement('section'),h=document.createElement('h4');h.textContent=tr('État actuel des prêts ouverts','Current open-loan position');current.append(h);
    const debts=data.loanDebts??[];if(!debts.length){current.append(article(tr('Aucun prêt ouvert','No open loan'),'',''));}else{
      const wrap=document.createElement('div');wrap.className='matrix-wrap';const table=document.createElement('table');table.className='meeting-matrix loan-open-state-table';
      const head=document.createElement('thead'),hr=document.createElement('tr');for(const label of [tr('Membre','Member'),tr('Prêt','Loan'),tr('Capital restant','Outstanding principal'),tr('Intérêts dus','Interest due'),tr('Prochain intérêt','Next interest'),tr('Dette exigible','Debt due'),tr('Dette + prochaine échéance','Debt + next due'),tr('Priorité','Priority')]){const th=document.createElement('th');th.textContent=label;hr.append(th);}head.append(hr);table.append(head);
      const body=document.createElement('tbody');for(const debt of debts){const row=document.createElement('tr'),values=[nameOfMember(debt.memberId),debt.title,fmt(debt.principal),fmt(debt.interest),fmt(debt.nextInterestProjected),fmt(debt.totalDue),fmt(debt.totalIncludingNextInterest),String(debt.paymentPriority??'CAPITAL_FIRST')];for(const value of values){const td=document.createElement('td');td.textContent=value;row.append(td);}body.append(row);}table.append(body);wrap.append(table);current.append(wrap);
    }holder.append(current);

    // Debt journey is loaded only for the selected loan, avoiding N history
    // requests when a group has dozens of loans.
    const journey=document.createElement('section'),jt=document.createElement('h4');jt.textContent=tr('Parcours d’une dette','Debt journey');
    const memberSelect=document.createElement('select'),loanSelect=document.createElement('select'),journeyHost=document.createElement('div');memberSelect.append(option('',tr('Choisir un membre','Choose a member')));
    const debtMembers=[...new Set(debts.map(x=>String(x.memberId??'')).filter(Boolean))];for(const id of debtMembers)memberSelect.append(option(id,nameOfMember(id)));
    const renderGroupJourney=()=>{
      // Aggregate canonical loan-period snapshots, never fabricate a dummy group loan.
      // The next-period projection remains separate from payable interest.
      const timeline=data.meetings??[],periods=data.loanPeriods??[],loanIds=new Set((data.loanDebts??[]).map(p=>String(p.loanId)));
      for(const p of periods)if(p.loanId)loanIds.add(String(p.loanId));
      const wrap=document.createElement('div');wrap.className='matrix-wrap',table=document.createElement('table');
      table.className='meeting-matrix debt-group-journey-table';
      const header=document.createElement('tr');
      for(const heading of [tr('Séance','Session'),tr('Capital de début','Opening principal'),tr('Capital remboursé','Principal paid'),tr('Capital restant','Principal remaining'),tr('Intérêts ouverture','Opening interest'),tr('Nouveaux intérêts dus','New interest due'),tr('Intérêts payés','Interest paid'),tr('Intérêts restants','Interest remaining'),tr('Dette exigible','Due debt'),tr('Prochains intérêts projetés','Projected next interest')]){
        const th=document.createElement('th');th.textContent=heading;header.append(th);
      }
      const thead=document.createElement('thead');thead.append(header);table.append(thead);
      const tbody=document.createElement('tbody'),lastByLoan=new Map();
      for(const meeting of timeline){
        const current=periods.filter(p=>String(p.meetingId??'')===String(meeting.id));
        // A loan with multiple revisions in the same meeting is represented
        // by its last canonical period only, not by adding duplicate states.
        const affected=new Map();for(const p of current)affected.set(String(p.loanId),p);
        const beginning=[...lastByLoan.values()].reduce((n,p)=>n+Number(p.principalAfter??0),0);
        const openingInterest=[...lastByLoan.values()].reduce((n,p)=>n+Number(p.interestAfter??0),0);
        const paidPrincipal=[...affected.values()].reduce((n,p)=>n+Number(p.principalPaid??0),0);
        const paidInterest=[...affected.values()].reduce((n,p)=>n+Number(p.interestPaid??0),0);
        const newInterest=[...affected.values()].reduce((n,p)=>n+Number(p.interestNew??0),0);
        for(const [id,p] of affected)lastByLoan.set(id,p);
        const values=[
          beginning,paidPrincipal,
          [...lastByLoan.values()].reduce((n,p)=>n+Number(p.principalAfter??0),0),
          openingInterest,newInterest,paidInterest,
          [...lastByLoan.values()].reduce((n,p)=>n+Number(p.interestAfter??0),0),
          [...lastByLoan.values()].reduce((n,p)=>n+Number(p.totalDebtAfter??0),0),
          [...lastByLoan.values()].reduce((n,p)=>n+Number(p.nextInterestProjected??0),0)
        ];
        const row=document.createElement('tr'),name=document.createElement('th');
        name.textContent=String(meeting.title??'S'+String(meeting.session??''));row.append(name);
        for(const value of values){const td=document.createElement('td');td.textContent=fmt(value);row.append(td);}
        tbody.append(row);
      }
      if(!timeline.length){
        const row=document.createElement('tr'),empty=document.createElement('td');empty.colSpan=10;
        empty.textContent=tr('Aucune séance disponible.','No session available.');row.append(empty);tbody.append(row);
      }
      table.append(tbody);wrap.append(table);
      const note=document.createElement('p');note.className='hint';
      note.textContent=tr('Historique calculé uniquement sur les périodes de prêts disponibles. Les décaissements sans période historique vérifiée ne sont pas inventés ; consultez les indicateurs actuels au-dessus pour les encours complets.','History uses available loan periods only. Unverified disbursement periods are not invented; see the current portfolio metrics above for complete outstanding amounts.');
      journeyHost.replaceChildren(note,wrap);
    };
    const refillLoans=()=>{loanSelect.replaceChildren(option('__GROUP__',tr('Ensemble du groupe','Entire group')));for(const debt of debts.filter(x=>!memberSelect.value||String(x.memberId)===memberSelect.value))loanSelect.append(option(String(debt.loanId),debt.title+' · '+fmt(debt.totalDue)));journeyHost.replaceChildren();loanSelect.value='__GROUP__';void renderJourney();};
    const renderJourney=async()=>{journeyHost.replaceChildren();if(loanSelect.value==='__GROUP__'){renderGroupJourney();return;}if(!loanSelect.value)return;const loading=document.createElement('p');loading.className='hint';loading.textContent=tr('Chargement du parcours…','Loading journey…');journeyHost.append(loading);try{const history=await app.loanHistory(loanSelect.value),periods=history.periods??[];if(!periods.length){journeyHost.replaceChildren(article(tr('Aucune période détaillée','No detailed period'),' ',tr('Le prêt existe mais aucune période de remboursement n’a encore été enregistrée.','The loan exists but no repayment period has been recorded yet.')));return;}const wrap=document.createElement('div');wrap.className='matrix-wrap';const table=document.createElement('table');table.className='meeting-matrix debt-journey-table';const head=document.createElement('thead'),hr=document.createElement('tr');for(const label of [tr('Séance / date','Session / date'),tr('Capital avant','Principal before'),tr('Intérêt ouverture','Opening interest'),tr('Nouvel intérêt','New interest'),tr('Paiement','Payment'),tr('Capital payé','Principal paid'),tr('Intérêt payé','Interest paid'),tr('Capital restant','Principal left'),tr('Intérêts dus','Interest due'),tr('Dette après','Debt after'),tr('Prochain intérêt','Next interest'),tr('Priorité','Priority')]){const th=document.createElement('th');th.textContent=label;hr.append(th);}head.append(hr);table.append(head);const body=document.createElement('tbody');for(const p of periods){const meeting=getMeetings().find(m=>m.id===p.meetingId),values=[meeting?.title??date(p.createdAt),fmt(p.principalBefore),fmt(p.interestOpening),fmt(p.interestNew),fmt(p.payment),fmt(p.principalPaid),fmt(p.interestPaid),fmt(p.principalAfter),fmt(p.interestAfter),fmt(p.totalDebtAfter),fmt(p.nextInterestProjected),String(p.priority??'')];const row=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=value;row.append(td);}body.append(row);}table.append(body);wrap.append(table);journeyHost.replaceChildren(wrap);}catch(e){journeyHost.replaceChildren();showError(e);}};
    memberSelect.addEventListener('change',refillLoans);loanSelect.addEventListener('change',()=>void renderJourney());refillLoans();journey.append(jt,memberSelect,loanSelect,journeyHost);holder.append(journey);
    root.append(holder);
  };

  const officialLoanRubric=()=>getRubrics().find(r=>String(r.facets?.custom?.systemKey??'').toUpperCase()==='LOAN'||/^(prêt|pret|emprunt|loan)s?$/i.test(String(r.name??'').trim()));
  const hydrateLoanPolicy=()=>{
    const rubric=officialLoanRubric(),policy=rubric?.policies?.loan,status=byId('loanPolicyStatus');
    if(policy){if(byId('loanPolicyRate'))byId('loanPolicyRate').value=String(Number(policy.rateBasisPointsPerPeriod??0)/100);if(byId('loanPolicyPriority'))byId('loanPolicyPriority').value=policy.paymentPriority??'CAPITAL_FIRST';if(byId('loanPolicyInterestTiming'))byId('loanPolicyInterestTiming').value=policy.interestTiming??'NEXT_SESSION_DUE';if(byId('loanPolicyFundingMode'))byId('loanPolicyFundingMode').value=policy.fundingMode??'AVAILABLE_GROUP_CASH';if(byId('loanPolicyCarryForward'))byId('loanPolicyCarryForward').checked=policy.carryForwardUnusedFunds!==false;if(byId('loanPaymentPriority'))byId('loanPaymentPriority').value=policy.paymentPriority??'CAPITAL_FIRST';if(byId('loanInterestTiming'))byId('loanInterestTiming').value=policy.interestTiming??'NEXT_SESSION_DUE';if(status)status.textContent=tr('Politique active · taux par période ','Active policy · rate per period ')+(Number(policy.rateBasisPointsPerPeriod??0)/100).toLocaleString(locale()==='fr'?'fr-FR':'en-US')+' % · '+String(policy.paymentPriority??'CAPITAL_FIRST')+' · '+String(policy.interestTiming??'NEXT_SESSION_DUE')+' · '+String(policy.fundingMode??'AVAILABLE_GROUP_CASH')+tr(' · aucun intérêt sur intérêt.',' · no interest on interest.');}
    else if(status)status.textContent=tr('Aucune politique Prêt validée : configurez le taux, la priorité et le moment de perception. Aucun intérêt sur intérêt.','No validated loan policy: configure rate, priority and interest timing. No interest on interest.');
    return{rubric,policy};
  };

  const openGuarantorDialog=async loan=>{
    document.getElementById('loanGuarantorDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='loanGuarantorDialog';dialog.className='loan-guarantor-dialog';const title=document.createElement('h3');title.textContent=tr('Garants · ','Guarantors · ')+loan.title;dialog.append(title);
    const guarantees=await app.loanGuarantors(loan.id).catch(()=>[]),list=document.createElement('div');list.className='stack compact';
    if(!guarantees.length)list.append(article(tr('Aucun garant enregistré','No guarantor recorded'),'',''));
    for(const g of guarantees){const line=document.createElement('div');line.className='actions';const state=String(g.data?.state??'ACTIVE'),label=document.createElement('span');label.textContent=nameOfMember(String(g.data?.membershipId??''))+' · '+fmt(Number(g.data?.guaranteedAmount??0))+' · '+state;line.append(label);if(state==='ACTIVE'){const release=document.createElement('button');release.type='button';release.className='link-btn';release.textContent=tr('Libérer','Release');release.onclick=()=>void run(null,async()=>{const reason=window.prompt(tr('Motif de libération de la garantie :','Reason for releasing guarantee:'),tr('Prêt soldé ou garantie remplacée','Loan settled or guarantee replaced'));if(!reason?.trim())return;await app.releaseLoanGuarantor(loan.id,g.id,reason.trim());dialog.close();await openGuarantorDialog(loan);});line.append(release);}list.append(line);}dialog.append(list);
    if(['APPROVED','DISBURSED','REPAYING'].includes(primitiveState(loan))){const form=document.createElement('form');form.className='form-grid compact loan-guarantor-form';const sel=document.createElement('select');sel.append(option('',tr('Ajouter un garant','Add guarantor')));for(const m of getMembers().filter(x=>x.status!=='left'&&x.id!==String(loan.data.borrowerMembershipId??'')))sel.append(option(m.id,m.displayName));const amount=document.createElement('input');amount.type='number';amount.inputMode='numeric';amount.min='1';amount.step='1';amount.placeholder=tr('Montant garanti','Guaranteed amount');const add=document.createElement('button');add.type='submit';add.className='secondary';add.textContent=tr('Enregistrer le garant','Save guarantor');form.append(sel,amount,add);form.addEventListener('submit',e=>void run(form,async()=>{e.preventDefault();const guaranteedAmount=Number(amount.value);if(!sel.value||!Number.isSafeInteger(guaranteedAmount)||guaranteedAmount<=0)throw Error('INVALID_GUARANTEE');await app.registerGuarantor(loan.id,{membershipId:sel.value,guaranteedAmount});dialog.close();await openGuarantorDialog(loan);notify(tr('Garant enregistré et traçable.','Guarantor saved and traceable.'));}));dialog.append(form);}
    const close=document.createElement('button');close.type='button';close.textContent=tr('Fermer','Close');close.onclick=()=>dialog.close();dialog.append(close);document.body.append(dialog);dialog.showModal();
  };

  const renderLoans=async()=>{
    if(!app.activeGroup()){loans=[];decisions=[];return;}
    [loans,decisions]=await Promise.all([app.listCompletion('LOAN'),app.listCompletion('GOVERNANCE_DECISION')]);
    const currentPolicy=hydrateLoanPolicy().policy;
    refill(byId('loanBorrower'),getMembers().map(x=>({id:x.id,label:x.displayName})),tr('Choisir un membre','Choose a member'));
    refill(byId('obligationMember'),getMembers().map(x=>({id:x.id,label:x.displayName})),tr('Choisir un membre','Choose a member'));
    const root=byId('loanList');if(root){root.replaceChildren();
      if(!loans.length)root.append(article(tr('Aucun prêt','No loan'),'',''));
      else{
        const wrap=document.createElement('div');wrap.className='matrix-wrap loan-portfolio-wrap';const table=document.createElement('table');table.className='meeting-matrix loan-portfolio-table';
        const head=document.createElement('thead'),hr=document.createElement('tr');for(const label of [tr('Membre','Member'),tr('Prêt','Loan'),tr('Accordé / séance','Granted / session'),tr('État','Status'),tr('Capital initial','Initial principal'),tr('Capital restant','Outstanding'),tr('Intérêts dus','Interest due'),tr('Priorité actuelle','Current priority'),tr('Garants','Guarantors'),tr('Actions','Actions')]){const th=document.createElement('th');th.textContent=label;hr.append(th);}head.append(hr);table.append(head);
        const body=document.createElement('tbody');
        for(const loan of loans){
          const state=primitiveState(loan),row=document.createElement('tr'),borrower=nameOfMember(String(loan.data.borrowerMembershipId??'')),meetingId=String(loan.data.meetingId??loan.data.disbursementMeetingId??loan.data.upfrontInterestSourceMeetingId??''),meeting=getMeetings().find(m=>m.id===meetingId),granted=meeting?.title??date(String(loan.data.disbursedAt??loan.data.approvedAt??loan.createdAt??loan.updatedAt??'')),priority=String(currentPolicy?.paymentPriority??loan.data.paymentPriority??'CAPITAL_FIRST');
          for(const valueText of [borrower,loan.title,granted,state,fmt(Number(loan.data.principal??0)),fmt(Number(loan.data.outstandingPrincipal??0)),fmt(Number(loan.data.unpaidInterest??0)),priority]){const td=document.createElement('td');td.textContent=valueText;row.append(td);}
          const guarantorCell=document.createElement('td'),gbtn=document.createElement('button');gbtn.type='button';gbtn.className='secondary';gbtn.textContent=tr('Gérer','Manage');gbtn.onclick=()=>void openGuarantorDialog(loan);guarantorCell.append(gbtn);row.append(guarantorCell);
          const actionCell=document.createElement('td'),actions=document.createElement('div');actions.className='actions loan-table-actions';
          const simulate=document.createElement('button');simulate.type='button';simulate.textContent=tr('Simuler','Simulate');simulate.onclick=()=>{const effectiveLoan={...loan,data:{...loan.data,paymentPriority:currentPolicy?.paymentPriority??loan.data.paymentPriority}};void openLoanSimulationDialog({app,loan:effectiveLoan,title:tr('Simulation du prêt','Loan simulation'),memberName:borrower});};actions.append(simulate);
          if(state==='SUBMITTED'){const b=document.createElement('button');b.type='button';b.textContent=tr('Approuver','Approve');b.onclick=()=>void run(null,async()=>{await app.transitionCompletion(loan.id,'APPROVED',primitiveVersion(loan),{approvedAt:new Date().toISOString()});await renderLoans();});actions.append(b);}
          if(state==='APPROVED'){const b=document.createElement('button');b.type='button';b.className='primary';b.textContent=tr('Décaisser','Disburse');b.onclick=()=>void run(null,async()=>{const principal=Number(loan.data.principal),timing=String(loan.data.interestTiming??'NEXT_SESSION_DUE');if(!['NEXT_SESSION_DUE','UPFRONT_DEDUCTED','UPFRONT_REQUIRED'].includes(timing))throw Error('INVALID_LOAN_INTEREST_TIMING');const upfront=timing==='NEXT_SESSION_DUE'?0:Math.round(principal*Number(loan.data.rateBasisPointsPerPeriod??0)/10000),confirmation=timing==='UPFRONT_DEDUCTED'?tr('Cette politique retient '+fmt(upfront)+' d’intérêts immédiatement. Le membre reçoit un montant net inférieur au capital dû. Confirmer ?','This policy immediately withholds '+fmt(upfront)+' interest. The member receives less cash than the principal owed. Confirm?'):timing==='UPFRONT_REQUIRED'?tr('Cette politique exige '+fmt(upfront)+' d’intérêts avant la libération du capital. Confirmez uniquement si l’intérêt a bien été reçu.','This policy requires '+fmt(upfront)+' interest before principal release. Confirm only if the interest was actually received.'):'';if(upfront>0&&!window.confirm(confirmation))return;const meetingId=String(loan.data.meetingId??getMeetings().find(m=>m.status==='open')?.id??getMeetings().filter(m=>m.status!=='cancelled').at(-1)?.id??'');const rubricId=String(loan.data.rubricId??officialLoanRubric()?.id??'');await app.disburseLoan(loan.id,{amount:principal,expectedVersion:primitiveVersion(loan),meetingId:meetingId||undefined,rubricId:rubricId||undefined});await renderLoans();notify(tr('Prêt décaissé dans le Ledger selon la politique du groupe.','Loan disbursed in the Ledger under group policy.'));});actions.append(b);}
          if(state==='DISBURSED'||state==='REPAYING'){const b=document.createElement('button');b.type='button';b.textContent=tr('Rembourser capital','Repay principal');b.onclick=()=>void run(null,async()=>{const raw=window.prompt(tr('Capital remboursé :','Principal repaid:'),'10000');if(raw===null)return;const amount=Number(raw);if(!Number.isSafeInteger(amount)||amount<=0)throw Error('INVALID_LOAN_REPAYMENT');await app.repayLoan(loan.id,{principalAmount:amount,expectedVersion:primitiveVersion(loan)});await renderLoans();});actions.append(b);}
          actionCell.append(actions);row.append(actionCell);body.append(row);
        }
        table.append(body);wrap.append(table);root.append(wrap);
      }
    }
    await renderLoanDebtRecap();
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

  const renderOfflineSnapshots=async()=>{
    const root=byId('offlineSnapshotList');if(!root)return;
    root.replaceChildren();const groupId=app.activeGroup();if(!groupId)return;
    const rows=await snapshotStore.list(groupId);
    if(!rows.length){root.append(article(tr('Aucun paquet local','No local pack'),'',tr('Préparez le groupe avant de partir hors connexion.','Prepare the group before going offline.')));return;}
    for(const x of rows){
      const a=article(tr('Paquet réunion','Meeting pack'),date(x.updatedAt),tr('Contexte local en lecture seule','Read-only local context'));
      const b=document.createElement('button');b.type='button';b.textContent=tr('Supprimer','Delete');b.onclick=()=>void run(null,async()=>{await snapshotStore.remove(x.id);await renderOfflineSnapshots();});
      a.append(b);root.append(a);
    }
  };

  const prepareOfflineSnapshot=async()=>{
    const groupId=app.activeGroup();if(!groupId)throw Error('ACTIVE_GROUP_REQUIRED');
    const snapshot={id:'meeting-snapshot:'+groupId,groupId,actorId:app.currentActor(),preparedAt:new Date().toISOString(),
      members:getMembers().map(m=>({id:m.id,displayName:m.displayName,roles:m.roles})),
      rubrics:getRubrics().map(r=>({id:r.id,name:r.name,status:r.status,version:r.version})),
      meetings:getMeetings().map(m=>({id:m.id,title:m.title,status:m.status,openedAt:m.openedAt})),
      warning:'READ_ONLY_CONTEXT_FINANCIAL_INTENTS_REQUIRE_SERVER_CONFIRMATION'};
    await snapshotStore.save(snapshot);await renderOfflineSnapshots();
    notify(tr('Paquet hors ligne préparé sur cet appareil.','Offline pack prepared on this device.'));
  };

  const refresh=async()=>{
    if(!workflows||!Object.keys(workflows).length){const result=await app.completionWorkflows();workflows=result.workflows;fillCompletionKinds();}
    await Promise.all([renderTontine(),renderLoans(),renderCompletionRecords(),renderOfflineSnapshots()]);
  };

  byId('tontineCompletionPanel')?.querySelector('#tontineCycleForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    await app.createTontineCycle({rubricId:value('tontineCycleRubric'),name:value('tontineCycleName'),rounds:number('tontineRounds'),potsPerRound:number('tontinePots'),nominalPotAmount:number('tontinePotAmount')});
    byId('tontineCycleName').value='';await renderTontine();notify(tr('Cycle créé.','Cycle created.'));
  });});
  byId('tontineCompletionPanel')?.querySelector('#tontineShareForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    await app.addTontineShare({cycleId:value('tontineShareCycle'),membershipId:value('tontineShareMember'),label:value('tontineShareLabel')});
    byId('tontineShareLabel').value='';await renderTontine();notify(tr('Part ajoutée.','Share added.'));
  });});
  byId('tontineCompletionPanel')?.querySelector('#suggestTontineScheduleBtn')?.addEventListener('click',()=>void run(null,proposeSchedule));
  byId('tontineCompletionPanel')?.querySelector('#applyTontineScheduleBtn')?.addEventListener('click',()=>void run(null,applySchedule));
  byId('tontineCompletionPanel')?.querySelector('#tontineServeForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    const share=shares.find(x=>x.id===value('tontineServeShare'));if(!share)throw Error('TONTINE_SHARE_NOT_FOUND');
    await app.serveTontineShare(share.id,{amount:number('tontineServeAmount'),expectedVersion:primitiveVersion(share),meetingId:value('tontineServeMeeting')||undefined});
    await renderTontine();notify(tr('Pot servi et comptabilisé.','Pot served and posted to the ledger.'));
  });});
  byId('tontineCompletionPanel')?.querySelector('#readinessBtn')?.addEventListener('click',()=>void run(null,async()=>{
    const p=await app.createReadinessPassport();const blockers=safeJson(p.data.blockers,[]);
    byId('readinessResult').textContent=p.data.ready===true?tr('Groupe prêt : aucun blocage détecté.','Group ready: no blocker detected.'):tr('À compléter : ','To complete: ')+blockers.join(', ');
  }));

  byId('loanPolicyForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    let rubric=officialLoanRubric();if(!rubric)rubric=await app.ensureOfficialLoanRubric();
    const rate=Math.round(number('loanPolicyRate')*100);if(!Number.isSafeInteger(rate)||rate<0)throw Error('INVALID_LOAN_RATE');
    const policies={...(rubric.policies??{}),loan:{...(rubric.policies?.loan??{}),allowed:true,rateBasisPointsPerPeriod:rate,interestBase:'PRINCIPAL_ONLY',paymentPriority:value('loanPolicyPriority')||'CAPITAL_FIRST',interestTiming:value('loanPolicyInterestTiming')||'NEXT_SESSION_DUE',fundingMode:value('loanPolicyFundingMode')||'AVAILABLE_GROUP_CASH',carryForwardUnusedFunds:Boolean(byId('loanPolicyCarryForward')?.checked),noInterestOnInterest:true}};
    const updated=await app.updateRubricPolicies(rubric.id,policies);
    // The saved rubric is authoritative; the previously loaded view array was
    // otherwise reused after success and still showed CAPITAL_FIRST.
    rubric.policies=structuredClone(updated?.policies??policies);
    notify(tr('Politique Prêts enregistrée.','Loan policy saved.'));await renderLoans();
  });});

  byId('loanForm')?.addEventListener('submit',e=>{e.preventDefault();void run(e.currentTarget,async()=>{
    const principal=number('loanPrincipal'),installments=number('loanInstallments'),rate=Math.round(number('loanRate')*100),periodsPerYear=number('loanPeriodsPerYear'),fees=number('loanFees');
    const quote=await app.quoteLoan({principal,installments,annualRateBasisPoints:rate,installmentsPerYear:periodsPerYear,feesTotal:fees,method:value('loanMethod')});
    renderQuote(quote.schedule);
    let loan=await app.createCompletion('LOAN',{title:tr('Prêt de ','Loan of ')+fmt(principal),data:{
      principal,currency:'XAF',borrowerMembershipId:value('loanBorrower'),rubricId:officialLoanRubric()?.id??'',meetingId:String(getMeetings().find(m=>m.status==='open')?.id??getMeetings().filter(m=>m.status!=='cancelled').at(-1)?.id??''),installments,annualRateBasisPoints:rate,installmentsPerYear:periodsPerYear,rateBasisPointsPerPeriod:Math.round(rate/periodsPerYear),paymentPriority:value('loanPaymentPriority')||'CAPITAL_FIRST',interestTiming:value('loanInterestTiming')||'NEXT_SESSION_DUE',noInterestOnInterest:true,feesTotal:fees,method:value('loanMethod'),schedule:quote.schedule,outstandingPrincipal:0,unpaidInterest:0
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
  byId('prepareOfflineMeetingBtn')?.addEventListener('click',()=>void run(null,prepareOfflineSnapshot));
  byId('refreshOfflineSnapshotsBtn')?.addEventListener('click',()=>void renderOfflineSnapshots().catch(showError));
  byId('completionKind')?.addEventListener('change',()=>void renderCompletionRecords().catch(showError));
  byId('completionReload')?.addEventListener('click',()=>void refresh().catch(showError));

  // Derived loan/debt tables must react to actual writes and remote commits,
  // without a repeating timer or a background D1 polling loop.
  let debtRefreshTimer=0,debtRefreshTask=Promise.resolve();
  const scheduleDebtRefresh=()=>{
    if(!app.activeGroup()||!byId('loanDebtRecap')||byId('loanCompletionPanel')?.hidden||!byId('view-finance')?.classList.contains('active'))return;
    if(debtRefreshTimer)clearTimeout(debtRefreshTimer);
    debtRefreshTimer=setTimeout(()=>{
      debtRefreshTimer=0;
      debtRefreshTask=debtRefreshTask.catch(()=>{}).then(()=>renderLoanDebtRecap()).catch(showError);
    },220);
  };
  window.addEventListener('eco:financial-data-changed',scheduleDebtRefresh);
  window.addEventListener('eco:financial-live-update',scheduleDebtRefresh);
  window.addEventListener('eco:live-event',event=>{const e=event instanceof CustomEvent?event.detail:undefined,p=e?.payload??{};if(e?.type!=='RULE_UPDATE'||p.kind!=='LOAN_POLICY')return;const rubric=getRubrics().find(r=>String(r.id)===String(p.rubricId));if(rubric){rubric.policies={...(rubric.policies??{}),loan:{...(rubric.policies?.loan??{}),allowed:true,interestBase:'PRINCIPAL_ONLY',noInterestOnInterest:true,rateBasisPointsPerPeriod:Number(p.rateBasisPointsPerPeriod??0),paymentPriority:String(p.paymentPriority??'CAPITAL_FIRST'),interestTiming:String(p.interestTiming??'NEXT_SESSION_DUE'),fundingMode:String(p.fundingMode??'AVAILABLE_GROUP_CASH'),carryForwardUnusedFunds:p.carryForwardUnusedFunds!==false}};hydrateLoanPolicy();}if(!byId('loanCompletionPanel')?.hidden&&byId('view-finance')?.classList.contains('active'))void renderLoans().catch(showError);});

  const setLocale=()=>{fillCompletionKinds();void refresh().catch(showError);};
  return{refresh,setLocale};
};
