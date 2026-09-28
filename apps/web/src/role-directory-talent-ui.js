import { requestApproximateLocation, geoErrorMessage } from './geolocation.js';
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
  const host=document.querySelector('#view-discovery');if(!host||document.querySelector('#geoDirectoryCenter'))return{refresh:async()=>{},currentPublishGeoPatch:()=>({})};
  let lastSearchGeo=null,publishGeoPatch={};
  const root=el('section',undefined,'panel');root.id='geoDirectoryCenter';
  root.append(el('div','GPS consenti · localité manuelle conservée','eyebrow'),el('h2','Annuaire local — groupes et profils proches'),el('p','Le GPS n’est demandé qu’après votre action. Pour un partage public, Eco-System arrondit la position à une zone d’environ 1 km minimum ; la coordonnée précise de l’appareil n’est ni publiée ni enregistrée par ce parcours.','truth-notice'));
  const form=document.createElement('form');form.className='form-grid';
  form.innerHTML='<label>Localité (fallback)<input name="locality" placeholder="Yaoundé, Douala, quartier…"></label><label>Mot-clé<input name="q" placeholder="épargne, entraide, couture…"></label><label>Rayon GPS<select name="radiusKm"><option value="5">5 km</option><option value="10">10 km</option><option value="20" selected>20 km</option><option value="50">50 km</option><option value="100">100 km</option></select></label><div class="actions full"><button type="button" class="primary" data-geo-search>⌖ Utiliser ma position</button><button class="secondary">Chercher par localité</button></div><p class="hint full" data-geo-status>Le navigateur demandera votre autorisation uniquement si vous choisissez « Utiliser ma position ».</p>';
  const groups=el('div',undefined,'stack'),candidates=el('div',undefined,'stack'),grid=el('div',undefined,'two-col');const gbox=el('section'),cbox=el('section');gbox.append(el('h3','Groupes publics'),groups);cbox.append(el('h3','Profils consentants'),candidates);grid.append(gbox,cbox);root.append(form,grid);
  const discoverySearch=document.querySelector('#discoverySearchForm')?.closest('section.panel');discoverySearch?.insertAdjacentElement('afterend',root);
  const status=form.querySelector('[data-geo-status]');
  const renderGroups=xs=>{groups.replaceChildren();if(!xs.length){groups.append(el('p','Aucun groupe public correspondant dans cette zone.','empty-state'));return;}for(const x of xs){const l=x.listing??x,c=el('article',undefined,'item');const distance=x.distanceKm!==undefined?x.distanceKm+' km · ':'';c.append(el('strong',l.name??'Groupe'),el('p',distance+[l.locality,l.family].filter(Boolean).join(' · '),'hint'));if(x.reasonCodes?.length)c.append(el('small',x.reasonCodes.join(' · ')));const join=el('button','Demander à rejoindre','secondary');join.type='button';join.disabled=l.joinPolicy==='CLOSED'||l.joinPolicy==='INVITE_ONLY';join.onclick=()=>void app.requestToJoin(l.groupId,'Candidature envoyée depuis l’annuaire local').then(()=>notify('Candidature envoyée.')).catch(showError);c.append(join);groups.append(c);}};
  const renderCandidates=xs=>{candidates.replaceChildren();if(!xs.length){candidates.append(el('p','Aucun profil public consentant correspondant dans cette zone.','empty-state'));return;}for(const x of xs){const d=x.candidate??x,p=el('article',undefined,'item');const distance=x.distanceKm!==undefined?x.distanceKm+' km · ':'';p.append(el('strong',d.displayAlias??'Profil'),el('p',distance+[d.locality,...(d.skills??[])].filter(Boolean).join(' · '),'hint'));const invite=el('button','Inviter','secondary');invite.type='button';invite.onclick=()=>void app.inviteConsentingCandidate(d.id,{message:'Invitation depuis l’annuaire local Eco-System'}).then(()=>notify('Invitation envoyée.')).catch(showError);p.append(invite);candidates.append(p);}};
  const search=async({geo=null,locality='',q='',radiusKm=20}={})=>{
    groups.replaceChildren();candidates.replaceChildren();
    try{
      const gs=geo?await app.proximityGroupsByCoordinates(geo.latitude,geo.longitude,radiusKm,q):await app.proximityGroups(locality,q);renderGroups(gs);
      if(isManager()&&app.activeGroup()){const cs=await app.searchConsentingCandidates(geo?{q:q||undefined,latitude:geo.latitude,longitude:geo.longitude,radiusKm,tags:[]}:{q:q||undefined,locality,tags:[]}).catch(()=>[]);renderCandidates(cs);}
      else candidates.append(el('p','La recherche de profils consentants est disponible aux responsables d’un groupe actif.','hint'));
    }catch(err){showError(err);groups.append(el('p','Annuaire momentanément indisponible.','hint'));}
  };
  form.onsubmit=e=>void(async()=>{e.preventDefault();const fd=new FormData(form),locality=String(fd.get('locality')||'').trim(),q=String(fd.get('q')||'').trim();if(!locality){status.textContent='Saisissez une localité ou utilisez le bouton GPS.';return;}lastSearchGeo=null;status.textContent='Recherche par localité déclarée : aucune position GPS utilisée.';await search({locality,q,radiusKm:Number(fd.get('radiusKm')||20)});})();
  form.querySelector('[data-geo-search]').onclick=()=>void(async()=>{try{status.textContent='Demande de localisation en cours…';lastSearchGeo=await requestApproximateLocation();status.textContent='Zone GPS obtenue. La position précise a été réduite à une zone approximative avant utilisation.';const fd=new FormData(form);await search({geo:lastSearchGeo,q:String(fd.get('q')||'').trim(),radiusKm:Number(fd.get('radiusKm')||20)});}catch(err){lastSearchGeo=null;status.textContent=geoErrorMessage(err);}})();

  const publishForm=document.querySelector('#publishDiscoveryForm');
  if(publishForm&&!publishForm.querySelector('[data-publish-geo]')){
    const box=el('div',undefined,'full');box.dataset.publishGeo='1';box.className='full';
    const note=el('p','Aucune zone GPS publique. La localité texte continue de fonctionner.','hint'),actions=el('div',undefined,'actions');
    const capture=el('button','⌖ Ajouter une zone GPS approximative','secondary');capture.type='button';
    const clear=el('button','Retirer la zone GPS publique','link-btn');clear.type='button';
    capture.onclick=()=>void(async()=>{try{note.textContent='Demande de localisation…';const geo=await requestApproximateLocation();publishGeoPatch={approxLocation:geo,clearApproxLocation:false};note.textContent='Zone GPS approximative prête. Elle sera publiée seulement lorsque vous validerez « Publier / mettre à jour ».';notify('Zone GPS approximative prête à publier.');}catch(err){note.textContent=geoErrorMessage(err);}})();
    clear.onclick=()=>{publishGeoPatch={clearApproxLocation:true};note.textContent='La prochaine mise à jour retirera la zone GPS publique de ce groupe.';};
    actions.append(capture,clear);box.append(el('strong','Géolocalisation publique du groupe'),note,actions);publishForm.querySelector('button[type="submit"]')?.before(box);
  }
  return{refresh:async()=>{},currentPublishGeoPatch:()=>({...publishGeoPatch}),lastSearchGeo:()=>lastSearchGeo};
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
      let candidateGeo=profile?.approxLocation??null;
      const form=document.createElement('form');form.className='form-grid';form.innerHTML='<label>Nom public / alias<input name="displayAlias" required></label><label>Localité<input name="locality"></label><label class="full">Compétences<input name="skills" placeholder="gestion, couture, coiffure, achat…"></label><label class="full">Centres d’intérêt<input name="interests"></label><label class="full">Bio<textarea name="bio" rows="3"></textarea></label><label>Disponibilité<input name="availability"></label><label class="check"><input name="optIn" type="checkbox"><span>Rendre ce profil découvrable</span></label><div class="full"><strong>Zone GPS publique facultative</strong><p class="hint" data-candidate-geo-status>'+ (candidateGeo?'Une zone GPS approximative est partagée.':'Aucune position GPS partagée.') +'</p><div class="actions"><button type="button" class="secondary" data-candidate-geo-capture>⌖ Utiliser ma zone approximative</button><button type="button" class="link-btn" data-candidate-geo-clear>Ne pas partager le GPS</button></div></div><button class="primary">Enregistrer le profil</button>';
      for(const [k,v] of Object.entries({displayAlias:profile?.displayAlias??'',locality:profile?.locality??'',skills:(profile?.skills??[]).join(', '),interests:(profile?.interests??[]).join(', '),bio:profile?.bio??'',availability:profile?.availability??''})){const input=form.elements.namedItem(k);if(input)input.value=String(v);}const opt=form.elements.namedItem('optIn');if(opt)opt.checked=Boolean(profile?.optIn);
      const candidateGeoStatus=form.querySelector('[data-candidate-geo-status]');form.querySelector('[data-candidate-geo-capture]').onclick=()=>void(async()=>{try{candidateGeoStatus.textContent='Demande de localisation…';candidateGeo=await requestApproximateLocation();candidateGeoStatus.textContent='Zone approximative prête. Elle sera partagée seulement avec votre profil public opt-in.';}catch(err){candidateGeoStatus.textContent=geoErrorMessage(err);}})();form.querySelector('[data-candidate-geo-clear]').onclick=()=>{candidateGeo=null;candidateGeoStatus.textContent='Aucune position GPS ne sera partagée.';};
      form.onsubmit=e=>void(async()=>{e.preventDefault();const fd=new FormData(form);try{await app.saveCandidateProfile({displayAlias:String(fd.get('displayAlias')||''),locality:String(fd.get('locality')||''),approxLocation:candidateGeo??undefined,skills:split(fd.get('skills')),interests:split(fd.get('interests')),desiredGroupTags:[],bio:String(fd.get('bio')||''),availability:String(fd.get('availability')||''),optIn:fd.get('optIn')==='on'});notify('Profil enregistré. La découvrabilité et le partage GPS suivent vos choix explicites.');await render();}catch(err){showError(err);}})();profileBox.append(form);

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
