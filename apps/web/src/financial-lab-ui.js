const byId=id=>document.getElementById(id);
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const money=n=>new Intl.NumberFormat(document.documentElement.lang==='en'?'en-CM':'fr-CM',{maximumFractionDigits:0}).format(Math.round(Number(n??0)))+' F CFA';
const n=id=>Number(byId(id)?.value??0);
const v=id=>String(byId(id)?.value??'').trim();
const row=(label,value)=>{const d=el('div',undefined,'result-row');d.append(el('span',label),el('strong',value));return d;};

export function mountFinancialLabUI({app,notify,showError,isManager=()=>false}){
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
    if(!history)return;history.replaceChildren();const rows=await app.safetyAnalyses().catch(()=>[]);
    const mine=rows.slice(0,12);
    if(!mine.length){history.append(el('p',t('Aucune analyse enregistrée.','No saved analysis.'),'hint'));return;}
    history.append(el('h3',t('Analyses enregistrées','Saved analyses')));
    for(const r of mine){const item=el('article',undefined,'item');item.append(el('strong',r.title),el('p',r.summary??''),row(t('Valeur promise','Promised value'),money(r.data?.promisedTotal)),row(t('Écart sans nouveaux dépôts','Gap without new deposits'),money(r.data?.gapWithoutNew)),el('small',new Date(r.updatedAt).toLocaleString()));history.append(item);}
  };

  const caseList=byId('safetyCaseList');
  const refreshCases=async()=>{
    if(!caseList)return;caseList.replaceChildren();const cases=await app.safetyCases().catch(()=>[]);
    if(!cases.length){caseList.append(el('p',t('Aucun dossier sécurité visible pour vous.','No safety case visible to you.'),'hint'));return;}
    for(const c of cases){
      const item=el('article',undefined,'item safety-case-card'),head=el('div',undefined,'panel-head'),copy=el('div');
      copy.append(el('strong',c.title),el('p',String(c.summary??''),'hint'));head.append(copy);
      const state=el('span',String(c.data?.state??'DETECTED'),'pill');head.append(state);item.append(head);
      let signals=[];try{signals=JSON.parse(String(c.data?.signalsJson??'[]'));}catch{}
      const meta=el('div',undefined,'result-grid');meta.append(row(t('Sévérité','Severity'),String(c.data?.highestSeverity??'INFO')),row(t('Restriction','Restriction'),String(c.data?.restriction??'NONE')),row(t('Recours','Appeals'),String(c.data?.appealCount??0)));item.append(meta);
      if(signals.length){const ul=el('ul',undefined,'compact-list');for(const sig of signals.slice(0,6))ul.append(el('li',sig.code+' · '+sig.severity+' — '+sig.reason));item.append(ul);}
      const actions=el('div',undefined,'actions');
      const appeal=el('button',t('Contester / ajouter un recours','Appeal / add response'),'secondary');appeal.type='button';appeal.onclick=()=>void(async()=>{const summary=prompt(t('Expliquez votre contestation ou apportez une précision :','Explain your appeal or add context:'));if(!summary?.trim())return;try{await app.appealSafetyCase(c.id,summary);notify(t('Recours enregistré.','Appeal recorded.'));await refreshCases();}catch(e){showError(e);}});actions.append(appeal);
      if(isManager()){
        const triage=el('button',t('Qualifier','Triage'),'secondary');triage.type='button';triage.onclick=()=>void(async()=>{const note=prompt(t('Note de qualification :','Triage note:'));if(!note?.trim())return;try{await app.reviewSafetyCase(c.id,{state:'TRIAGED',restriction:'REQUIRE_REVIEW',note});notify(t('Dossier qualifié.','Case triaged.'));await refreshCases();}catch(e){showError(e);}});actions.append(triage);
        const resolve=el('button',t('Résoudre avec preuve','Resolve with evidence'),'secondary');resolve.type='button';resolve.onclick=()=>void(async()=>{const note=prompt(t('Conclusion de la revue :','Review conclusion:'));if(!note?.trim())return;const evidenceRef=prompt(t('Référence de preuve obligatoire :','Required evidence reference:'));if(!evidenceRef?.trim())return;try{await app.reviewSafetyCase(c.id,{state:'RESOLVED',restriction:'NONE',note,evidenceRef});notify(t('Dossier résolu avec preuve, historique conservé.','Case resolved with evidence; history retained.'));await refreshCases();}catch(e){showError(e);}});actions.append(resolve);
      }
      item.append(actions);caseList.append(item);
    }
  };

  byId('safetyReportForm')?.addEventListener('submit',event=>void(async()=>{
    event.preventDefault();try{
      const saved=await app.reportSafety({title:v('safetyReportTitle'),targetType:v('safetyReportTargetType'),targetId:v('safetyReportTargetId'),channel:v('safetyReportChannel'),summary:v('safetyReportSummary'),evidenceRef:v('safetyReportEvidence')});
      notify(t('Dossier privé créé. Le signalement n’est pas publié comme accusation.','Private case created. The report is not published as an accusation.'));
      event.currentTarget.reset();await refreshCases();
      if(saved?.analysis?.signals?.length){const box=el('article',undefined,'truth-notice');box.append(el('strong',t('Signaux automatiques à examiner','Automatic signals to review')));const ul=el('ul');for(const sig of saved.analysis.signals)ul.append(el('li',sig.code+' · '+sig.severity+' — '+sig.reason));box.append(ul);caseList.prepend(box);}
    }catch(e){showError(e);}
  })());
  byId('safetyCasesRefreshBtn')?.addEventListener('click',()=>void refreshCases());

  form?.addEventListener('submit',event=>void(async()=>{
    event.preventDefault();
    try{
      const a=compute();renderAnalysis(a);
      const title=v('financialLabTitle');if(!title)throw Error(t('Nom du scénario requis.','Scenario name required.'));
      const saved=await app.runFinancialSafetyLab({title,participants:a.participants,deposit:a.deposit,ratePercent:a.ratePercent,months:a.months,documentedRevenue:a.documentedRevenue,newDeposits:a.newDeposits,mode:a.mode,mechanism:v('financialLabMechanism'),evidenceRef:v('financialLabEvidence')});
      const analysis=saved?.analysis;
      if(analysis?.signals?.length){
        const box=el('article',undefined,'truth-notice safety-signal-box');box.append(el('strong',t('Signaux à vérifier — pas un verdict','Signals to review — not a verdict')));
        const ul=el('ul');for(const sig of analysis.signals){const li=el('li');li.append(el('strong',sig.code+' · '+sig.severity),document.createTextNode(' — '+sig.reason));ul.append(li);}box.append(ul);result.append(box);
      }
      notify(t('Analyse enregistrée par le moteur Safety canonique. Aucun verdict légal ni transaction n’a été produit.','Analysis saved by the canonical Safety engine. No legal verdict or transaction was produced.'));
      await refreshHistory();
    }catch(e){showError(e);}
  })());
  byId('financialLabRefreshBtn')?.addEventListener('click',()=>void refreshHistory());
  return{refresh:async()=>{await refreshHistory();await refreshCases();}};
}
