export const openLoanSimulationDialog=async({app,loan,fallbackDebt=0,fallbackInterest=0,title='Simulation du prêt',memberName=''})=>{
  document.getElementById('loanEvolutionDialog')?.remove();
  const data=loan?.data??{},principal=Math.max(0,Number(data.outstandingPrincipal??data.principal??fallbackDebt??0)),openingInterest=Math.max(0,Number(data.unpaidInterest??fallbackInterest??0));
  const dialog=document.createElement('dialog');dialog.id='loanEvolutionDialog';dialog.className='loan-evolution-dialog';
  const h=document.createElement('h2');h.textContent=title;
  const sub=document.createElement('p');sub.textContent=(memberName?memberName+' · ':'')+'Simulation uniquement : elle ne modifie ni le prêt ni le Ledger.';
  const form=document.createElement('form');form.className='form-grid';form.method='dialog';
  const field=(label,input)=>{const l=document.createElement('label');l.textContent=label;l.append(input);return l;};
  const principalInput=document.createElement('input');principalInput.type='number';principalInput.min='0';principalInput.step='1';principalInput.value=String(principal);
  const interestInput=document.createElement('input');interestInput.type='number';interestInput.min='0';interestInput.step='1';interestInput.value=String(openingInterest);
  const periods=document.createElement('input');periods.type='number';periods.min='1';periods.max='120';periods.step='1';periods.value=String(Math.max(1,Number(data.remainingPeriods??data.installments??12)||12));
  const rate=document.createElement('input');rate.type='number';rate.min='0';rate.max='100';rate.step='0.01';
  const periodsPerYear=Math.max(1,Number(data.installmentsPerYear??12)||12),bps=Number(data.rateBasisPointsPerPeriod??0),annualBps=Number(data.annualRateBasisPoints??0);rate.value=bps>0?String(bps/100):annualBps>0?String((annualBps/periodsPerYear)/100):'0';
  const priority=document.createElement('select');priority.innerHTML='<option value="CAPITAL_FIRST">Capital d’abord</option><option value="INTEREST_FIRST">Intérêts d’abord</option>';priority.value=String(data.paymentPriority??'CAPITAL_FIRST');
  const payments=document.createElement('input');payments.placeholder='Ex. 5000, 5000, 10000';payments.autocomplete='off';
  const note=document.createElement('p');note.className='hint';note.textContent='Le taux est saisi par période/séance. Les intérêts impayés restent séparés : aucun intérêt n’est calculé sur les intérêts.';
  const result=document.createElement('div');result.className='stack loan-simulation-result';
  const actions=document.createElement('div');actions.className='actions full';
  const simulate=document.createElement('button');simulate.type='button';simulate.className='primary';simulate.textContent='Calculer l’évolution';
  const close=document.createElement('button');close.type='button';close.textContent='Fermer';close.onclick=()=>dialog.close();actions.append(simulate,close);
  form.append(field('Capital restant / montant à simuler',principalInput),field('Intérêts déjà dus',interestInput),field('Nombre de périodes',periods),field('Taux % par période',rate),field('Priorité de remboursement',priority),field('Paiements prévus, séparés par des virgules',payments),note,actions);
  const render=async()=>{
    const p=Number(principalInput.value),oi=Number(interestInput.value),n=Number(periods.value),r=Number(rate.value),pay=payments.value.split(',').map(x=>x.trim()).filter(Boolean).map(Number);
    if(!Number.isSafeInteger(p)||p<=0)throw Error('Capital à simuler requis.');
    const simulation=await app.simulateLoan({principal:p,openingInterestDue:oi,periods:n,ratePercentPerPeriod:r,priority:priority.value,interestBasis:'OUTSTANDING',payments:pay});
    result.replaceChildren();
    const summary=document.createElement('p');summary.className='truth-notice';summary.textContent='Après '+simulation.summary.periodsSimulated+' période(s) : capital dû '+new Intl.NumberFormat('fr-FR').format(simulation.summary.finalPrincipalDue)+' F CFA · intérêts dus '+new Intl.NumberFormat('fr-FR').format(simulation.summary.finalInterestDue)+' F CFA · dette totale '+new Intl.NumberFormat('fr-FR').format(simulation.summary.finalDebt)+' F CFA.';result.append(summary);
    const wrap=document.createElement('div');wrap.className='matrix-wrap';const table=document.createElement('table');table.className='meeting-matrix';table.innerHTML='<thead><tr><th>Période</th><th>Capital avant</th><th>Intérêt nouveau</th><th>Paiement</th><th>Capital payé</th><th>Intérêt payé</th><th>Capital restant</th><th>Intérêts dus</th><th>Dette totale</th></tr></thead>';
    const tb=document.createElement('tbody');
    for(const x of simulation.rows){const tr=document.createElement('tr');for(const v of [x.period,x.principalBefore,x.interestNew,x.payment,x.principalPaid,x.interestPaid,x.principalAfter,x.interestAfter,x.totalDebtAfter]){const td=document.createElement('td');td.textContent=typeof v==='number'?new Intl.NumberFormat('fr-FR').format(v):String(v);tr.append(td);}tb.append(tr);}
    table.append(tb);wrap.append(table);result.append(wrap);
    if(loan?.id){try{const history=await app.loanHistory(loan.id);if(history?.periods?.length){const actual=document.createElement('details');const sm=document.createElement('summary');sm.textContent='Évolution réelle déjà enregistrée';actual.append(sm);for(const x of history.periods){const p=document.createElement('p');p.textContent='Période '+(x.meetingId||'—')+' · capital '+new Intl.NumberFormat('fr-FR').format(x.principalBefore)+' → '+new Intl.NumberFormat('fr-FR').format(x.principalAfter)+' · intérêts '+new Intl.NumberFormat('fr-FR').format(x.interestAfter)+' · paiement '+new Intl.NumberFormat('fr-FR').format(x.payment);actual.append(p);}result.append(actual);}}catch{}}
  };
  simulate.onclick=()=>void render().catch(e=>{result.textContent=e instanceof Error?e.message:String(e);});
  dialog.append(h,sub,form,result);document.body.append(dialog);dialog.showModal();
  if(principal>0)void render().catch(()=>{});
};
