const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const months=[['JAN','Janvier',9],['FEB','Février',8],['MAR','Mars',7],['APR','Avril',6],['MAY','Mai',5],['JUN','Juin',4],['JUL','Juillet',3],['AUG','Août',2],['SEP','Septembre',1],['OCT','Octobre',0.5],['NOV','Novembre',0],['DEC','Décembre',0]];

export function mountSavingsYieldUI({app,getMembers,notify=()=>{},showError=console.error,fmt=n=>String(n),isManager=()=>false}){
  const form=document.getElementById('yieldDepositForm'),root=document.getElementById('yieldDepositList'),result=document.getElementById('yieldResult'),coefRoot=document.getElementById('yieldCoefficients');
  if(!form||!root||!result||!coefRoot)return{refresh:async()=>{}};
  const deposits=[];let seq=0;
  const option=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
  if(!coefRoot.children.length)for(const [key,label,coef] of months){const l=el('label',label);const i=el('input');i.type='number';i.step='0.1';i.min='0';i.value=String(coef);i.dataset.period=key;l.append(i);coefRoot.append(l);}
  const period=document.getElementById('yieldDepositPeriod');if(!period.children.length)for(const [key,label] of months)period.append(option(key,label));
  const renderDeposits=()=>{
    root.replaceChildren();
    if(!deposits.length){root.append(el('p','Ajoutez les dépôts réels de l’exercice. Chaque ligne garde son propre mois/coefficient.','hint'));return;}
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
  form.addEventListener('submit',e=>{e.preventDefault();try{
    const memberId=value('yieldDepositMember'),amount=Number(value('yieldDepositAmount')),periodKey=value('yieldDepositPeriod');
    if(!memberId||!Number.isSafeInteger(amount)||amount<=0)throw new Error('INVALID_SAVINGS_DEPOSIT');
    deposits.push({id:'yield-ui-'+(++seq),memberId,amount,periodKey});document.getElementById('yieldDepositAmount').value='';renderDeposits();
  }catch(err){showError(err);}});
  document.getElementById('yieldPreviewBtn')?.addEventListener('click',()=>void(async()=>{try{
    if(!isManager())throw new Error('FORBIDDEN_SCOPE');
    const coefficients={};for(const input of coefRoot.querySelectorAll('input[data-period]'))coefficients[input.dataset.period]=Number(input.value);
    const pool=Number(value('yieldInterestPool')),mode=value('yieldMode')||'EXACT_WEIGHTED_DEPOSITS',amountPower=Number(value('yieldAmountPower')||0.75);
    const data=await app.previewSavingsYield({interestPool:pool,deposits,coefficients,mode,amountPower});
    result.replaceChildren();result.append(el('p','Enveloppe distribuée : '+fmt(data.distributedInterest)+' / '+fmt(data.interestPool),'truth-notice'));
    for(const row of data.members){const member=getMembers().find(x=>x.id===row.memberId),card=el('article',undefined,'item');card.append(el('strong',member?.displayName??row.memberId),el('p','Capital déposé : '+fmt(row.principal)+' · Score pondéré : '+Math.round(row.weightedScore).toLocaleString('fr-FR')),el('span','Intérêts : '+fmt(row.interest),'pill'));result.append(card);}
    notify('Simulation recalculée. Aucun montant n’a été comptabilisé.');
  }catch(err){showError(err);}})());
  document.getElementById('yieldLegacySplitBtn')?.addEventListener('click',()=>void(async()=>{try{
    const total=Number(value('yieldInterestPool')),split=await app.previewInterestSplit(total,[{key:'EPARGNE',basisPoints:7000},{key:'EPARGNE_SCOLAIRE',basisPoints:1000},{key:'BUREAU',basisPoints:2000}]);
    notify(split.map(x=>x.key+' '+fmt(x.amount)).join(' · '));
  }catch(err){showError(err);}})());
  renderDeposits();
  return{refresh:async()=>{populateMembers();}};
}
