const button=(text,className='secondary')=>{const b=document.createElement('button');b.type='button';b.className=className;b.textContent=text;return b;};
const line=(label,value)=>{const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=label+' : ';p.append(strong,document.createTextNode(String(value??'—')));return p;};
const fmt=(n,currency='XAF')=>currency==='XAF'?new Intl.NumberFormat('fr-CM',{maximumFractionDigits:0}).format(Number(n||0))+' F CFA':new Intl.NumberFormat('fr-CM').format(Number(n||0))+' '+currency;

export async function renderMemberFinancialNotices({app,membershipId,memberUserId,manager=false,notify=()=>{},showError=console.error}){
  const root=document.createElement('section');root.className='member-financial-control';
  const h=document.createElement('h3');h.textContent='Contrôle des modifications financières';root.append(h);
  const hint=document.createElement('p');hint.className='hint';hint.textContent='Valider signifie reconnaître que l’écriture correspond aux faits. Une réserve ouvre une vérification mais ne supprime ni ne bloque l’écriture comptable.';root.append(hint);
  const list=document.createElement('div');list.className='stack';root.append(list);
  const refresh=async()=>{
    list.replaceChildren();const [notices,members,meetings]=await Promise.all([app.financialNotices(membershipId),app.listMembers().catch(()=>[]),app.listMeetings().catch(()=>[])]);
    const actorName=id=>members.find(m=>m.userId===id)?.displayName??id;
    const meetingName=id=>{const m=meetings.find(x=>x.id===id);if(!m)return id??'—';try{return 'Réunion du '+new Intl.DateTimeFormat('fr-CM',{dateStyle:'long'}).format(new Date(m.scheduledAt??m.openedAt));}catch{return m.title??id;}};

    if(!notices.length){const p=document.createElement('p');p.className='hint';p.textContent='Aucune modification financière à vérifier pour ce membre.';list.append(p);return;}
    const self=memberUserId===app.currentActor();
    for(const n of notices){
      const a=document.createElement('article');a.className='item';
      const title=document.createElement('strong');title.textContent=n.operationType+' · '+fmt(n.amount,n.currency);a.append(title);
      const authorLabel=actorName(n.authorId),authorText=authorLabel+(authorLabel!==n.authorId?' · réf. '+n.authorId:'')+(n.authorRoles?.length?' · '+n.authorRoles.join(', '):'');
      a.append(line('Auteur',authorText));
      if(n.meetingId)a.append(line('Séance',meetingName(n.meetingId)));
      if(n.previousAmount!==undefined||n.newAmount!==undefined)a.append(line('Correction du montant',fmt(n.previousAmount??0,n.currency)+' → '+fmt(n.newAmount??n.amount??0,n.currency)));
      if(n.correctionReason)a.append(line('Motif',n.correctionReason));
      if(n.previousSituation!==undefined||n.newSituation!==undefined)a.append(line('Situation du membre avant / après cette action',fmt(n.previousSituation??0,n.currency)+' → '+fmt(n.newSituation??0,n.currency)));
      if(n.selfBenefit||n.requiresIndependentReview){const warn=document.createElement('p');warn.className='truth-notice error';warn.textContent='⚠ Auto-modification financière : l’auteur agit sur sa propre situation. Une revue par un autre responsable habilité est obligatoire avant validation.';a.append(warn);}
      const tech=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Références techniques';tech.append(summary,line('Écriture',n.ledgerEntryId));a.append(tech);
      a.append(line('État membre',n.memberState),line('Réserve / revue',n.disputeState));
      if(n.reserveReason)a.append(line('Motif de réserve',n.reserveReason));
      if(n.officerNote)a.append(line('Vérification responsable',n.officerNote));
      const actions=document.createElement('div');actions.className='actions';
      if(self&&n.memberState!=='MEMBER_CONFIRMED'&&!n.requiresIndependentReview){
        const confirm=button('Valider la transaction','primary');confirm.onclick=()=>void (async()=>{try{await app.confirmFinancialNotice(n.id);notify('Transaction reconnue par le membre.');await refresh();}catch(e){showError(e);}})();actions.append(confirm);
      }else if(self&&n.requiresIndependentReview){
        const waiting=document.createElement('span');waiting.className='hint';waiting.textContent='Validation personnelle bloquée : un autre responsable doit d’abord vérifier cette auto-modification.';actions.append(waiting);
      }
      if(self&&['NO_RESERVE','RESOLVED'].includes(n.disputeState)){
        const reserve=button('Émettre une réserve');reserve.onclick=()=>void (async()=>{const reason=window.prompt('Expliquez brièvement ce qui vous paraît incorrect ou à vérifier :','');if(!reason?.trim())return;try{await app.reserveFinancialNotice(n.id,reason.trim());notify('Réserve transmise aux responsables sans bloquer la comptabilité.');await refresh();}catch(e){showError(e);}})();actions.append(reserve);
      }
      if(manager&&['MEMBER_RESERVE','UNDER_REVIEW','MEMBER_RESERVE_MAINTAINED'].includes(n.disputeState)&&n.authorId!==app.currentActor()){
        const review=button(n.requiresIndependentReview?'Revue indépendante':'Valider après vérification','primary');review.onclick=()=>void (async()=>{const note=window.prompt('Conclusion de la vérification :',n.requiresIndependentReview?'Auto-modification vérifiée par un autre responsable habilité.':'Opération vérifiée par un responsable habilité.');if(note===null)return;try{await app.officerReviewFinancialNotice(n.id,note);notify('Vérification institutionnelle enregistrée.');await refresh();}catch(e){showError(e);}})();actions.append(review);
      }else if(manager&&n.requiresIndependentReview&&n.authorId===app.currentActor()){
        const blocked=document.createElement('span');blocked.className='hint';blocked.textContent='Vous êtes l’auteur : vous ne pouvez pas valider votre propre modification.';actions.append(blocked);
      }
      if(self&&n.disputeState==='OFFICER_CONFIRMED'){
        const approve=button('Approuver après vérification','primary');approve.onclick=()=>void (async()=>{try{await app.memberReviewFinancialNotice(n.id,'APPROVE_AFTER_REVIEW');notify('Réserve approuvée après vérification.');await refresh();}catch(e){showError(e);}})();
        const maintain=button('Maintenir ma réserve');maintain.onclick=()=>void (async()=>{const note=window.prompt('Pourquoi maintenez-vous la réserve ?','');if(note===null)return;try{await app.memberReviewFinancialNotice(n.id,'MAINTAIN_RESERVE',note);notify('Réserve maintenue ; le contentieux reste visible.');await refresh();}catch(e){showError(e);}})();
        actions.append(approve,maintain);
      }
      if(actions.childElementCount)a.append(actions);list.append(a);
    }
  };
  await refresh();return root;
}
