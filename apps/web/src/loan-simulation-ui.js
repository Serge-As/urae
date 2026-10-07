const fmt=n=>new Intl.NumberFormat('fr-FR').format(Number(n??0));
const selectPriority=value=>{
  const select=document.createElement('select');
  select.innerHTML='<option value="CAPITAL_FIRST">Capital d’abord</option><option value="INTEREST_FIRST">Intérêts d’abord</option>';
  select.value=String(value)==='INTEREST_FIRST'?'INTEREST_FIRST':'CAPITAL_FIRST';
  return select;
};
const field=(label,input,className='')=>{const l=document.createElement('label');l.textContent=label;if(className)l.className=className;l.append(input);return l;};
const simulationTable=(simulation,title)=>{
  const section=document.createElement('section');section.className='loan-simulation-scenario';
  const h=document.createElement('h3');h.textContent=title;section.append(h);
  const summary=document.createElement('div');summary.className='loan-simulation-summary';
  for(const [label,value] of [['Capital final',simulation.summary.finalPrincipalDue],['Intérêts dus',simulation.summary.finalInterestDue],['Dette finale',simulation.summary.finalDebt]]){
    const box=document.createElement('div'),small=document.createElement('span'),strong=document.createElement('strong');
    small.textContent=label;strong.textContent=fmt(value)+' F CFA';box.append(small,strong);summary.append(box);
  }
  section.append(summary);
  const wrap=document.createElement('div');wrap.className='matrix-wrap';
  const table=document.createElement('table');table.className='meeting-matrix loan-simulation-table';
  table.innerHTML='<thead><tr><th>Période</th><th>Capital avant</th><th>Intérêt nouveau</th><th>Paiement</th><th>Capital payé</th><th>Intérêt payé</th><th>Capital restant</th><th>Intérêts dus</th><th>Dette totale</th></tr></thead>';
  const tb=document.createElement('tbody');
  for(const x of simulation.rows){
    const tr=document.createElement('tr');
    for(const v of [x.period,x.principalBefore,x.interestNew,x.payment,x.principalPaid,x.interestPaid,x.principalAfter,x.interestAfter,x.totalDebtAfter]){
      const td=document.createElement('td');td.textContent=typeof v==='number'?fmt(v):String(v);tr.append(td);
    }
    tb.append(tr);
  }
  table.append(tb);wrap.append(table);section.append(wrap);return section;
};

