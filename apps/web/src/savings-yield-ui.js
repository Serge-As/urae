const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const number=id=>Number(value(id));
const months=[['JAN','Janvier',9],['FEB','Février',8],['MAR','Mars',7],['APR','Avril',6],['MAY','Mai',5],['JUN','Juin',4],['JUL','Juillet',3],['AUG','Août',2],['SEP','Septembre',1],['OCT','Octobre',0.5],['NOV','Novembre',0],['DEC','Décembre',0]];
const monthSession=new Map(months.map((m,i)=>[m[0],i+1]));

export function mountSavingsYieldUI({app,getMembers,notify=()=>{},showError=console.error,fmt=n=>String(n),isManager=()=>false}){
  const form=document.getElementById('yieldDepositForm'),eventForm=document.getElementById('yieldEventForm'),root=document.getElementById('yieldDepositList'),eventRoot=document.getElementById('yieldEventList'),result=document.getElementById('yieldResult'),coefRoot=document.getElementById('yieldCoefficients'),schoolCoefRoot=document.getElementById('yieldSchoolCoefficients');
  if(!form||!root||!result||!coefRoot)return{refresh:async()=>{}};
  const deposits=[],events=[];let seq=0,eventSeq=0;
  const option=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
  if(!coefRoot.children.length)for(const [key,label,coef] of months){const l=el('label',label);const i=el('input');i.type='number';i.step='0.1';i.min='0';i.value=String(coef);i.dataset.period=key;l.append(i);coefRoot.append(l);}
  const schoolDefaults=new Map([['JAN',7],['FEB',6],['MAR',5],['APR',4],['MAY',3],['JUN',2],['JUL',1],['AUG',0],['SEP',0],['OCT',0],['NOV',0],['DEC',0]]);
  if(schoolCoefRoot&&!schoolCoefRoot.children.length)for(const [key,label] of months){const l=el('label',label);const i=el('input');i.type='number';i.step='0.1';i.min='0';i.value=String(schoolDefaults.get(key)??0);i.dataset.period=key;l.append(i);schoolCoefRoot.append(l);}
  const period=document.getElementById('yieldDepositPeriod');if(period&&!period.children.length)for(const [key,label] of months)period.append(option(key,label));

  const coefficientsFrom=root=>{const out={};for(const input of root?.querySelectorAll('input[data-period]')??[])out[input.dataset.period]=Number(input.value);return out;};
  const coefficients=()=>coefficientsFrom(coefRoot),schoolCoefficients=()=>coefficientsFrom(schoolCoefRoot);
  const bps=v=>Math.round(Number(v)*100);
  const eligiblePeriods=map=>Object.entries(map).filter(([,coef])=>Number(coef)>0).map(([key])=>key);

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
        {fund:'CLASSIC',shareBasisPoints:bps(number('yieldClassicShare')),eligiblePeriods:eligiblePeriods(coefficients()),highestCoefficient:number('yieldHighestCoefficient'),coefficients:coefficients()},
        {fund:'SCHOOL',shareBasisPoints:bps(number('yieldSchoolShare')),eligiblePeriods:eligiblePeriods(schoolCoefficients()),highestCoefficient:number('yieldHighestCoefficientSchool'),coefficients:schoolCoefficients()}
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

  const saverPool=()=>{
    checkShares();const total=number('yieldInterestPool'),office=bps(number('yieldOfficeShare'));
    return Math.round(total*(10000-office)/10000);
  };
  const fundPool=(fund)=>{
    checkShares();const total=number('yieldInterestPool'),share=number(fund==='CLASSIC'?'yieldClassicShare':'yieldSchoolShare');
    return Math.round(total*share/100);
  };
  const renderComparison=(title,sections)=>{
    result.replaceChildren();result.append(el('h3',title));
    for(const s of sections){
      const box=el('article',undefined,'item');box.append(el('strong',s.title));
      if(s.note)box.append(el('p',s.note,'hint'));
      for(const row of s.rows??[])box.append(el('p',row));
      result.append(box);
    }
  };
  const loanCycles=()=>{
    const by=new Map();
    for(const event of events){
      const row=by.get(event.loanId)??{loanId:event.loanId,principal:0,realizedInterest:0,principalRepaid:0,disbursedSession:Infinity,repaidSession:undefined,sourceFund:'CLASSIC'};
      if(event.type==='LOAN_DISBURSEMENT'){row.principal+=event.amount;row.disbursedSession=Math.min(row.disbursedSession,event.session);row.sourceFund=event.fund??row.sourceFund;}
      if(event.type==='LOAN_INTEREST_RECEIPT')row.realizedInterest+=event.amount;
      if(event.type==='LOAN_PRINCIPAL_REPAYMENT'){row.principalRepaid+=event.amount;row.repaidSession=Math.max(row.repaidSession??0,event.session);}
      by.set(event.loanId,row);
    }
    return [...by.values()].filter(x=>x.principal>0).map(x=>({
      loanId:x.loanId,principal:x.principal,realizedInterest:x.realizedInterest,disbursedSession:x.disbursedSession,
      repaidSession:x.principalRepaid>=x.principal?x.repaidSession:undefined,sourceFund:x.sourceFund,
      eligibleFunds:value('yieldPoolingMode')==='CUSTOM_MATRIX'?[x.sourceFund]:undefined
    }));
  };

  document.getElementById('yieldCapitalTimeBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');
    const endSession=number('yieldEndSession'),timeExponent=number('yieldTimeExponent')||1,amountPower=number('yieldAmountPowerFair')||1;
    const sections=[];
    for(const fund of ['CLASSIC','SCHOOL']){
      const fundDeposits=deposits.filter(d=>d.fund===fund);
      if(!fundDeposits.length)continue;
      const eligibleThroughSession=number(fund==='SCHOOL'?'yieldEligibleThroughSchool':'yieldEligibleThrough')||endSession;
      const data=await app.previewCapitalTimeYield({interestPool:fundPool(fund),deposits:fundDeposits.map(d=>({id:d.id,memberId:d.memberId,amount:d.amount,session:d.session,fund:d.fund,periodKey:d.periodKey})),policy:{endSession,eligibleThroughSession,timeExponent,amountPower}});
      sections.push({title:fund==='CLASSIC'?'Épargne classique — Capital × Temps':'Épargne scolaire — Capital × Temps',note:'α='+timeExponent+' · β='+amountPower+' · fin éligibilité séance '+eligibleThroughSession,rows:data.members.map(row=>{const member=getMembers().find(x=>x.id===row.memberId);return (member?.displayName??row.memberId)+' → '+fmt(row.interest);})});
    }
    renderComparison('Interest Fairness Lab — Capital × Temps',sections);
    notify('Simulation Capital × Temps recalculée.');
  }catch(err){showError(err);}})());

  document.getElementById('yieldProductiveBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');checkShares();
    const poolingMode=value('yieldPoolingMode')||'POOLED',residualPolicy=value('yieldResidualPolicy')||'TIME_WEIGHTED';
    const classicResidual=bps(number('yieldResidualClassicShare')),schoolResidual=10000-classicResidual;
    const data=await app.previewAttributedProductiveYield({
      realizedInterestPool:number('yieldInterestPool'),
      deposits:deposits.map(d=>({id:d.id,memberId:d.memberId,amount:d.amount,session:d.session,fund:d.fund,periodKey:d.periodKey})),
      loans:loanCycles(),
      policy:{
        officeShareBasisPoints:bps(number('yieldOfficeShare')),poolingMode,allocationMethod:'PRO_RATA_AVAILABLE',residualPolicy,
        residualFundSharesBasisPoints:residualPolicy==='FIXED_FUND_SPLIT'?{CLASSIC:classicResidual,SCHOOL:schoolResidual}:undefined,
        endSession:number('yieldEndSession'),eligibleThroughSession:number('yieldEligibleThrough')||number('yieldEndSession'),
        timeExponent:number('yieldTimeExponent')||1,amountPower:number('yieldAmountPowerFair')||1
      }
    });
    renderMembers(data,'Capital productif attribué / hybride');
    result.prepend(el('p','Pool épargnants : '+fmt(data.saverPool)+' · intérêts à causalité prouvée : '+fmt(data.evidencedGrossInterest)+' · résidu : '+fmt(data.residualGrossInterest)+' · non alloué : '+fmt(data.unallocatedSaverInterest),'truth-notice'));
    for(const line of data.explanation??[])result.append(el('p',line,'hint'));
    for(const warning of data.warnings??[])result.append(el('p','À examiner : '+warning,'truth-notice'));
    notify('Simulation productive attribuée recalculée.');
  }catch(err){showError(err);}})());

  document.getElementById('yieldDoctorBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');
    const cycles=loanCycles(),evidenced=cycles.reduce((n,x)=>n+x.realizedInterest,0),pool=number('yieldInterestPool');
    const data=await app.savingsYieldDoctor({
      realizedInterestPool:pool,evidencedInterest:evidenced,residualInterest:Math.max(0,pool-evidenced),
      poolingMode:value('yieldPoolingMode'),fixedFundSharesBasisPoints:{CLASSIC:bps(number('yieldClassicShare')),SCHOOL:bps(number('yieldSchoolShare'))},
      classicPrincipal:deposits.filter(x=>x.fund==='CLASSIC').reduce((n,x)=>n+x.amount,0),schoolPrincipal:deposits.filter(x=>x.fund==='SCHOOL').reduce((n,x)=>n+x.amount,0),
      schoolLoanEvidence:cycles.some(x=>x.sourceFund==='SCHOOL'),earlyDepositPriority:true,coefficients:Object.values(coefficients())
    });
    result.replaceChildren(el('h3','Group Doctor — diagnostic de la politique Épargne'));
    for(const finding of data.findings??[]){const card=el('article',undefined,'item');card.append(el('strong',finding.titleFr),el('span',finding.severity,'pill'),el('p',finding.detailFr),el('p','Action proposée : '+finding.actionFr,'hint'));result.append(card);}
    notify('Diagnostic Group Doctor généré sans modification financière.');
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
