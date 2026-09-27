const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const money=n=>Number(n??0).toLocaleString('fr-FR')+' XAF';
const opt=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};

export function mountCreatorTalentUI({app,notify=()=>{},showError=()=>{}}={}){
  const anchor=document.getElementById('guidanceHub')?.closest('section');if(!anchor||document.getElementById('creatorTalentCenter'))return{refresh:async()=>{},open:()=>{}};
  const root=el('details',undefined,'panel');root.id='creatorTalentCenter';root.append(el('summary','Talent · Creator & Seller Studio'));
  root.append(el('p','Cycle canonique : Learn → Prove → Work → Earn et contenu → intérêt → conversation → action → transaction. Eco-System ne promet jamais de revenu : « Earn » n’est validé que par un paiement ou revenu réellement enregistré dans le Business Studio. Creator n’a aucune caisse propre.','truth-notice'));
  const stage=el('div',undefined,'metrics small'),grid=el('div',undefined,'two-col'),talentBox=el('section'),creatorBox=el('section'),discoverBox=el('section'),interestBox=el('section');talentBox.className=creatorBox.className=discoverBox.className=interestBox.className='item';grid.append(talentBox,creatorBox);root.append(stage,grid,discoverBox,interestBox);anchor.insertAdjacentElement('afterend',root);

  const metric=(label,complete,note='')=>{const c=el('article',undefined,'metric');c.append(el('span',label),el('strong',complete?'✓':'…'));if(note)c.append(el('small',note));stage.append(c);};
  const refresh=async()=>{
    stage.replaceChildren();talentBox.replaceChildren();creatorBox.replaceChildren();discoverBox.replaceChildren();interestBox.replaceChildren();
    try{
      const groupId=app.activeGroup(),[talent,studio,business,hubs,published]=await Promise.all([
        app.talentProfile(),app.creatorStudio(),app.businessRecords(),groupId?app.listCommunityHubs().catch(()=>[]):Promise.resolve([]),groupId?app.discoverCreatorContent().catch(()=>[]):Promise.resolve([])
      ]);
      metric('Learn',Boolean(talent.learn?.complete),(talent.learn?.certificates?.length??0)+' attestation(s)');
      metric('Prove',Boolean(talent.prove?.complete),(talent.prove?.evidence?.length??0)+' preuve(s)');
      metric('Work',Boolean(talent.work?.complete),(talent.work?.deliveredOrders?.length??0)+' commande(s) livrée(s)');
      metric('Earn',Boolean(talent.earn?.complete),(talent.earn?.confirmedBusinessReceipts?.length??0)+' recette(s) confirmée(s)');

      talentBox.append(el('h3','Talent · preuves vérifiables'));
      const tf=document.createElement('form');tf.className='form-grid';
      const kindL=el('label','Type de preuve'),kind=document.createElement('select');[['PRACTICE','Pratique'],['PORTFOLIO','Portfolio'],['COMPLETED_ORDER','Commande accomplie'],['EVALUATION','Évaluation']].forEach(x=>kind.append(opt(x[0],x[1])));kindL.append(kind);
      const titleL=el('label','Titre'),title=document.createElement('input');title.required=true;titleL.append(title);
      const refL=el('label','Preuve / référence'),ref=document.createElement('input');ref.required=true;ref.placeholder='Document, lien, dossier, preuve…';refL.append(ref);
      const orderL=el('label','Commande Business livrée'),order=document.createElement('select');order.append(opt('','—'));for(const x of business.filter(x=>x.data?.businessKind==='ORDER'&&x.data?.orderState==='DELIVERED'))order.append(opt(x.id,x.title));orderL.append(order);
      const ratingL=el('label','Évaluation / 5'),rating=document.createElement('input');rating.type='number';rating.min='1';rating.max='5';rating.step='1';ratingL.append(rating);
      const save=el('button','Ajouter la preuve','primary');save.type='submit';tf.append(kindL,titleL,refL,orderL,ratingL,save);talentBox.append(tf);
      const evidence=el('div',undefined,'stack');talentBox.append(evidence);
      for(const x of talent.prove?.evidence??[]){const c=el('article',undefined,'item');c.append(el('strong',x.title),el('span',String(x.data?.evidenceKind??''),'pill'),el('small','Preuve : '+String(x.data?.evidenceRef??'—')+(x.data?.verifiedByCanonicalOwner?' · vérifiée par owner canonique':'')));evidence.append(c);}
      tf.onsubmit=e=>void(async()=>{e.preventDefault();try{await app.addTalentEvidence({kind:kind.value,title:title.value,evidenceRef:ref.value,businessOrderId:order.value||undefined,rating:rating.value?Number(rating.value):undefined});tf.reset();notify('Preuve Talent enregistrée. Aucun revenu ni rôle n’est créé automatiquement.');await refresh();}catch(err){showError(err);}})();

      creatorBox.append(el('h3','Creator & Seller Studio'));
      const cf=document.createElement('form');cf.className='form-grid';
      const ctL=el('label','Contenu / titre'),ct=document.createElement('input');ct.required=true;ctL.append(ct);
      const cbL=el('label','Message'),cb=document.createElement('textarea');cb.rows=3;cb.required=true;cbL.className='full';cbL.append(cb);
      const offerL=el('label','Offre Business liée'),offer=document.createElement('select');offer.append(opt('','Sans offre'));for(const x of business.filter(x=>x.data?.businessKind==='OFFER'&&x.data?.offerState==='ACTIVE'))offer.append(opt(x.id,x.title+' · '+money(x.data?.unitPrice)));offerL.append(offer);
      const hubL=el('label','Publier dans un Hub'),hub=document.createElement('select');hub.append(opt('','Garder en brouillon'));for(const h of hubs)hub.append(opt(h.id,h.title));hubL.append(hub);
      const create=el('button','Créer','primary');create.type='submit';cf.append(ctL,cbL,offerL,hubL,create);creatorBox.append(cf);
      cf.onsubmit=e=>void(async()=>{e.preventDefault();try{await app.createCreatorContent({title:ct.value,body:cb.value,offerId:offer.value||undefined,groupId:hub.value&&groupId?groupId:undefined,hubId:hub.value||undefined});cf.reset();notify(hub.value?'Contenu publié dans le Hub existant.':'Brouillon Creator créé.');await refresh();}catch(err){showError(err);}})();

      const own=el('div',undefined,'stack');creatorBox.append(el('h4','Mes contenus'),own);
      for(const x of studio.content??[]){const c=el('article',undefined,'item');c.append(el('strong',x.title),el('span',String(x.data?.contentState??'DRAFT'),'pill'),el('p',x.summary??''),el('small',(x.data?.interestCount??0)+' intérêt(s) · '+(x.data?.conversationCount??0)+' conversation(s) · '+(x.data?.actionCount??0)+' action(s)'));if(x.data?.contentState!=='PUBLISHED'&&groupId&&hubs.length){const b=el('button','Publier dans un Hub','secondary');b.type='button';b.onclick=()=>void(async()=>{const hubId=prompt('ID du Hub :',hubs[0]?.id??'')?.trim();if(!hubId)return;try{await app.publishCreatorContent(x.id,{groupId,hubId});notify('Contenu publié.');await refresh();}catch(err){showError(err);}})();c.append(b);}own.append(c);}

      discoverBox.append(el('h3','Découvrir des contenus Creator du groupe'));
      if(!groupId)discoverBox.append(el('p','Sélectionnez un groupe pour voir les contenus publiés dans ses Hubs.','hint'));
      else if(!published.length)discoverBox.append(el('p','Aucun contenu Creator publié dans ce groupe.','empty-state'));
      for(const x of published){const c=el('article',undefined,'item');c.append(el('strong',x.title),el('p',x.summary??''),el('small',(x.data?.interestCount??0)+' intérêt(s)'));if(x.createdBy!==app.currentActor()){const b=el('button','Je suis intéressé','secondary');b.type='button';b.onclick=()=>void(async()=>{const note=prompt('Votre besoin ou question (facultatif) :','')??'';try{await app.recordCreatorInterest(x.id,note);notify('Intérêt transmis au créateur.');await refresh();}catch(err){showError(err);}})();c.append(b);}discoverBox.append(c);}

      interestBox.append(el('h3','Intérêts reçus → conversation → demande Business'));
      const received=(studio.interests??[]).filter(x=>String(x.data?.creatorActorId??'')===app.currentActor());
      if(!received.length)interestBox.append(el('p','Aucun intérêt reçu pour vos contenus.','empty-state'));
      for(const x of received){const content=(studio.content??[]).find(c=>c.id===x.data?.contentId),c=el('article',undefined,'item');c.append(el('strong',content?.title??x.title),el('span',String(x.data?.interestState??'OPEN'),'pill'),el('p',x.summary??'Intérêt exprimé','hint'));const acts=el('div',undefined,'actions');
        if(!x.data?.conversationRef&&groupId&&hubs.length){const b=el('button','Ouvrir une conversation','secondary');b.type='button';b.onclick=()=>void(async()=>{const body=prompt('Message de démarrage :','Bonjour, précisons votre besoin.')?.trim();if(!body)return;try{await app.startCreatorConversation(String(x.data.contentId),x.id,{groupId,hubId:hubs[0].id,body});notify('Conversation créée dans le Hub.');await refresh();}catch(err){showError(err);}})();acts.append(b);}
        if(!x.data?.actionRef){const b=el('button','Créer une demande Business','primary');b.type='button';b.onclick=()=>void(async()=>{const clientName=prompt('Nom / alias du contact :','Contact Creator')?.trim(),need=prompt('Besoin à traiter :',content?.summary??'')?.trim();if(!clientName||!need)return;const budgetRaw=prompt('Budget estimatif XAF (facultatif) :','');const estimatedBudget=budgetRaw?Number(budgetRaw):undefined;try{await app.creatorInterestToBusiness(String(x.data.contentId),x.id,{clientName,need,estimatedBudget});notify('Demande transférée au Business Studio canonique.');await refresh();}catch(err){showError(err);}})();acts.append(b);}if(acts.children.length)c.append(acts);interestBox.append(c);}
      if(talent.earn?.complete)interestBox.append(el('p','Earn confirmé uniquement par des paiements/revenus enregistrés dans le Business Studio : aucune promesse de revenu n’est déduite du profil Talent.','truth-notice'));
    }catch(err){showError(err);root.append(el('p','Creator/Talent indisponible : '+String(err?.message??err),'hint'));}
  };
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  document.addEventListener('eco:group-context-changed',()=>{if(root.open)void refresh();});
  return{refresh,open:()=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
