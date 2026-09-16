const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const number=id=>Number(value(id));
const months=[['JAN','Janvier',9],['FEB','Février',8],['MAR','Mars',7],['APR','Avril',6],['MAY','Mai',5],['JUN','Juin',4],['JUL','Juillet',3],['AUG','Août',2],['SEP','Septembre',1],['OCT','Octobre',0.5],['NOV','Novembre',0],['DEC','Décembre',0]];
const monthSession=new Map(months.map((m,i)=>[m[0],i+1]));

export function mountSavingsYieldUI({app,getMembers,notify=()=>{},showError=console.error,fmt=n=>String(n),isManager=()=>false}){
  const form=document.getElementById('yieldDepositForm'),eventForm=document.getElementById('yieldEventForm'),root=document.getElementById('yieldDepositList'),eventRoot=document.getElementById('yieldEventList'),result=document.getElementById('yieldResult'),coefRoot=document.getElementById('yieldCoefficients');
  if(!form||!root||!result||!coefRoot)return{refresh:async()=>{}};
  const deposits=[],events=[];let seq=0,eventSeq=0;
  const option=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
  if(!coefRoot.children.length)for(const [key,label,coef] of months){const l=el('label',label);const i=el('input');i.type='number';i.step='0.1';i.min='0';i.value=String(coef);i.dataset.period=key;l.append(i);coefRoot.append(l);}
  const period=document.getElementById('yieldDepositPeriod');if(period&&!period.children.length)for(const [key,label] of months)period.append(option(key,label));

  const coefficients=()=>{const out={};for(const input of coefRoot.querySelectorAll('input[data-period]'))out[input.dataset.period]=Number(input.value);return out;};
  const bps=v=>Math.round(Number(v)*100);
  const eligiblePeriods=()=>months.filter(([, ,coef])=>Number(coef)>0).map(([key])=>key);

  const renderDeposits=()=>{
    root.replaceChildren();
    if(!deposits.length){root.append(el('p','Ajoutez les dépôts réels de l’exercice. Chaque dépôt garde sa caisse, sa période et sa séance.','hint'));return;}
    for(const d of deposits){
      const member=getMembers().find(x=>x.id===d.memberId),m=months.find(x=>x[0]===d.periodKey);
      const row=el('article',undefined,'item');row.append(el('strong',member?.displayName??d.memberId),el('span',(d.fund==='SCHOOL'?'Épargne scolaire':'Épargne')+' · '+(m?.[1]??d.periodKey)+' · séance '+d.session+' · '+fmt(d.amount),'pill'));
      const b=el('button','Retirer','link-btn');b.type='button';b.onclick=()=>{deposits.splice(deposits.indexOf(d),1);renderDeposits();};row.append(b);root.append(row);
    }
  };
  const renderEvents=()=>{
    if(!eventRoot)return;eventRoot.replaceChildren();
    if(!events.length){eventRoot.append(el('p','Ajoutez les prêts/remboursements réels si vous voulez comparer avec le capital réellement productif.','hint'));return;}
    const labels={LOAN_DISBURSEMENT:'Prêt',LOAN_PRINCIPAL_REPAYMENT:'Remboursement principal',LOAN_INTEREST_RECEIPT:'Intérêt encaissé'};
    for(const e of events){
      const row=el('article',undefined,'item');row.append(el('strong',labels[e.type]??e.type),el('span','séance '+e.session+' · '+e.loanId+' · '+fmt(e.amount),'pill'));
      const b=el('button','Retirer','link-btn');b.type='button';b.onclick=()=>{events.splice(events.indexOf(e),1);renderEvents();};row.append(b);eventRoot.append(row);
    }
  };
  const populateMembers=()=>{
    const select=document.getElementById('yieldDepositMember');if(!select)return;const previous=select.value;select.replaceChildren(option('','Choisir un membre'));
    for(const m of getMembers())select.append(option(m.id,m.displayName));if([...select.options].some(o=>o.value===previous))select.value=previous;
  };
  const checkShares=()=>{
    const shares=number('yieldClassicShare')+number('yieldSchoolShare')+number('yieldOfficeShare');
    if(Math.abs(shares-100)>.0001)throw new Error('Les parts Épargne + Épargne scolaire + Bureau doivent totaliser 100 %.');
  };
  const renderMembers=(data,title)=>{
    result.replaceChildren();result.append(el('h3',title),el('p','Enveloppe effectivement distribuée : '+fmt(data.distributedInterest??data.distributedToSavers??0),'truth-notice'));
    for(const row of data.members??[]){
      const member=getMembers().find(x=>x.id===row.memberId),card=el('article',undefined,'item');
      card.append(el('strong',member?.displayName??row.memberId),el('p','Principal : '+fmt(row.principal)+' · poids/exposition : '+Math.round(row.weightedScore).toLocaleString('fr-FR')),el('span','Gain : '+fmt(row.interest),'pill'));result.append(card);
    }
  };

  form.addEventListener('submit',e=>{e.preventDefault();try{
    const memberId=value('yieldDepositMember'),amount=number('yieldDepositAmount'),periodKey=value('yieldDepositPeriod'),fund=value('yieldDepositFund')||'CLASSIC',session=number('yieldDepositSession')||monthSession.get(periodKey)||1;
    if(!memberId||!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(session)||session<=0)throw new Error('INVALID_SAVINGS_DEPOSIT');
    deposits.push({id:'yield-ui-'+(++seq),memberId,amount,periodKey,fund,session});document.getElementById('yieldDepositAmount').value='';renderDeposits();
  }catch(err){showError(err);}});

  eventForm?.addEventListener('submit',e=>{e.preventDefault();try{
    const type=value('yieldEventType'),session=number('yieldEventSession'),loanId=value('yieldEventLoanId'),fund=value('yieldEventFund')||'CLASSIC',amount=number('yieldEventAmount');
    if(!loanId||!Number.isSafeInteger(session)||session<=0||!Number.isSafeInteger(amount)||amount<=0)throw new Error('INVALID_SAVINGS_EVENT');
    const event={id:'yield-event-'+(++eventSeq),type,session,loanId,amount};if(type!=='LOAN_PRINCIPAL_REPAYMENT')event.fund=fund;events.push(event);
    document.getElementById('yieldEventAmount').value='';renderEvents();
  }catch(err){showError(err);}});

  document.getElementById('yieldWorkbookBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');checkShares();
    const data=await app.previewWorkbookSavingsYield({
      realizedInterestPool:number('yieldInterestPool'),bureauShareBasisPoints:bps(number('yieldOfficeShare')),
      deposits:deposits.map(({session,...d})=>d),
      funds:[
        {fund:'CLASSIC',shareBasisPoints:bps(number('yieldClassicShare')),eligiblePeriods:eligiblePeriods(),highestCoefficient:number('yieldHighestCoefficient'),coefficients:coefficients()},
        {fund:'SCHOOL',shareBasisPoints:bps(number('yieldSchoolShare')),eligiblePeriods:eligiblePeriods(),highestCoefficient:number('yieldHighestCoefficient'),coefficients:coefficients()}
      ]
    });
    result.replaceChildren();result.append(el('h3','Reproduction du moteur historique'),el('p','Pool réel : '+fmt(data.realizedInterestPool)+' · Bureau : '+fmt(data.bureauIndemnity)+' · Épargnants : '+fmt(data.distributedToSavers),'truth-notice'));
    result.append(el('p',data.algebraicFinding,'hint'));
    for(const fund of data.funds){
      const box=el('article',undefined,'item');box.append(el('strong',fund.fund==='CLASSIC'?'Épargne classique':'Épargne scolaire'),el('p','Principal annuel : '+fmt(fund.totalPrincipal)+' · Pool : '+fmt(fund.allocatedPool)),el('p','Taux général : '+fund.generalRatePercent.toFixed(6)+' % · taux provisoire : '+fund.provisionalBaseRate.toFixed(6)+' · total provisoire : '+fund.provisionalTotal.toFixed(2)+' · ratio final : '+fund.normalizationRatio.toFixed(6),'hint'));
      for(const row of fund.members){const member=getMembers().find(x=>x.id===row.memberId);box.append(el('p',(member?.displayName??row.memberId)+' → '+fmt(row.interest)));}
      result.append(box);
    }
    notify('Moteur Excel reproduit sans comptabilisation.');
  }catch(err){showError(err);}})());

  document.getElementById('yieldProductiveBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');
    const data=await app.previewCapitalAtWorkYield({
      interestPool:number('yieldInterestPool'),endSession:number('yieldEndSession'),
      deposits:deposits.map(d=>({id:d.id,memberId:d.memberId,amount:d.amount,session:d.session,fund:d.fund})),
      events:events.map(({id,...e})=>e),
      policy:{allocationMethod:'PRO_RATA_AVAILABLE',noLoanNoYield:Boolean(document.getElementById('yieldNoLoanNoYield')?.checked),recyclePrincipalRepayments:Boolean(document.getElementById('yieldRecyclePrincipal')?.checked),reinvestRealizedInterest:Boolean(document.getElementById('yieldReinvestInterest')?.checked)}
    });
    renderMembers(data,'Capital réellement productif');
    result.prepend(el('p','Prêts accordés : '+fmt(data.loansDisbursed)+' · principal remboursé : '+fmt(data.principalRepaid)+' · intérêts encaissés observés : '+fmt(data.realizedInterestReceipts),'truth-notice'));
    for(const line of data.explanation??[])result.append(el('p',line,'hint'));
    notify('Simulation capital productif recalculée.');
  }catch(err){showError(err);}})());

  document.getElementById('yieldPreviewBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');
    const data=await app.previewSavingsYield({interestPool:number('yieldInterestPool'),deposits:deposits.map(({fund,session,...d})=>d),coefficients:coefficients(),mode:value('yieldMode')||'EXACT_WEIGHTED_DEPOSITS',amountPower:number('yieldAmountPower')||0.75});
    renderMembers(data,'Ancien moteur simplifié');
  }catch(err){showError(err);}})());

  period?.addEventListener('change',()=>{const s=document.getElementById('yieldDepositSession');if(s)s.value=String(monthSession.get(period.value)??1);});
  renderDeposits();renderEvents();
  return{refresh:async()=>{populateMembers();}};
}
