const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const num=id=>{const v=value(id);return v===''?undefined:Number(v);};
const integer=(v)=>Number.isSafeInteger(Number(v))?Number(v):undefined;

export function mountMiscRubricUI({app,notify=()=>{},showError=console.error,getMembers=()=>[],getMeetings=()=>[],isManager=()=>false,fmt=n=>String(n)}){
  const memberSelect=document.getElementById('miscRubricMember');
  const meetingSelect=document.getElementById('miscRubricMeeting');
  const choices=document.getElementById('miscRubricChoices');
  const postings=document.getElementById('miscRubricPostingList');
  if(!memberSelect||!meetingSelect||!choices||!postings)return{refresh:async()=>{}};
  let rubricDefinitions=[];

  const definitionFor=template=>rubricDefinitions.find(r=>r.id===template.rubricId);
  const registrationPolicy=template=>definitionFor(template)?.policies?.registration;
  const finePolicy=template=>definitionFor(template)?.policies?.fine;
  const chosenMember=()=>getMembers().find(m=>m.id===memberSelect.value);
  const returningMember=()=>Boolean(chosenMember()?.historicalJoinedAt);

  const resolveRegistrationAmount=(policy,status)=>{
    if(!policy)return undefined;
    if(policy.pricingModel==='FREE_ALL')return 0;
    if(policy.pricingModel==='SINGLE_AMOUNT')return Number(policy.defaultAmount?.amount??0);
    if(policy.pricingModel==='BY_MEMBER_STATUS'){
      if(status==='RETURNING'&&policy.freeReturningMembers)return 0;
      return Number((status==='RETURNING'?policy.returningMemberAmount:policy.newMemberAmount)?.amount??policy.defaultAmount?.amount??0);
    }
    return Number(policy.defaultAmount?.amount??0);
  };

  const selectedItems=()=>[...choices.querySelectorAll('[data-misc-row]')].flatMap(row=>{
    const check=row.querySelector('input[type="checkbox"]');if(!check?.checked)return[];
    const amount=Number(row.querySelector('[data-misc-amount]')?.value??0);
    const note=String(row.querySelector('[data-misc-note]')?.value??'').trim();
    return[{templateId:row.dataset.templateId,templateName:row.dataset.templateName,kind:row.dataset.kind,amount,note:note||undefined,free:amount===0}];
  });

  const renderSelectors=()=>{
    const currentMember=memberSelect.value,currentMeeting=meetingSelect.value;
    memberSelect.replaceChildren();meetingSelect.replaceChildren(new Option('Sans séance',''));
    for(const m of getMembers())memberSelect.append(new Option(m.displayName,m.id));
    for(const m of getMeetings().slice().sort((a,b)=>(b.scheduledAt??b.openedAt).localeCompare(a.scheduledAt??a.openedAt)))meetingSelect.append(new Option(m.title+' · '+m.status,m.id));
    if([...memberSelect.options].some(o=>o.value===currentMember))memberSelect.value=currentMember;
    if([...meetingSelect.options].some(o=>o.value===currentMeeting))meetingSelect.value=currentMeeting;
  };

  const makeAmountInput=(template,row)=>{
    const amount=document.createElement('input');amount.type='number';amount.min='0';amount.step='1';amount.dataset.miscAmount='1';amount.placeholder='Montant';
    if(template.defaultAmount!==undefined)amount.value=String(template.defaultAmount);
    if(template.kind==='REGISTRATION'){
      const policy=registrationPolicy(template),status=document.createElement('select');status.dataset.registrationStatus='1';
      status.append(new Option('Ancien / réinscrit','RETURNING'),new Option('Nouveau membre','NEW'));
      status.value=returningMember()?'RETURNING':'NEW';
      const sync=()=>{const n=resolveRegistrationAmount(policy,status.value);if(n!==undefined)amount.value=String(n);amount.readOnly=Boolean(policy&&policy.pricingModel!=='RULE_TABLE');};
      status.addEventListener('change',sync);row.append(status);sync();
    }
    if(template.kind==='FINE'){
      const rules=Array.isArray(finePolicy(template)?.rules)?finePolicy(template).rules:[];
      if(rules.length){
        const select=document.createElement('select');select.dataset.fineRule='1';select.append(new Option('Choisir le motif de l’amende',''));
        rules.forEach((r,i)=>select.append(new Option(`${r.label} — ${fmt(Number(r.amount??0))}`,String(i))));
        select.addEventListener('change',()=>{const r=rules[Number(select.value)];if(r)amount.value=String(Number(r.amount??0));});row.append(select);
      }
    }
    return amount;
  };

  const renderChoices=async()=>{
    choices.replaceChildren();
    if(!app.activeGroup())return;
    const templates=await app.miscRubrics(meetingSelect.value||undefined);
    if(!templates.length){choices.append(el('p','Aucune petite rubrique disponible pour cette séance.','hint'));return;}
    for(const t of templates){
      const row=el('label',undefined,'item');row.dataset.miscRow='1';row.dataset.templateId=t.id;row.dataset.templateName=t.name;row.dataset.kind=t.kind;
      const check=document.createElement('input');check.type='checkbox';
      const title=el('strong',t.name);
      const meta=el('span',(t.kind==='REGISTRATION'?'Inscription / réinscription · ':t.kind==='LOAN_STAMP'?'Prêt · ':t.kind==='FINE'?'Événement · ':'')+(t.lifecycle==='EPHEMERAL'?'éphémère':'disponible'),'hint');
      const amount=makeAmountInput(t,row);
      const note=document.createElement('input');note.type='text';note.dataset.miscNote='1';note.placeholder='Note facultative';note.maxLength=500;
      row.prepend(check,title,meta);row.append(amount,note);
      if(t.kind==='REGISTRATION'&&!registrationPolicy(t))row.append(el('small','Aucune politique ancien/nouveau n’est encore définie : configurez-la ci-dessous.','hint'));
      if(t.kind==='FINE'&&!(finePolicy(t)?.rules?.length))row.append(el('small','Aucune grille d’amendes n’est encore définie : configurez-la ci-dessous ou saisissez ponctuellement un montant.','hint'));
      choices.append(row);
    }
    if(isManager())choices.prepend(buildPolicyEditor(templates));
  };

  const policyRow=(label,amount)=>{const row=el('div',undefined,'fine-policy-row inline-grid');const name=document.createElement('input');name.placeholder='Ex. Retard < 30 min';name.value=label??'';name.dataset.fineLabel='1';const value=document.createElement('input');value.type='number';value.min='0';value.step='1';value.placeholder='Montant XAF';value.value=amount??'';value.dataset.fineAmount='1';const remove=el('button','Retirer','link-btn');remove.type='button';remove.onclick=()=>row.remove();row.append(name,value,remove);return row;};

  const buildPolicyEditor=templates=>{
    const box=document.createElement('details');box.className='panel-soft full';
    const summary=document.createElement('summary');summary.innerHTML='<strong>Configurer Inscription et grille d’Amendes</strong>';box.append(summary);
    const reg=templates.find(t=>t.kind==='REGISTRATION'),fine=templates.find(t=>t.kind==='FINE');
    const grid=el('div',undefined,'two-col');
    if(reg){
      const policy=registrationPolicy(reg)??{},section=el('section',undefined,'item');section.append(el('h3','Inscription / réinscription'));
      const form=el('form',undefined,'form-grid');form.dataset.registrationPolicyForm='1';form.dataset.rubricId=reg.rubricId;
      const modeLabel=el('label','Mode');const mode=document.createElement('select');mode.dataset.regMode='1';mode.append(new Option('Même montant pour tous','SINGLE_AMOUNT'),new Option('Ancien / nouveau','BY_MEMBER_STATUS'),new Option('Gratuit pour tous','FREE_ALL'),new Option('Table de règles / cas particuliers','RULE_TABLE'));mode.value=policy.pricingModel??'BY_MEMBER_STATUS';modeLabel.append(mode);
      const oldLabel=el('label','Anciens / réinscrits');const old=document.createElement('input');old.type='number';old.min='0';old.step='1';old.dataset.regReturning='1';old.value=String(policy.returningMemberAmount?.amount??500);oldLabel.append(old);
      const newLabel=el('label','Nouveaux');const fresh=document.createElement('input');fresh.type='number';fresh.min='0';fresh.step='1';fresh.dataset.regNew='1';fresh.value=String(policy.newMemberAmount?.amount??1000);newLabel.append(fresh);
      const defaultLabel=el('label','Montant unique');const def=document.createElement('input');def.type='number';def.min='0';def.step='1';def.dataset.regDefault='1';def.value=String(policy.defaultAmount?.amount??0);defaultLabel.append(def);
      const freeLabel=el('label',undefined,'check');const free=document.createElement('input');free.type='checkbox';free.dataset.regFreeReturning='1';free.checked=Boolean(policy.freeReturningMembers);freeLabel.append(free,document.createTextNode('Réinscription gratuite pour les anciens'));
      const seniorityLabel=el('label','Règle d’ancienneté');seniorityLabel.className='full';const seniority=document.createElement('input');seniority.dataset.regSeniority='1';seniority.value=policy.seniorityRule??'';seniority.placeholder='Ex. ancien = membre déjà inscrit à l’exercice précédent';seniorityLabel.append(seniority);
      const save=el('button','Enregistrer la politique Inscription','primary');save.type='submit';form.append(modeLabel,oldLabel,newLabel,defaultLabel,freeLabel,seniorityLabel,save);section.append(form);grid.append(section);
    }
    if(fine){
      const policy=finePolicy(fine)??{},section=el('section',undefined,'item');section.append(el('h3','Grille des amendes'));
      const form=el('form',undefined,'form-grid');form.dataset.finePolicyForm='1';form.dataset.rubricId=fine.rubricId;
      const rows=el('div',undefined,'stack full');rows.dataset.fineRows='1';
      const defaults=[['Retard de moins de 30 min',500],['Retard de 30 min ou plus',1000],['Absence non justifiée',2000]];
      const existing=Array.isArray(policy.rules)&&policy.rules.length?policy.rules:defaults.map(([label,amount])=>({label,amount}));existing.forEach(r=>rows.append(policyRow(r.label,String(r.amount??0))));
      const add=el('button','+ Ajouter un motif','secondary');add.type='button';add.onclick=()=>rows.append(policyRow('',0));
      const save=el('button','Enregistrer la grille','primary');save.type='submit';form.append(rows,add,save);section.append(form);grid.append(section);
    }
    box.append(grid);
    box.addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();const form=event.target;if(!(form instanceof HTMLFormElement))return;void savePolicyForm(form).catch(showError);});
    return box;
  };

  const savePolicyForm=async form=>{
    const rubricId=form.dataset.rubricId,rubric=rubricDefinitions.find(r=>r.id===rubricId);if(!rubric)throw Error('RUBRIC_NOT_FOUND');
    const policies=structuredClone(rubric.policies??{});
    if(form.dataset.registrationPolicyForm){
      const mode=form.querySelector('[data-reg-mode]').value,returning=Number(form.querySelector('[data-reg-returning]').value||0),fresh=Number(form.querySelector('[data-reg-new]').value||0),def=Number(form.querySelector('[data-reg-default]').value||0);
      for(const n of [returning,fresh,def])if(!Number.isSafeInteger(n)||n<0)throw Error('Les montants d’inscription doivent être des entiers positifs ou zéro.');
      policies.registration={pricingModel:mode,returningMemberAmount:{currency:'XAF',amount:returning},newMemberAmount:{currency:'XAF',amount:fresh},defaultAmount:{currency:'XAF',amount:def},seniorityRule:String(form.querySelector('[data-reg-seniority]').value??'').trim()||undefined,freeReturningMembers:form.querySelector('[data-reg-free-returning]').checked,reviewStatus:'VALIDATED'};
      await app.updateRubricPolicies(rubricId,policies);notify('Politique d’inscription enregistrée.');
    }else if(form.dataset.finePolicyForm){
      const rules=[...form.querySelectorAll('[data-fine-label]')].map((name,i)=>({label:String(name.value??'').trim(),amount:Number(form.querySelectorAll('[data-fine-amount]')[i]?.value??0)})).filter(r=>r.label);
      if(!rules.length)throw Error('Ajoutez au moins un motif d’amende.');for(const r of rules)if(!Number.isSafeInteger(r.amount)||r.amount<0)throw Error('Chaque tarif d’amende doit être un entier positif ou zéro.');
      policies.fine={rules,reviewStatus:'VALIDATED',definitionSource:'MANUAL'};
      await app.updateRubricPolicies(rubricId,policies);notify('Grille des amendes enregistrée.');
    }
    rubricDefinitions=await app.listRubrics();await renderChoices();
  };

  const renderPostings=async()=>{
    postings.replaceChildren();
    if(!app.activeGroup())return;
    const rows=await app.miscPostings({meetingId:meetingSelect.value||undefined,membershipId:memberSelect.value||undefined});
    if(!rows.length){postings.append(el('p','Aucun enregistrement « Autres » pour ce filtre.','hint'));return;}
    for(const r of rows.slice(0,30)){
      const card=el('article',undefined,'item');card.append(el('strong',r.title),el('p',fmt(Number(r.data?.amount??0))+' · '+String(r.data?.kind??''),'hint'));
      if(r.summary)card.append(el('p',r.summary));
      postings.append(card);
    }
  };

  meetingSelect.addEventListener('change',()=>void (async()=>{try{await renderChoices();await renderPostings();}catch(e){showError(e);}})());
  memberSelect.addEventListener('change',()=>void (async()=>{try{await renderChoices();await renderPostings();}catch(e){showError(e);}})());

  document.getElementById('miscRubricPostingForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    const items=selectedItems();if(!items.length)throw Error('Sélectionnez au moins une petite rubrique.');
    const invalid=items.find(x=>!Number.isSafeInteger(x.amount)||x.amount<0);if(invalid)throw Error(`${invalid.templateName} : indiquez un montant valide.`);
    if(!memberSelect.value)throw Error('Sélectionnez un membre.');
    const cashItems=items.filter(x=>x.amount>0),freeItems=items.filter(x=>x.amount===0);
    if(cashItems.length){const result=await app.postMiscRubrics({membershipId:memberSelect.value,meetingId:meetingSelect.value||undefined,items:cashItems.map(({templateId,amount,note})=>({templateId,amount,note}))});notify((result.results?.length??cashItems.length)+' élément(s) financiers « Autres » enregistré(s).');}
    if(freeItems.length)notify(freeItems.map(x=>x.templateName).join(', ')+' : gratuit — aucun mouvement de caisse n’est créé.');
    await renderChoices();await renderPostings();
  }catch(err){showError(err);}})();});

  document.getElementById('miscRubricCustomForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    const lifecycle=value('miscRubricCustomLifecycle'),sessions=num('miscRubricCustomSessions');
    await app.createMiscRubric({name:value('miscRubricCustomName'),description:value('miscRubricCustomDescription')||undefined,lifecycle,amountMode:'VARIABLE',defaultAmount:num('miscRubricCustomAmount'),activeFirstSessions:lifecycle==='EPHEMERAL'?(sessions||3):undefined});
    document.getElementById('miscRubricCustomName').value='';document.getElementById('miscRubricCustomDescription').value='';notify('Petite rubrique ajoutée sous « Autres ».');rubricDefinitions=await app.listRubrics();await renderChoices();
  }catch(err){showError(err);}})();});

  const refresh=async()=>{
    const active=Boolean(app.activeGroup());document.getElementById('miscRubricPostingForm').hidden=active&&!isManager();document.getElementById('miscRubricConfig').hidden=active&&!isManager();
    if(!active){choices.replaceChildren();postings.replaceChildren();return;}
    renderSelectors();
    if(isManager())await app.ensureMiscRubricStarters();
    rubricDefinitions=await app.listRubrics();
    await renderChoices();await renderPostings();
  };
  return{refresh};
}
