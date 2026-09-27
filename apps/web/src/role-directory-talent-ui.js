const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const split=v=>String(v??'').split(',').map(x=>x.trim()).filter(Boolean);
const money=n=>Number(n??0).toLocaleString('fr-FR')+' XAF';

export function mountRoleDashboardsUI({app,getGroups=()=>[],getMembers=()=>[],getMeetings=()=>[],isManager=()=>false,navigate=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-dashboard');if(!host||document.querySelector('#roleDashboardsCenter'))return{refresh:async()=>{}};
  const root=el('section',undefined,'panel');root.id='roleDashboardsCenter';root.append(el('div','Projection par rôle','eyebrow'),el('h2','Dashboard adapté à votre rôle'));
  const metrics=el('div',undefined,'metrics small'),actions=el('div',undefined,'actions'),notes=el('div',undefined,'stack');root.append(metrics,actions,notes);
  const cockpit=document.querySelector('#personalCockpitPanel');cockpit?.insertAdjacentElement('afterend',root);
  const button=(label,view,anchor)=>{const b=el('button',label,'secondary');b.type='button';b.onclick=()=>navigate(view,anchor?{anchor,force:true}:undefined);actions.append(b);};
  const refresh=async()=>{
    metrics.replaceChildren();actions.replaceChildren();notes.replaceChildren();
    const active=app.activeGroup(),groups=getGroups(),members=getMembers(),meetings=getMeetings(),manage=isManager(),me=members.find(m=>m.userId===app.currentActor());
    const inbox=await app.inboxItems().catch(()=>[]),open=meetings.filter(x=>x.status==='open').length;
    for(const [label,value] of [['Mes groupes',groups.length],['Séances ouvertes',open],['Actions à traiter',inbox.length],['Rôle',manage?'Responsable':me?.roles?.join(', ')||'Membre']]){const m=el('article',undefined,'metric');m.append(el('span',label),el('strong',value));metrics.append(m);}
    button('Accueil groupe','dashboard','groupHomePanel');button('Séances','sessions');button('Ma situation','recap');
    if(manage){button('Saisie & contrôle','operations','twoSheetWorkspace');button('Business Studio','ecosystem','businessStudioOperational');button('Control Center','control');}
    else button('Découvrir / rejoindre','discovery');
    if(!active)notes.append(el('p','Sélectionnez un groupe pour afficher les actions liées au groupe.','hint'));
    else if(manage)notes.append(el('p','Vue responsable : pilotage, rapprochement, alertes et activités. Les droits réels restent vérifiés par chaque service au moment de l’action.','truth-notice'));
    else notes.append(el('p','Vue membre : situation personnelle, séances et actions accessibles sans exposer les données administratives des autres membres.','truth-notice'));
  };
  document.addEventListener('eco:group-context-changed',()=>void refresh());void refresh();return{refresh};
}

export function mountGeoDirectoryUI({app,isManager=()=>false,notify=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-discovery');if(!host||document.querySelector('#geoDirectoryCenter'))return{refresh:async()=>{}};
  const root=el('section',undefined,'panel');root.id='geoDirectoryCenter';root.append(el('div','Localité déclarée · consentement','eyebrow'),el('h2','Annuaire local — socle par localité déclarée'),el('p','Ce socle recherche par ville/quartier déclaré. La géolocalisation GPS avec consentement n’est pas encore activée dans ce parcours ; aucune position précise n’est collectée ou publiée automatiquement.','truth-notice'));
  const form=document.createElement('form');form.className='form-grid';form.innerHTML='<label>Localité<input name="locality" required placeholder="Yaoundé, Douala, quartier…"></label><label>Mot-clé<input name="q" placeholder="épargne, entraide, couture…"></label><button class="primary">Chercher autour de cette localité</button>';
  const groups=el('div',undefined,'stack'),candidates=el('div',undefined,'stack'),grid=el('div',undefined,'two-col');const gbox=el('section'),cbox=el('section');gbox.append(el('h3','Groupes publics'),groups);cbox.append(el('h3','Profils consentants'),candidates);grid.append(gbox,cbox);root.append(form,grid);
  const discoverySearch=document.querySelector('#discoverySearchForm')?.closest('section.panel');discoverySearch?.insertAdjacentElement('afterend',root);
  form.onsubmit=e=>void(async()=>{e.preventDefault();groups.replaceChildren();candidates.replaceChildren();const fd=new FormData(form),locality=String(fd.get('locality')||'').trim(),q=String(fd.get('q')||'').trim();try{
    const gs=await app.proximityGroups(locality,q);if(!gs.length)groups.append(el('p','Aucun groupe public correspondant.','empty-state'));
    for(const x of gs){const c=el('article',undefined,'item');c.append(el('strong',x.name??x.groupName??'Groupe'),el('p',[x.locality,x.family].filter(Boolean).join(' · '),'hint'));if(x.reasons?.length)c.append(el('small',x.reasons.join(' · ')));const join=el('button','Demander à rejoindre','secondary');join.type='button';join.onclick=()=>void app.requestToJoin(x.groupId,'Candidature envoyée depuis l’annuaire local').then(()=>notify('Candidature envoyée.')).catch(showError);c.append(join);groups.append(c);}
    if(isManager()&&app.activeGroup()){const cs=await app.searchConsentingCandidates({q:q||undefined,locality,tags:[]}).catch(()=>[]);if(!cs.length)candidates.append(el('p','Aucun profil public consentant correspondant.','empty-state'));for(const x of cs){const p=el('article',undefined,'item');p.append(el('strong',x.candidate?.displayAlias??x.displayAlias??'Profil'),el('p',[x.candidate?.locality??x.locality,...(x.candidate?.skills??x.skills??[])].filter(Boolean).join(' · '),'hint'));const invite=el('button','Inviter','secondary');invite.type='button';invite.onclick=()=>void app.inviteConsentingCandidate(x.candidate?.id??x.id,{message:'Invitation depuis l’annuaire local Eco-System'}).then(()=>notify('Invitation envoyée.')).catch(showError);p.append(invite);candidates.append(p);}}
    else candidates.append(el('p','La recherche de profils consentants est disponible aux responsables d’un groupe actif.','hint'));
  }catch(err){showError(err);groups.append(el('p','Annuaire momentanément indisponible.','hint'));}})();
  return{refresh:async()=>{}};
}

export function mountProfessionalTalentUI({app,notify=()=>{},showError=()=>{}}={}){
  const anchor=document.getElementById('guidanceHub')?.closest('section');if(!anchor||document.querySelector('#professionalTalentCenter'))return{refresh:async()=>{}};
  const root=el('details',undefined,'panel');root.id='professionalTalentCenter';root.append(el('summary','Profil public · Creator Studio · Talent'));
  root.append(el('p','Un profil n’est public qu’avec votre opt-in. Une attestation Academy prouve un parcours mais n’accorde aucun rôle financier. Une offre Creator reste séparée de l’argent collectif.','truth-notice'));
  const grid=el('div',undefined,'two-col'),profileBox=el('section'),talentBox=el('section'),offerBox=el('section');profileBox.className=talentBox.className=offerBox.className='item';
  grid.append(profileBox,talentBox);root.append(grid,offerBox);anchor.insertAdjacentElement('afterend',root);

  const render=async()=>{
    profileBox.replaceChildren();talentBox.replaceChildren();offerBox.replaceChildren();
    try{
      const [profile,academy,records]=await Promise.all([app.candidateProfile().catch(()=>null),app.academy().catch(()=>({courses:[],myEnrollments:[],myCertificates:[]})),app.businessRecords().catch(()=>[])]);
      profileBox.append(el('h3','Profil public de découverte · opt-in'));
      const form=document.createElement('form');form.className='form-grid';form.innerHTML='<label>Nom public / alias<input name="displayAlias" required></label><label>Localité<input name="locality"></label><label class="full">Compétences<input name="skills" placeholder="gestion, couture, coiffure, achat…"></label><label class="full">Centres d’intérêt<input name="interests"></label><label class="full">Bio<textarea name="bio" rows="3"></textarea></label><label>Disponibilité<input name="availability"></label><label class="check"><input name="optIn" type="checkbox"><span>Rendre ce profil découvrable</span></label><button class="primary">Enregistrer le profil</button>';
      for(const [k,v] of Object.entries({displayAlias:profile?.displayAlias??'',locality:profile?.locality??'',skills:(profile?.skills??[]).join(', '),interests:(profile?.interests??[]).join(', '),bio:profile?.bio??'',availability:profile?.availability??''})){const input=form.elements.namedItem(k);if(input)input.value=String(v);}const opt=form.elements.namedItem('optIn');if(opt)opt.checked=Boolean(profile?.optIn);
      form.onsubmit=e=>void(async()=>{e.preventDefault();const fd=new FormData(form);try{await app.saveCandidateProfile({displayAlias:String(fd.get('displayAlias')||''),locality:String(fd.get('locality')||''),skills:split(fd.get('skills')),interests:split(fd.get('interests')),desiredGroupTags:[],bio:String(fd.get('bio')||''),availability:String(fd.get('availability')||''),optIn:fd.get('optIn')==='on'});notify('Profil enregistré. La découvrabilité suit votre choix opt-in.');await render();}catch(err){showError(err);}})();profileBox.append(form);

      talentBox.append(el('h3','Talent · apprendre → prouver → proposer'));
      if(!(academy.myCertificates?.length))talentBox.append(el('p','Aucune attestation Academy pour le moment.','hint'));
      for(const cert of academy.myCertificates??[]){const c=el('article',undefined,'item');c.append(el('strong',cert.title),el('span','Attestation','pill'),el('small','Preuve de parcours · aucun pouvoir administratif ou financier automatique'));talentBox.append(c);}
      if(academy.courses?.length){const p=el('p','Parcours disponibles : '+academy.courses.map(x=>x.title).slice(0,5).join(' · '),'hint');talentBox.append(p);}

      offerBox.append(el('h3','Creator & Seller Studio'));
      const create=document.createElement('form');create.className='form-grid';create.innerHTML='<label>Offre / service<input name="name" required></label><label>Catégorie<input name="category" required></label><label>Prix indicatif XAF<input name="unitPrice" type="number" min="0" step="1"></label><label class="full">Description<textarea name="description" rows="2"></textarea></label><button class="primary">Ajouter au catalogue privé</button>';
      create.onsubmit=e=>void(async()=>{e.preventDefault();const fd=new FormData(create);try{await app.createBusinessOffer({name:String(fd.get('name')||''),category:String(fd.get('category')||''),unitPrice:Number(fd.get('unitPrice')||0),currency:'XAF',description:String(fd.get('description')||''),active:true});create.reset();notify('Offre ajoutée au catalogue Business Studio.');await render();}catch(err){showError(err);}})();offerBox.append(create);
      const offers=records.filter(x=>x.data?.businessKind==='OFFER');if(!offers.length)offerBox.append(el('p','Aucune offre créée.','hint'));
      for(const o of offers.slice(0,30)){const c=el('article',undefined,'item');c.append(el('strong',o.title),el('span',String(o.data.offerState??'ACTIVE'),'pill'),el('p',(o.data.category??'')+' · '+money(o.data.unitPrice),'hint'));if(o.data.offerState==='ACTIVE'){const pause=el('button','Mettre en pause','link-btn');pause.type='button';pause.onclick=()=>void app.setBusinessOfferState(o.id,'PAUSED').then(render).catch(showError);c.append(pause);}else if(o.data.offerState==='PAUSED'){const active=el('button','Réactiver','secondary');active.type='button';active.onclick=()=>void app.setBusinessOfferState(o.id,'ACTIVE').then(render).catch(showError);c.append(active);}offerBox.append(c);}
    }catch(err){showError(err);}
  };
  root.addEventListener('toggle',()=>{if(root.open)void render();});
  return{refresh:render,open:()=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void render();}};
}