export const openLoanSimulationDialog=async({app,loan,fallbackDebt=0,fallbackInterest=0,title='Simulation du prêt',memberName=''})=>{
  document.getElementById('loanEvolutionDialog')?.remove();
  const data=loan?.data??{},principal=Math.max(0,Number(data.outstandingPrincipal??data.principal??fallbackDebt??0)),openingInterest=Math.max(0,Number(data.unpaidInterest??fallbackInterest??0));
  const dialog=document.createElement('dialog');dialog.id='loanEvolutionDialog';dialog.className='loan-evolution-dialog';
  const h=document.createElement('h2');h.textContent=title;
  const sub=document.createElement('p');sub.className='hint';sub.textContent=(memberName?memberName+' · ':'')+'Simulation uniquement : aucun scénario ne modifie le prêt, la caisse ou le Ledger.';
  const form=document.createElement('form');form.className='loan-simulation-form';form.method='dialog';
  const common=document.createElement('section');common.className='loan-simulation-common';
  const principalInput=document.createElement('input');principalInput.type='number';principalInput.min='1';principalInput.step='1';principalInput.inputMode='numeric';principalInput.value=String(principal||50000);
  const interestInput=document.createElement('input');interestInput.type='number';interestInput.min='0';interestInput.step='1';interestInput.inputMode='numeric';interestInput.value=String(openingInterest);
  const periods=document.createElement('input');periods.type='number';periods.min='1';periods.max='120';periods.step='1';periods.value=String(Math.max(1,Number(data.remainingPeriods??data.installments??12)||12));
  const payments=document.createElement('input');payments.placeholder='Ex. 5000, 5000, 10000';payments.autocomplete='off';
  common.append(field('Capital restant / montant imaginaire',principalInput),field('Intérêts déjà dus',interestInput),field('Nombre de périodes',periods),field('Paiements prévus (séparés par des virgules)',payments));

  const periodsPerYear=Math.max(1,Number(data.installmentsPerYear??12)||12),bps=Number(data.rateBasisPointsPerPeriod??0),annualBps=Number(data.annualRateBasisPoints??0),initialRate=bps>0?bps/100:annualBps>0?(annualBps/periodsPerYear)/100:0;
  const scenarios=document.createElement('div');scenarios.className='loan-simulation-controls';
  const a=document.createElement('section');a.className='loan-simulation-control-card';const ah=document.createElement('h3');ah.textContent=loan?.id?'Scénario A · politique effective du prêt':'Scénario A';
  const rateA=document.createElement('input');rateA.type='number';rateA.min='0';rateA.max='100';rateA.step='0.01';rateA.value=String(initialRate);
  const priorityA=selectPriority(data.paymentPriority);
  a.append(ah,field('Taux % par période',rateA),field('Priorité',priorityA));

  const compareLabel=document.createElement('label');compareLabel.className='check loan-compare-toggle';
  const compare=document.createElement('input');compare.type='checkbox';const compareText=document.createElement('span');compareText.textContent='Comparer avec un scénario B';compareLabel.append(compare,compareText);
  const b=document.createElement('section');b.className='loan-simulation-control-card loan-simulation-b';b.hidden=true;
  const bh=document.createElement('h3');bh.textContent='Scénario B · alternative';
  const rateB=document.createElement('input');rateB.type='number';rateB.min='0';rateB.max='100';rateB.step='0.01';rateB.value=String(initialRate);
  const priorityB=selectPriority(priorityA.value==='CAPITAL_FIRST'?'INTEREST_FIRST':'CAPITAL_FIRST');
  b.append(bh,field('Taux % par période',rateB),field('Priorité',priorityB));
  compare.onchange=()=>{b.hidden=!compare.checked;};
  scenarios.append(a,b);

  const note=document.createElement('p');note.className='truth-notice full';note.textContent='Les intérêts sont calculés sur le capital restant uniquement. Les intérêts déjà dus restent séparés : aucun intérêt sur intérêt.';
  const actions=document.createElement('div');actions.className='actions full';
  const simulate=document.createElement('button');simulate.type='button';simulate.className='primary';simulate.textContent='Calculer / comparer';
  const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Fermer';close.onclick=()=>dialog.close();actions.append(simulate,close);
  form.append(common,compareLabel,scenarios,note,actions);

  const result=document.createElement('div');result.className='loan-simulation-result';
  const payload=(rate,priority)=>({
    principal:Number(principalInput.value),openingInterestDue:Number(interestInput.value),periods:Number(periods.value),
    ratePercentPerPeriod:Number(rate.value),priority:priority.value,interestBasis:'OUTSTANDING',
    payments:payments.value.split(',').map(x=>x.trim()).filter(Boolean).map(Number)
  });
  const renderHistory=async()=>{
    if(!loan?.id)return null;
    try{
      const history=await app.loanHistory(loan.id);if(!history?.periods?.length)return null;
      const details=document.createElement('details');details.className='loan-real-history';const sm=document.createElement('summary');sm.textContent='Évolution réelle déjà enregistrée ('+history.periods.length+' période(s))';details.append(sm);
      const wrap=document.createElement('div');wrap.className='matrix-wrap';const table=document.createElement('table');table.className='meeting-matrix';table.innerHTML='<thead><tr><th>Séance</th><th>Capital avant</th><th>Paiement</th><th>Capital restant</th><th>Intérêts dus</th><th>Prochain intérêt</th><th>Priorité</th></tr></thead>';const tb=document.createElement('tbody');
      for(const x of history.periods){const tr=document.createElement('tr');for(const v of [x.meetingId||'—',x.principalBefore,x.payment,x.principalAfter,x.interestAfter,x.nextInterestProjected,x.priority||'']){const td=document.createElement('td');td.textContent=typeof v==='number'?fmt(v):String(v);tr.append(td);}tb.append(tr);}table.append(tb);wrap.append(table);details.append(wrap);return details;
    }catch{return null;}
  };
  const render=async()=>{
    const aPayload=payload(rateA,priorityA);
    if(!Number.isSafeInteger(aPayload.principal)||aPayload.principal<=0)throw Error('Capital à simuler requis.');
    if(!Number.isSafeInteger(aPayload.periods)||aPayload.periods<=0)throw Error('Nombre de périodes invalide.');
    const tasks=[app.simulateLoan(aPayload)];if(compare.checked)tasks.push(app.simulateLoan(payload(rateB,priorityB)));
    const sims=await Promise.all(tasks);result.replaceChildren();
    const head=document.createElement('div');head.className='loan-simulation-comparison-head';
    const p=document.createElement('p');p.className='hint';p.textContent=compare.checked?'Les deux scénarios partent du même capital, des mêmes intérêts déjà dus et des mêmes paiements prévus. Seuls le taux et la priorité changent.':'Vous pouvez modifier librement le taux, la priorité et les paiements pour explorer un scénario.';
    head.append(p);result.append(head,simulationTable(sims[0],loan?.id?'Scénario A · situation du prêt':'Scénario A'));
    if(compare.checked&&sims[1]){
      const delta=document.createElement('p');delta.className='truth-notice';
      const diff=Number(sims[1].summary.finalDebt)-Number(sims[0].summary.finalDebt);
      delta.textContent='Écart B – A sur la dette finale : '+(diff>=0?'+':'')+fmt(diff)+' F CFA.';
      result.append(delta,simulationTable(sims[1],'Scénario B · alternative'));
    }
    const history=await renderHistory();if(history)result.append(history);
  };
  simulate.onclick=()=>void render().catch(e=>{result.textContent=e instanceof Error?e.message:String(e);});
  dialog.append(h,sub,form,result);document.body.append(dialog);dialog.showModal();
  if(principal>0)void render().catch(()=>{});
};
