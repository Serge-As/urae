const byId=id=>document.getElementById(id);
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const money=n=>new Intl.NumberFormat(document.documentElement.lang==='en'?'en-CM':'fr-CM',{maximumFractionDigits:0}).format(Math.round(Number(n??0)))+' F CFA';
const n=id=>Number(byId(id)?.value??0);
const v=id=>String(byId(id)?.value??'').trim();
const row=(label,value)=>{const d=el('div',undefined,'result-row');d.append(el('span',label),el('strong',value));return d;};

export function mountFinancialLabUI({app,notify,showError}){
  const form=byId('financialLabForm'),result=byId('financialLabResult'),history=byId('financialLabHistory');

  const compute=()=>{
    const participants=Math.max(1,Math.trunc(n('financialLabParticipants'))),deposit=Math.max(0,n('financialLabDeposit')),rate=Math.max(0,n('financialLabRate'))/100,months=Math.max(1,Math.trunc(n('financialLabMonths'))),documentedRevenue=Math.max(0,n('financialLabExternalRevenue')),newDeposits=Math.max(0,n('financialLabNewDeposits')),mode=v('financialLabMode')||'COMPOUND';
    const initial=participants*deposit;
    const promisedPerPerson=mode==='SIMPLE'?deposit*(1+rate*months):deposit*Math.pow(1+rate,months);
    const promisedTotal=promisedPerPerson*participants;
    const documentedResources=initial+documentedRevenue*months;
    const resourcesIncludingNewDeposits=documentedResources+newDeposits*months;
    const gapWithoutNew=Math.max(0,promisedTotal-documentedResources);
    const gapWithNew=Math.max(0,promisedTotal-resourcesIncludingNewDeposits);
    const dependence=Math.max(0,Math.min(1,promisedTotal?newDeposits*months/promisedTotal:0));
    return{participants,deposit,ratePercent:rate*100,months,documentedRevenue,newDeposits,mode,initial,promisedPerPerson,promisedTotal,documentedResources,resourcesIncludingNewDeposits,gapWithoutNew,gapWithNew,dependence};
  };

  const renderAnalysis=(a)=>{
    result.replaceChildren();
    const grid=el('div',undefined,'metrics small');
    const vals=[
      [t('Collecte initiale','Initial funds'),money(a.initial)],
      [t('Valeur promise à échéance','Promised value at term'),money(a.promisedTotal)],
      [t('Ressources documentées sans nouveaux dépôts','Documented resources without new deposits'),money(a.documentedResources)],
      [t('Écart sans nouveaux entrants','Gap without new entrants'),money(a.gapWithoutNew)],
      [t('Ressources avec nouveaux dépôts supposés','Resources incl. assumed new deposits'),money(a.resourcesIncludingNewDeposits)],
      [t('Écart restant avec ces nouveaux dépôts','Remaining gap incl. those deposits'),money(a.gapWithNew)]
    ];
    for(const [label,value] of vals){const c=el('div',undefined,'metric');c.append(el('span',label),el('strong',value));grid.append(c);}result.append(grid);

    const warnings=el('article',undefined,'truth-notice');
    warnings.append(el('strong',t('Lecture pédagogique','Educational reading')));
    const mechanism=v('financialLabMechanism'),evidence=v('financialLabEvidence'),ul=el('ul');
    if(!mechanism)ul.append(el('li',t('Le mécanisme économique produisant le rendement n’est pas décrit. Il faut le demander et le documenter.','The economic mechanism producing the return is not described. It should be requested and documented.')));
    if(!evidence)ul.append(el('li',t('Aucune source ou preuve n’est renseignée. Le résultat reste une simulation d’hypothèses.','No source or evidence is recorded. The result remains an assumptions simulation.')));
    if(a.gapWithoutNew>0)ul.append(el('li',t('Avec les seules ressources documentées saisies, le scénario ne couvre pas la totalité de la valeur promise. Écart à expliquer : ','With only the documented resources entered, the scenario does not cover the full promised value. Gap to explain: ')+money(a.gapWithoutNew)));
    else ul.append(el('li',t('Dans les hypothèses saisies, les ressources documentées sont au moins égales à la valeur promise. Cela ne prouve ni la solvabilité réelle ni la légalité du produit.','Under the entered assumptions, documented resources are at least equal to the promised value. This does not prove actual solvency or legality.')));
    if(a.newDeposits>0&&a.gapWithoutNew>0)ul.append(el('li',t('Le scénario utilise des nouveaux dépôts pour réduire l’écart. Vérifiez si ces dépôts financent une activité réelle ou servent simplement à honorer des promesses antérieures.','The scenario uses new deposits to reduce the gap. Verify whether those deposits fund real activity or merely service earlier promises.')));
    if(a.ratePercent>=20)ul.append(el('li',t('Le rendement saisi est très élevé. Cela ne suffit pas pour qualifier une fraude, mais justifie une vérification renforcée du modèle économique, des risques, retraits, frais et autorisations.','The entered return is very high. That alone does not establish fraud, but it warrants stronger verification of the business model, risks, withdrawals, fees and authorizations.')));
    warnings.append(ul,el('p',t('Eco-System ne conclut pas « Ponzi » ou « arnaque » sur cette base. Il expose les calculs et les questions à vérifier.','Eco-System does not conclude “Ponzi” or “scam” from this alone. It exposes calculations and questions to verify.'),'hint'));result.append(warnings);
  };

  const refreshHistory=async()=>{
    if(!history)return;history.replaceChildren();const rows=await app.listWorkspaceRecords('SAFETY.ANTISCAM',app.activeGroup()||undefined).catch(()=>[]);
    const mine=rows.filter(x=>x.tags?.includes('financial-lab-analysis')).slice().reverse().slice(0,12);
    if(!mine.length){history.append(el('p',t('Aucune analyse enregistrée.','No saved analysis.'),'hint'));return;}
    history.append(el('h3',t('Analyses enregistrées','Saved analyses')));
    for(const r of mine){const item=el('article',undefined,'item');item.append(el('strong',r.title),el('p',r.summary??''),row(t('Valeur promise','Promised value'),money(r.data?.promisedTotal)),row(t('Écart sans nouveaux dépôts','Gap without new deposits'),money(r.data?.gapWithoutNew)),el('small',new Date(r.updatedAt).toLocaleString()));history.append(item);}
  };

  form?.addEventListener('submit',event=>void(async()=>{
    event.preventDefault();
    try{
      const a=compute();renderAnalysis(a);
      const title=v('financialLabTitle');if(!title)throw Error(t('Nom du scénario requis.','Scenario name required.'));
      await app.createWorkspaceRecord({
        moduleId:'SAFETY.ANTISCAM',groupId:app.activeGroup()||undefined,title,
        summary:t('Analyse pédagogique : valeur promise ','Educational analysis: promised value ')+money(a.promisedTotal)+t(' · écart sans nouveaux dépôts ',' · gap without new deposits ')+money(a.gapWithoutNew),
        status:'DONE',tags:['financial-lab-analysis','educational','not-legal-verdict'],
        data:{participants:a.participants,deposit:a.deposit,ratePercent:a.ratePercent,months:a.months,documentedRevenue:a.documentedRevenue,newDeposits:a.newDeposits,mode:a.mode,initial:a.initial,promisedTotal:Math.round(a.promisedTotal),documentedResources:Math.round(a.documentedResources),gapWithoutNew:Math.round(a.gapWithoutNew),gapWithNew:Math.round(a.gapWithNew),mechanism:v('financialLabMechanism'),evidenceRef:v('financialLabEvidence'),legalVerdict:false,realMoney:false}
      });
      notify(t('Analyse enregistrée. Aucun verdict légal ni transaction n’a été produit.','Analysis saved. No legal verdict or transaction was produced.'));
      await refreshHistory();
    }catch(e){showError(e);}
  })());
  byId('financialLabRefreshBtn')?.addEventListener('click',()=>void refreshHistory());
  return{refresh:refreshHistory};
}
