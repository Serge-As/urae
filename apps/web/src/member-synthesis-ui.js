const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
/** A scoped projection of existing cells. Drafts belonging to colleagues are never read. */
export function openMemberSynthesis({app,selection,changed,memberName,summary,waitForEntries,tx,notify}){
  return new Promise(resolve=>{
    const scope=JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]),previous=document.activeElement,dialog=el('dialog',undefined,'eco-work-dialog eco-member-synthesis');
    const title=el('h2');title.id='eco-member-synthesis-title';dialog.setAttribute('aria-labelledby',title.id);title.append(document.createTextNode(tx('Synthèse du membre « ','Review member “')),el('span',memberName,'member-name'),document.createTextNode(tx(' » avant de continuer','” before continuing')));
    const status=el('p',tx('Copie locale · vérification des dernières saisies en cours…','Local copy · checking the latest entries…'),'eco-summary-status');status.setAttribute('role','status');
    const content=el('div'),controls=el('div',undefined,'eco-work-actions'),confirm=el('button',tx('Valider la synthèse et continuer','Confirm summary and continue'),'primary'),back=el('button',tx('Revenir à la saisie','Return to entry'),'secondary'),retry=el('button',tx('Actualiser la synthèse','Refresh summary'),'secondary');
    confirm.disabled=true;back.dataset.return='1';for(const b of [confirm,back,retry])b.type='button';
    const provenance=el('p',tx('Flux enregistrés pour ce membre et cette séance. Les totaux additionnent les flux affichés ; ils ne sont ni une caisse ni une dette. Les brouillons privés des collègues restent privés.','Recorded flows for this member and meeting. Totals sum displayed flows; they are neither cash nor debt. Colleagues’ private drafts stay private.'),'hint');
    controls.append(confirm,back,retry);dialog.append(title,status,provenance,content,controls);document.body.append(dialog);dialog.showModal();
    let data=null,closed=false,revision=0,timer=null,committing=false;
    const valid=()=>!closed&&scope===JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);
    const cleanup=()=>{closed=true;clearTimeout(timer);for(const event of ['eco:financial-data-changed','eco:live-signal'])window.removeEventListener(event,onChange);window.removeEventListener('eco:context-changed',onScope);dialog.close();dialog.remove();previous?.isConnected&&previous.focus?.();};
    const finish=value=>{cleanup();resolve(value);};
    const render=value=>{
      if(!valid())return;data=value;const table=el('table',undefined,'eco-work-summary'),thead=el('thead'),head=el('tr'),tbody=el('tbody'),wrap=el('div',undefined,'eco-work-summary-wrap');
      for(const label of [tx('Rubrique','Category'),tx('Avant la séance','Before meeting'),tx('Séance actuelle','Current meeting'),tx('Total des flux','Total flows'),tx('Auteur et contrôle','Author and review'),tx('Action','Action')]){const th=el('th',label);th.scope='col';head.append(th);}thead.append(head);table.append(thead);
      const money=n=>new Intl.NumberFormat(document.documentElement.lang==='en'?'en-CM':'fr-CM').format(n)+' F CFA';
      for(const row of value.lines){const tr=el('tr');tr.dataset.rubricId=row.rubricId;const name=el('th'),link=el('a',row.rubricName,'eco-context-link');link.href='#detail=rubric:'+encodeURIComponent(row.rubricId);link.onclick=e=>{e.preventDefault();finish({detail:{type:'rubric',id:row.rubricId}});};name.scope='row';name.append(link);tr.append(name);for(const key of ['before','current','total'])tr.append(el('td',money(row[key])));
        const author=el('td',row.authorName||row.authorId||tx('Copie locale','Local copy'));author.append(el('small',tx('Version ','Version ')+row.cellVersion+(row.updatedAt?' · '+new Date(row.updatedAt).toLocaleString():'')),el('small',row.reviewDecision==='RESERVE'?tx('Réserve conservée · examen individuel requis','Reserve retained · individual review required'):row.authorId===app.currentActor()?tx('Votre saisie · aucune auto-approbation indépendante','Your entry · no independent self-approval'):row.reviewDecision==='APPROVE'?tx('Version déjà contrôlée','Version already reviewed'):tx('À contrôler avec cette synthèse','To review with this summary')));tr.append(author);
        const action=el('td'),edit=el('button',tx('Modifier','Change'),'secondary');edit.type='button';edit.onclick=()=>finish({modified:row.rubricId});action.append(edit);tr.append(action);tbody.append(tr);
      }
      const total=el('tr',undefined,'table-total-row');total.append(el('th',tx('Total des flux affichés','Total displayed flows')));for(const key of ['before','current','total'])total.append(el('td',money(value.totals[key])));total.append(el('td',''),el('td',''));tbody.append(total);table.append(tbody);wrap.append(table);content.replaceChildren(wrap);
    };
    const refresh=async()=>{
      const at=++revision;confirm.disabled=true;retry.disabled=true;
      try{
        const local=await summary(selection.meetingId,selection.membershipId,changed,{local:true});if(!valid()||at!==revision)return;render(local);
        await waitForEntries(selection.meetingId,selection.membershipId);if(!valid()||at!==revision)return;
        const latest=navigator.onLine===false?local:await summary(selection.meetingId,selection.membershipId,changed,{collective:true});if(!valid()||at!==revision)return;render(latest);
        status.textContent=(latest.local?tx('Copie locale datée sur cet appareil · contrôle en attente de synchronisation','Dated local copy on this device · review awaiting synchronization'):tx('Données confirmées · saisies des gestionnaires réunies','Confirmed data · managers’ entries combined'))+' · '+new Date(latest.generatedAt??Date.now()).toLocaleTimeString();confirm.disabled=false;
      }catch(error){if(valid()&&at===revision){status.textContent=tx('Actualisation indisponible. Les saisies sont conservées. Réessayez ou revenez à la feuille.','Refresh unavailable. Entries are preserved. Retry or return to the sheet.');notify(String(error.message));}}
      finally{if(valid()&&at===revision)retry.disabled=false;}
    };
    const onChange=event=>{if(committing)return;if(event.type==='eco:live-signal'&&(event.detail?.type!=='MEETING_UPDATE'||event.detail?.payload?.kind!=='FINANCIAL_CELL'))return;const d=event.detail?.payload??event.detail??{};if(d.membershipId&&d.membershipId!==selection.membershipId||d.meetingId&&d.meetingId!==selection.meetingId)return;confirm.disabled=true;status.textContent=tx('Une saisie a changé · nouvelle vérification…','An entry changed · checking again…');clearTimeout(timer);timer=setTimeout(()=>void refresh(),250);};
    const onScope=()=>{if(!valid())finish({cancelled:true});};
    for(const event of ['eco:financial-data-changed','eco:live-signal'])window.addEventListener(event,onChange);window.addEventListener('eco:context-changed',onScope);
    back.onclick=()=>finish({cancelled:true});retry.onclick=()=>void refresh();dialog.addEventListener('cancel',e=>{e.preventDefault();finish({cancelled:true});});
    confirm.onclick=async()=>{
      if(!valid()||!data||confirm.disabled)return;committing=true;confirm.disabled=true;back.disabled=true;retry.disabled=true;
      try{const result=await app.closeFinancialPassage(selection.meetingId,selection.membershipId,data.lines.map(x=>({rubricId:x.rubricId,amount:Math.abs(x.current),cellVersion:x.cellVersion})),!data.local);if(!valid())return;notify(result?.queued?tx('Contrôle enregistré sur cet appareil · approbation serveur en attente.','Review saved on this device · server approval pending.'):tx('Synthèse contrôlée. Les réserves existantes restent ouvertes.','Summary reviewed. Existing reserves remain open.'));finish({approved:true});}
      catch(error){if(valid()){status.textContent=tx('La version a changé ou le contrôle a échoué. Actualisez avant de valider. Les contrôles déjà reçus sont conservés.','The version changed or review failed. Refresh before confirming. Previously received reviews are preserved.');notify(String(error.message));retry.disabled=false;back.disabled=false;}}
      finally{committing=false;}
    };
    void refresh();
  });
}
