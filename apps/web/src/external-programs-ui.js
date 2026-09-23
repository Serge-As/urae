const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const split=v=>v.split(',').map(x=>x.trim()).filter(Boolean);
const field=(label,name,type='text',placeholder='')=>{const l=el('label',label),i=document.createElement('input');i.name=name;i.type=type;i.placeholder=placeholder;l.append(i);return l;};
const selectField=(label,name,options)=>{const l=el('label',label),s=document.createElement('select');s.name=name;for(const [v,t] of options)s.append(new Option(t,v));l.append(s);return l;};
const data=form=>Object.fromEntries(new FormData(form).entries());
const isoDate=v=>v?new Date(String(v)+'T12:00:00').toISOString():undefined;
const date=v=>{try{return new Date(v).toLocaleDateString('fr-FR')}catch{return String(v??'—')}};

export function mountExternalProgramsUI({app,notify=()=>{},showError=console.error,isManager=()=>false,fmt=n=>String(n)}){
  const form=document.getElementById('externalProgramForm'),root=document.getElementById('externalProgramList'),profileRoot=document.getElementById('economicProfilePreview');
  if(!form||!root||!profileRoot)return{refresh:async()=>{}};

  const renderProfile=async()=>{
    profileRoot.replaceChildren();if(!app.activeGroup()||!isManager())return;
    try{
      const p=await app.economicProfile(),card=el('article',undefined,'item');
      card.append(el('strong','Profil économique pseudonymisé · '+p.groupCode),el('p','Membres actifs : '+p.memberCount+' · Encaissements : '+fmt(p.collectedTotal)+' · Entrées caisse : '+fmt(p.cashIn)+' · Sorties caisse : '+fmt(p.cashOut)));
      const list=el('div',undefined,'stack');for(const r of p.rubricVolumes??[])list.append(el('p',r.rubricLabel+' : '+fmt(r.amount)+' · '+r.receiptCount+' opération(s)','hint'));
      if(!(p.rubricVolumes??[]).length)list.append(el('p','Aucune masse monétaire par rubrique disponible pour le moment.','hint'));
      card.append(list,el('p',p.exportable?'Ce profil peut être partagé sous forme agrégée avec un programme autorisé.':'Partage externe bloqué : '+(p.exportBlockers??[]).join(', '),'truth-notice'));profileRoot.append(card);
    }catch(e){profileRoot.append(el('p','Profil économique non disponible : '+String(e?.message??e),'hint'));}
  };

  const enrollmentForm=(program,onDone)=>{
    const d=document.createElement('details');d.className='program-subpanel';d.append(el('summary','Inscrire le groupe au programme · mandat borné'));
    const f=document.createElement('form');f.className='form-grid';
    const consent=field('Référence du consentement / PV','consentRef','text','PV, mandat signé…'),purpose=field('Finalité précise','purpose','text','Formation, accompagnement…'),scopes=field('Périmètres autorisés','scopes','text','TRAINING, PROGRAM_METRICS'),end=field('Fin du mandat','endsAt','date'),fac=field('Animateur / facilitateur','facilitatorRef','text','Référence publique ou interne');
    end.querySelector('input').required=true;consent.querySelector('input').required=true;purpose.querySelector('input').required=true;
    const help=el('p','Périmètres possibles : TRAINING, GROUP_AGGREGATES, DOCUMENT_REVIEW, PROGRAM_METRICS, SUPPORT_ACTIONS, CO_MANAGEMENT. Aucun de ces choix ne donne automatiquement accès aux finances individuelles ni un rôle financier.','truth-notice');
    const b=el('button','Valider le mandat d’accompagnement','primary');b.type='submit';f.append(consent,purpose,scopes,end,fac,b);d.append(help,f);
    f.onsubmit=e=>void(async()=>{e.preventDefault();try{b.disabled=true;const x=data(f);await app.createProgramEnrollment(program.id,{consentRef:x.consentRef,purpose:x.purpose,scopes:String(x.scopes||'').split(',').map(v=>v.trim().toUpperCase()).filter(Boolean),endsAt:isoDate(x.endsAt),facilitatorRef:x.facilitatorRef||undefined});notify('Mandat d’accompagnement enregistré sans attribution automatique de rôle financier.');await onDone();}catch(err){showError(err);}finally{b.disabled=false;}})();return d;
  };

  const supportForm=(enrollment,onDone)=>{
    const d=document.createElement('details');d.className='program-subpanel';d.append(el('summary','Ajouter une action d’accompagnement'));
    const f=document.createElement('form');f.className='form-grid',kind=selectField('Type','kind',[['TRAINING','Formation'],['COACHING','Coaching'],['EQUIPMENT','Matériel'],['GRANT','Subvention / appui'],['RESTRUCTURING','Restructuration'],['OTHER','Autre']]),summary=field('Action réalisée','summary','text','Ex. formation du trésorier'),evidence=field('Preuve / référence','evidenceRef','text','Présence, document, photo…'),b=el('button','Enregistrer l’action','secondary');b.type='submit';summary.querySelector('input').required=true;f.append(kind,summary,evidence,b);d.append(f);
    f.onsubmit=e=>void(async()=>{e.preventDefault();try{b.disabled=true;const x=data(f);await app.recordProgramSupportAction(enrollment.id,x);notify('Action d’accompagnement tracée.');f.reset();await onDone();}catch(err){showError(err);}finally{b.disabled=false;}})();return d;
  };

  const fundingForm=(enrollment,onDone)=>{
    const d=document.createElement('details');d.className='program-subpanel';d.append(el('summary','Financement · de la promesse à la preuve'));
    const f=document.createElement('form');f.className='form-grid',state=selectField('État','state',[['PROMISED','Promis'],['AGREED','Accordé'],['RECEIVED','Reçu'],['ALLOCATED','Affecté'],['JUSTIFIED','Justifié']]),amount=field('Montant XAF','amount','number','0'),evidence=field('Preuve','evidenceRef','text','Lettre, reçu, convention…'),ledger=field('Écriture Ledger si argent réellement reçu','ledgerEntryId','text','Requise à partir de Reçu'),note=field('Note','note','text','Restrictions d’usage, observation…'),b=el('button','Enregistrer l’état du financement','secondary');b.type='submit';evidence.querySelector('input').required=true;f.append(state,amount,evidence,ledger,note,b);d.append(el('p','Une promesse reste une promesse. À partir de « Reçu », Eco-System exige la référence de l’écriture du Ledger collectif : le programme ne fabrique jamais une nouvelle vérité financière.','truth-notice'),f);
    f.onsubmit=e=>void(async()=>{e.preventDefault();try{b.disabled=true;const x=data(f);await app.recordProgramFundingEvidence(enrollment.id,{...x,amount:Number(x.amount||0),currency:'XAF'});notify('État du financement enregistré avec sa preuve.');f.reset();await onDone();}catch(err){showError(err);}finally{b.disabled=false;}})();return d;
  };

  const handoverForm=(enrollment,onDone)=>{
    const d=document.createElement('details');d.className='program-subpanel';d.append(el('summary','Préparer le transfert vers les responsables locaux'));
    const f=document.createElement('form');f.className='form-grid',owner=field('Responsable local cible','localOwnerRef','text','Président(e), trésorier…'),auth=field('Autorisation / PV','authorizationRef','text','Nécessaire avant co-gestion'),note=field('Plan et conditions','note','text','Compétences à transférer…'),b=el('button','Créer le plan de transfert','secondary');b.type='submit';owner.querySelector('input').required=true;f.append(owner,auth,note,b);d.append(el('p','Le plan organise la transition. Il ne modifie aucun rôle Membership : toute habilitation reste décidée par la gouvernance canonique du groupe.','truth-notice'),f);
    f.onsubmit=e=>void(async()=>{e.preventDefault();try{b.disabled=true;await app.createProgramHandover(enrollment.id,data(f));notify('Plan de transfert créé.');await onDone();}catch(err){showError(err);}finally{b.disabled=false;}})();return d;
  };

  const renderEnrollment=async(enrollment,onDone)=>{
    const box=el('article',undefined,'item program-enrollment-card'),state=String(enrollment.data.state??'ENROLLED');
    box.append(el('strong','Mandat · '+String(enrollment.data.purpose??'')),el('span',state,'pill'),el('p','Périmètre : '+JSON.parse(String(enrollment.data.scopesJson??'[]')).join(', ')+' · fin '+date(enrollment.data.endsAt),'hint'),el('p','Accès financier individuel : NON · rôle financier automatique : NON','truth-notice'));
    if(state!=='ENROLLED')return box;
    const [actions,funding,handovers]=await Promise.all([app.programSupportActions(enrollment.id).catch(()=>[]),app.programFundingEvidence(enrollment.id).catch(()=>[]),app.programHandoverPlans(enrollment.id).catch(()=>[])]);
    if(actions.length){const list=el('details');list.append(el('summary','Actions réalisées · '+actions.length));for(const x of actions.slice(-10))list.append(el('p',String(x.data.kind)+' · '+String(x.data.summary),'hint'));box.append(list);}
    if(funding.length){const list=el('details');list.append(el('summary','Financements / preuves · '+funding.length));for(const x of funding.slice(-10))list.append(el('p',String(x.data.state)+' · '+fmt(Number(x.data.amount||0))+' · '+String(x.data.evidenceRef||''),'hint'));box.append(list);}
    box.append(supportForm(enrollment,onDone),fundingForm(enrollment,onDone));
    if(!handovers.length)box.append(handoverForm(enrollment,onDone));
    else{
      const h=handovers[handovers.length-1],stage=String(h.data.stage??'PREPARATION'),flow={PREPARATION:'OBSERVER',OBSERVER:'CO_MANAGEMENT',CO_MANAGEMENT:'LOCAL_MANAGEMENT',LOCAL_MANAGEMENT:'CLOSED'};const next=flow[stage];
      const panel=el('article',undefined,'item');panel.append(el('strong','Transfert · '+stage),el('p','Responsable local : '+String(h.data.localOwnerRef||'—'),'hint'));
      if(next){const b=el('button',next==='CLOSED'?'Clore l’accompagnement':'Passer à '+next,'secondary');b.type='button';b.onclick=()=>void(async()=>{try{let authorizationRef;if(next==='CO_MANAGEMENT')authorizationRef=String(h.data.authorizationRef||'');if(next==='CO_MANAGEMENT'&&!authorizationRef){notify('Ajoutez d’abord une autorisation/PV au plan avant la co-gestion.');return;}await app.transitionProgramHandover(h.id,next,{authorizationRef});notify('Étape de transfert mise à jour.');await onDone();}catch(err){showError(err);}})();panel.append(b);}box.append(panel);
    }
    const revoke=el('button','Révoquer ce mandat','link-btn');revoke.type='button';revoke.onclick=()=>void(async()=>{const reason=window.prompt('Motif de révocation :')?.trim();if(!reason)return;try{await app.revokeProgramEnrollment(enrollment.id,reason);notify('Mandat révoqué.');await onDone();}catch(err){showError(err);}})();box.append(revoke);return box;
  };

  const render=async()=>{
    root.replaceChildren();if(!app.activeGroup()){root.append(el('p','Sélectionnez un groupe.','hint'));return;}if(!isManager()){root.append(el('p','Les partenariats et programmes ONG sont réservés aux responsables habilités.','hint'));return;}
    const programs=await app.externalPrograms();if(!programs.length)root.append(el('p','Aucun partenariat ou programme ONG enregistré.','hint'));
    for(const p of programs){
      const card=el('article',undefined,'item');card.append(el('strong',p.partyName+' · '+p.programName),el('span',p.kind+' · '+p.state,'pill'),el('p',p.purpose),el('small',[...(p.localities??[]),...(p.tags??[])].join(' · ')));
      card.append(el('p','Accès données : '+(p.dataAccess==='GROUP_AGGREGATE_ECONOMIC'?'profil financier agrégé et pseudonymisé':'aucun partage financier'),'hint'));const actions=el('div',undefined,'actions');
      if(p.state==='DRAFT'){const b=el('button','Activer le programme','primary');b.type='button';b.onclick=()=>void app.transitionExternalProgram(p.id,'ACTIVE').then(()=>{notify('Programme activé.');return render();}).catch(showError);actions.append(b);}
      if(p.state==='ACTIVE'){
        const share=el('button','Créer un dossier agrégé 30 jours','secondary');share.type='button';share.onclick=()=>void app.issueExternalSharePack(p.id,p.purpose,30).then(pack=>{notify('Dossier agrégé créé pour '+pack.groupCode+'.');return render();}).catch(showError);actions.append(share);
        const pause=el('button','Mettre en pause','link-btn');pause.type='button';pause.onclick=()=>void app.transitionExternalProgram(p.id,'PAUSED').then(render).catch(showError);actions.append(pause);
      }else if(p.state==='PAUSED'){const b=el('button','Réactiver','secondary');b.type='button';b.onclick=()=>void app.transitionExternalProgram(p.id,'ACTIVE').then(render).catch(showError);actions.append(b);}
      card.append(actions);
      const packs=await app.externalSharePacks(p.id).catch(()=>[]);if(packs.length){const box=el('div',undefined,'stack');box.append(el('strong','Dossiers agrégés actifs'));for(const x of packs.slice(0,6)){const row=el('div',undefined,'item');row.append(el('span',x.groupCode+' · expire '+date(x.expiresAt),'hint'));const revoke=el('button','Révoquer','link-btn');revoke.type='button';revoke.onclick=()=>void app.revokeExternalSharePack(x.id).then(render).catch(showError);row.append(revoke);box.append(row);}card.append(box);}
      if(p.state==='ACTIVE'){
        const enrollments=await app.programEnrollments(p.id).catch(()=>[]);card.append(enrollmentForm(p,render));for(const en of enrollments.slice().reverse())card.append(await renderEnrollment(en,render));
      }
      root.append(card);
    }
    await renderProfile();
  };

  form.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{await app.createExternalProgram({kind:value('externalProgramKind'),partyName:value('externalPartyName'),programName:value('externalProgramName'),purpose:value('externalProgramPurpose'),localities:split(value('externalProgramLocalities')),tags:split(value('externalProgramTags')),dataAccess:value('externalProgramDataAccess')});notify('Programme créé en brouillon.');form.reset();document.getElementById('externalProgramDataAccess').value='NONE';await render();}catch(err){showError(err);}})();});
  document.addEventListener('eco:group-context-changed',()=>void render().catch(showError));return{refresh:render};
}
