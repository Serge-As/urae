const byId=id=>document.getElementById(id);
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const money=n=>new Intl.NumberFormat(document.documentElement.lang==='en'?'en-CM':'fr-CM',{maximumFractionDigits:0}).format(Math.round(Number(n??0)))+' F CFA';
const n=id=>Number(byId(id)?.value??0);
const v=id=>String(byId(id)?.value??'').trim();
const row=(label,value)=>{const d=el('div',undefined,'result-row');d.append(el('span',label),el('strong',value));return d;};

export function mountFinancialLabUI({app,notify,showError}){
  const form=byId('financialLabForm'),result=byId('financialLabResult'),history=byId('financialLabHistory'),safetyForm=byId('safetyReportForm'),safetyList=byId('safetyCasesList');

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

  const renderSafetyCases=async()=>{
    if(!safetyList)return;safetyList.replaceChildren();
    try{
      const cases=await app.safetyCases(app.activeGroup()||undefined);
      if(!cases.length){safetyList.append(el('p',t('Aucun dossier de sécurité accessible.','No accessible safety case.'),'hint'));return;}
      for(const c of cases){
        const state=String(c.data?.caseState??'DETECTED'),card=el('article',undefined,'item');
        const top=el('div',undefined,'actions');top.append(el('strong',String(c.data?.category??'OTHER')+' · '+String(c.data?.subjectType??'')),el('span',state,'pill'));card.append(top);
        card.append(el('p',String(c.data?.summary??c.summary??'')),el('p',t('Statut de constat : ','Finding status: ')+String(c.data?.findingStatus??'UNVERIFIED_SUSPICION')+t(' · accusation publique : NON · effet automatique sur score financier : NON',' · public accusation: NO · automatic financial score effect: NO'),'truth-notice'));
        const actions=el('div',undefined,'actions');
        const transition=(label,to)=>{const b=el('button',label,'secondary');b.type='button';b.onclick=()=>void app.transitionSafetyCase(c.id,to).then(()=>{notify(t('Dossier mis à jour.','Case updated.'));return renderSafetyCases();}).catch(showError);actions.append(b);};
        if(state==='DETECTED'){transition(t('Qualifier','Triage'),'TRIAGED');transition(t('Clore sans suite','Close'),'RESOLVED');}
        if(state==='TRIAGED'){transition(t('Ouvrir l’enquête','Investigate'),'INVESTIGATING');transition(t('Clore','Close'),'RESOLVED');}
        if(state==='INVESTIGATING'){
          const decision=document.createElement('form');decision.className='form-grid safety-decision-form';
          const a=document.createElement('select');a.name='action';for(const [v,l] of [['NO_ACTION',t('Aucune action','No action')],['WARN',t('Avertissement','Warning')],['LIMIT',t('Limiter','Limit')],['SUSPEND',t('Suspendre','Suspend')],['RESTORE',t('Restaurer','Restore')]])a.append(new Option(l,v));
          const finding=document.createElement('select');finding.name='findingStatus';for(const [v,l] of [['UNVERIFIED_SUSPICION',t('Soupçon non vérifié','Unverified suspicion')],['SUPPORTED_BY_REVIEW',t('Étayé par revue','Supported by review')],['NOT_SUPPORTED',t('Non étayé','Not supported')]])finding.append(new Option(l,v));
          const reason=document.createElement('input');reason.name='reason';reason.required=true;reason.placeholder=t('Motif factuel de la décision','Factual reason for decision');
          const evidence=document.createElement('input');evidence.name='evidenceRef';evidence.placeholder=t('Preuve de décision','Decision evidence');
          const b=el('button',t('Enregistrer la décision','Record decision'),'primary');b.type='submit';
          const wrap=(label,node)=>{const l=el('label',label);l.append(node);return l;};decision.append(wrap(t('Action','Action'),a),wrap(t('Constat','Finding'),finding),wrap(t('Motif','Reason'),reason),wrap(t('Preuve','Evidence'),evidence),b);
          decision.onsubmit=e=>void(async()=>{e.preventDefault();try{b.disabled=true;const d=Object.fromEntries(new FormData(decision).entries());await app.decideSafetyCase(c.id,d);notify(t('Décision de revue enregistrée sans verdict légal automatique.','Review decision recorded without automatic legal verdict.'));await renderSafetyCases();}catch(err){showError(err);}finally{b.disabled=false;}})();card.append(decision);
        }
        if(state==='ACTIONED'){
          const appeal=el('button',t('Déposer un recours','Appeal'),'link-btn');appeal.type='button';appeal.onclick=()=>void(async()=>{const reason=window.prompt(t('Motif du recours :','Appeal reason:'))?.trim();if(!reason)return;try{await app.appealSafetyCase(c.id,{reason});notify(t('Recours enregistré.','Appeal recorded.'));await renderSafetyCases();}catch(err){showError(err);}})();actions.append(appeal);
        }
        if(state==='APPEALED')transition(t('Réexaminer','Re-investigate'),'INVESTIGATING');
        const evidence=el('button',t('Ajouter une preuve','Add evidence'),'link-btn');evidence.type='button';evidence.onclick=()=>void(async()=>{const ref=window.prompt(t('Référence de la preuve :','Evidence reference:'))?.trim();if(!ref)return;const summary=window.prompt(t('Décrivez brièvement la preuve :','Briefly describe the evidence:'))?.trim();if(!summary)return;try{await app.addSafetyEvidence(c.id,{ref,summary,source:'SAFETY_CENTER'});notify(t('Preuve ajoutée séparément au dossier.','Evidence added separately to the case.'));}catch(err){showError(err);}})();actions.append(evidence);
        card.append(actions);safetyList.append(card);
      }
    }catch(err){
      safetyList.append(el('p',t('Les dossiers détaillés sont réservés aux responsables habilités. Vous pouvez néanmoins transmettre un signalement ci-dessus.','Detailed cases are restricted to authorized managers. You can still submit a report above.'),'hint'));
    }
  };

  safetyForm?.addEventListener('submit',event=>void(async()=>{
    event.preventDefault();try{
      const subjectType=v('safetySubjectType'),subjectRef=v('safetySubjectRef'),category=v('safetyCategory'),summary=v('safetySummary'),evidenceRef=v('safetyEvidenceRef');
      await app.reportSafety({groupId:app.activeGroup()||undefined,subjectType,subjectRef,category,summary,evidenceRef:evidenceRef||undefined,source:'SAFETY_CENTER'});
      notify(t('Signalement privé créé comme soupçon non vérifié.','Private report created as an unverified suspicion.'));safetyForm.reset();await renderSafetyCases();
    }catch(err){showError(err);}
  })());
  byId('safetyCasesRefreshBtn')?.addEventListener('click',()=>void renderSafetyCases());
  return{refresh:async()=>{await refreshHistory();await renderSafetyCases();}};
}
