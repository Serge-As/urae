const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const num=id=>{const v=value(id);return v===''?undefined:Number(v);};

export function mountMiscRubricUI({app,notify=()=>{},showError=console.error,getMembers=()=>[],getMeetings=()=>[],isManager=()=>false,fmt=n=>String(n)}){
  const memberSelect=document.getElementById('miscRubricMember');
  const meetingSelect=document.getElementById('miscRubricMeeting');
  const choices=document.getElementById('miscRubricChoices');
  const postings=document.getElementById('miscRubricPostingList');
  if(!memberSelect||!meetingSelect||!choices||!postings)return{refresh:async()=>{}};

  const selectedItems=()=>[...choices.querySelectorAll('[data-misc-row]')].flatMap(row=>{
    const check=row.querySelector('input[type="checkbox"]');if(!check?.checked)return[];
    const amount=Number(row.querySelector('input[type="number"]')?.value??0);
    const note=String(row.querySelector('input[type="text"]')?.value??'').trim();
    return[{templateId:row.dataset.templateId,amount,note:note||undefined}];
  });

  const renderSelectors=()=>{
    const currentMember=memberSelect.value,currentMeeting=meetingSelect.value;
    memberSelect.replaceChildren();meetingSelect.replaceChildren(new Option('Sans séance',''));
    for(const m of getMembers())memberSelect.append(new Option(m.displayName,m.id));
    for(const m of getMeetings().slice().sort((a,b)=>b.openedAt.localeCompare(a.openedAt)))meetingSelect.append(new Option(m.title+' · '+m.status,m.id));
    if([...memberSelect.options].some(o=>o.value===currentMember))memberSelect.value=currentMember;
    if([...meetingSelect.options].some(o=>o.value===currentMeeting))meetingSelect.value=currentMeeting;
  };

  const renderChoices=async()=>{
    choices.replaceChildren();
    if(!app.activeGroup())return;
    const templates=await app.miscRubrics(meetingSelect.value||undefined);
    if(!templates.length){choices.append(el('p','Aucune petite rubrique disponible pour cette séance.','hint'));return;}
    for(const t of templates){
      const row=el('label',undefined,'item');row.dataset.miscRow='1';row.dataset.templateId=t.id;
      const check=document.createElement('input');check.type='checkbox';
      const title=el('strong',t.name);
      const meta=el('span',(t.kind==='REGISTRATION'?'Temporaire · ':t.kind==='LOAN_STAMP'?'Prêt · ':t.kind==='FINE'?'Événement · ':'')+(t.lifecycle==='EPHEMERAL'?'éphémère':'disponible'),'hint');
      const amount=document.createElement('input');amount.type='number';amount.min='1';amount.step='1';amount.placeholder='Montant';if(t.defaultAmount)amount.value=String(t.defaultAmount);
      const note=document.createElement('input');note.type='text';note.placeholder='Note facultative';note.maxLength=500;
      row.append(check,title,meta,amount,note);choices.append(row);
    }
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
  memberSelect.addEventListener('change',()=>void renderPostings().catch(showError));

  document.getElementById('miscRubricPostingForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    const items=selectedItems();if(!items.length)throw Error('Sélectionnez au moins une petite rubrique.');
    if(items.some(x=>!Number.isSafeInteger(x.amount)||x.amount<=0))throw Error('Chaque petite rubrique sélectionnée doit avoir un montant positif.');
    if(!memberSelect.value)throw Error('Sélectionnez un membre.');
    const result=await app.postMiscRubrics({membershipId:memberSelect.value,meetingId:meetingSelect.value||undefined,items});
    notify((result.results?.length??items.length)+' élément(s) « Autres » enregistré(s).');await renderChoices();await renderPostings();
  }catch(err){showError(err);}})();});

  document.getElementById('miscRubricCustomForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    const lifecycle=value('miscRubricCustomLifecycle'),sessions=num('miscRubricCustomSessions');
    await app.createMiscRubric({name:value('miscRubricCustomName'),description:value('miscRubricCustomDescription')||undefined,lifecycle,amountMode:'VARIABLE',defaultAmount:num('miscRubricCustomAmount'),activeFirstSessions:lifecycle==='EPHEMERAL'?(sessions||3):undefined});
    document.getElementById('miscRubricCustomName').value='';document.getElementById('miscRubricCustomDescription').value='';notify('Petite rubrique ajoutée sous « Autres ».');await renderChoices();
  }catch(err){showError(err);}})();});

  const refresh=async()=>{
    const active=Boolean(app.activeGroup());document.getElementById('miscRubricPostingForm').hidden=active&&!isManager();document.getElementById('miscRubricConfig').hidden=active&&!isManager();
    if(!active){choices.replaceChildren();postings.replaceChildren();return;}
    renderSelectors();
    if(isManager())await app.ensureMiscRubricStarters();
    await renderChoices();await renderPostings();
  };
  return{refresh};
}
