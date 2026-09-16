const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
const months=[['JAN','Janvier',9],['FEB','Février',8],['MAR','Mars',7],['APR','Avril',6],['MAY','Mai',5],['JUN','Juin',4],['JUL','Juillet',3],['AUG','Août',2],['SEP','Septembre',1],['OCT','Octobre',0.5],['NOV','Novembre',0],['DEC','Décembre',0]];

export function mountSavingsYieldUI({app,getMembers,notify=()=>{},showError=console.error,fmt=n=>String(n),isManager=()=>false}){
  const form=document.getElementById('yieldDepositForm'),root=document.getElementById('yieldDepositList'),result=document.getElementById('yieldResult'),coefRoot=document.getElementById('yieldCoefficients'),activityRoot=document.getElementById('yieldActivityGrid');
  if(!form||!root||!result||!coefRoot||!activityRoot)return{refresh:async()=>{}};
  const deposits=[];let seq=0;
  const option=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
  if(!coefRoot.children.length)for(const [key,label,coef] of months){const l=el('label',label);const i=el('input');i.type='number';i.step='0.1';i.min='0';i.value=String(coef);i.dataset.period=key;l.append(i);coefRoot.append(l);}
  const period=document.getElementById('yieldDepositPeriod');if(!period.children.length)for(const [key,label] of months)period.append(option(key,label));

  const renderActivity=()=>{
    if(activityRoot.children.length)return;
    const table=el('table');const head=el('thead'),hr=el('tr');
    for(const h of ['Période','Nouveaux prêts','Capital remboursé','Intérêts encaissés'])hr.append(el('th',h));
    head.append(hr);table.append(head);const body=el('tbody');
    for(const [key,label] of months){
      const tr=el('tr');tr.append(el('td',label));
      for(const field of ['loan','repay','interest']){
        const td=el('td'),input=el('input');input.type='number';input.min='0';input.step='1';input.value='0';input.dataset.period=key;input.dataset.activity=field;input.setAttribute('aria-label',label+' '+field);td.append(input);tr.append(td);
      }
      body.append(tr);
    }
    table.append(body);activityRoot.append(table);
  };

  const activityFor=key=>{
    const find=kind=>num(activityRoot.querySelector(`input[data-period="${key}"][data-activity="${kind}"]`)?.value);
    return{loanDisbursed:find('loan'),principalRepaid:find('repay'),interestCollected:find('interest')};
  };
  const allActivities=()=>months.map(([key],i)=>({periodKey:key,sequence:i+1,...activityFor(key)}));

  const renderDeposits=()=>{
    root.replaceChildren();
    if(!deposits.length){root.append(el('p','Ajoutez les dépôts réels de l’exercice. Chaque ligne garde sa séance/période et peut ensuite être rapprochée des prêts réellement accordés.','hint'));return;}
    for(const d of deposits){
      const member=getMembers().find(x=>x.id===d.memberId),m=months.find(x=>x[0]===d.periodKey);
      const row=el('article',undefined,'item');row.append(el('strong',member?.displayName??d.memberId),el('span',(m?.[1]??d.periodKey)+' · '+fmt(d.amount),'pill'));
      const b=el('button','Retirer','link-btn');b.type='button';b.onclick=()=>{deposits.splice(deposits.indexOf(d),1);renderDeposits();};row.append(b);root.append(row);
    }
  };
  const populateMembers=()=>{
    const select=document.getElementById('yieldDepositMember'),previous=select.value;select.replaceChildren(option('','Choisir un membre'));
    for(const m of getMembers())select.append(option(m.id,m.displayName));if([...select.options].some(o=>o.value===previous))select.value=previous;
  };
  const coefficients=()=>{const out={};for(const input of coefRoot.querySelectorAll('input[data-period]'))out[input.dataset.period]=Number(input.value);return out;};
  const renderClassicResult=data=>{
    result.replaceChildren();
    const stage=el('article',undefined,'item');
    stage.append(el('strong','Chaîne de calcul reconstruite'));
    stage.append(el('p','Principal total : '+fmt(data.totalPrincipal)));
    stage.append(el('p','Taux général affiché : '+Number(data.stages?.generalRatePercent??0).toLocaleString('fr-FR',{maximumFractionDigits:6})+' %'));
    stage.append(el('p','Coefficient maximum : '+Number(data.stages?.maxCoefficient??0).toLocaleString('fr-FR')));
    stage.append(el('p','Taux provisoire de base : '+Number(data.stages?.provisionalBaseRate??0).toLocaleString('fr-FR',{maximumFractionDigits:8})));
    stage.append(el('p','Total intérêts provisoires : '+Number(data.stages?.provisionalTotal??0).toLocaleString('fr-FR',{maximumFractionDigits:2})));
    stage.append(el('p','Ratio de normalisation final : '+Number(data.stages?.normalizationRatio??0).toLocaleString('fr-FR',{maximumFractionDigits:8})));
    result.append(stage,el('p','Enveloppe finale distribuée : '+fmt(data.distributedInterest)+' / '+fmt(data.interestPool),'truth-notice'));
    for(const row of data.members){const member=getMembers().find(x=>x.id===row.memberId),card=el('article',undefined,'item');card.append(el('strong',member?.displayName??row.memberId),el('p','Épargne : '+fmt(row.principal)+' · poids cumulé : '+Math.round(row.weightedScore).toLocaleString('fr-FR')),el('span','Gain final : '+fmt(row.interest),'pill'));result.append(card);}
    for(const line of data.explanation??[])result.append(el('p',line,'hint'));
  };
  form.addEventListener('submit',e=>{e.preventDefault();try{
    const memberId=value('yieldDepositMember'),amount=Number(value('yieldDepositAmount')),periodKey=value('yieldDepositPeriod');
    if(!memberId||!Number.isSafeInteger(amount)||amount<=0)throw new Error('INVALID_SAVINGS_DEPOSIT');
    deposits.push({id:'yield-ui-'+(++seq),memberId,amount,periodKey});document.getElementById('yieldDepositAmount').value='';renderDeposits();
  }catch(err){showError(err);}});
  document.getElementById('yieldPreviewBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');
    const pool=Number(value('yieldInterestPool')),mode=value('yieldMode')||'WORKBOOK_RECONSTRUCTED',amountPower=Number(value('yieldAmountPower')||0.75);
    const noLoan=document.getElementById('yieldNoLoanNoYield')?.checked,periodProductivity={};
    if(noLoan)for(const [key] of months)periodProductivity[key]=activityFor(key).loanDisbursed>0?1:0;
    const data=await app.previewSavingsYield({interestPool:pool,deposits,coefficients:coefficients(),mode,amountPower,periodProductivity:noLoan?periodProductivity:undefined});
    renderClassicResult(data);notify('Calcul reconstruit. Aucun montant n’a été comptabilisé.');
  }catch(err){showError(err);}})());
  document.getElementById('yieldAtWorkPreviewBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');
    const data=await app.previewSavingsYieldAtWork({
      interestPool:Number(value('yieldInterestPool')),deposits,periods:allActivities(),
      policy:{utilizationBasis:value('yieldAtWorkBasis')||'NEW_DISBURSEMENT',includeInterestAsLendable:Boolean(document.getElementById('yieldRelendInterest')?.checked)}
    });
    result.replaceChildren();
    result.append(el('p','Méthode capital au travail · '+fmt(data.distributedInterest)+' distribués sur '+fmt(data.interestPool),'truth-notice'));
    for(const p of data.periods.filter(x=>x.memberOwnedPrincipal||x.loanDisbursed||x.principalRepaid)){
      const card=el('article',undefined,'item');card.append(el('strong',months.find(x=>x[0]===p.periodKey)?.[1]??p.periodKey),el('p','Capital membres : '+fmt(p.memberOwnedPrincipal)+' · prêts nouveaux : '+fmt(p.loanDisbursed)+' · remboursements : '+fmt(p.principalRepaid)),el('span','Utilisation : '+(p.utilization*100).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %','pill'));result.append(card);
    }
    for(const row of data.members){const member=getMembers().find(x=>x.id===row.memberId),card=el('article',undefined,'item');card.append(el('strong',member?.displayName??row.memberId),el('p','Capital détenu : '+fmt(row.principal)+' · exposition productive : '+Math.round(row.weightedScore).toLocaleString('fr-FR')),el('span','Gain : '+fmt(row.interest),'pill'));result.append(card);}
    for(const w of data.warnings??[])result.append(el('p','Alerte simulation : '+w,'truth-notice'));
    for(const line of data.explanation??[])result.append(el('p',line,'hint'));
    notify('Comparaison capital au travail calculée.');
  }catch(err){showError(err);}})());
  document.getElementById('yieldLegacySplitBtn')?.addEventListener('click',()=>void(async()=>{try{
    const total=Number(value('yieldInterestPool')),split=await app.previewInterestSplit(total,[{key:'EPARGNE',basisPoints:7000},{key:'EPARGNE_SCOLAIRE',basisPoints:1000},{key:'BUREAU',basisPoints:2000}]);
    notify(split.map(x=>x.key+' '+fmt(x.amount)).join(' · '));
  }catch(err){showError(err);}})());
  renderActivity();renderDeposits();
  return{refresh:async()=>{populateMembers();}};
}
