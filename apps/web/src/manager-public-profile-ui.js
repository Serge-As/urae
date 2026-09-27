const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const split=v=>String(v??'').split(',').map(x=>x.trim()).filter(Boolean);

export function mountManagerPublicProfileUI({app,notify=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-discovery');if(!host||document.getElementById('managerPublicProfileCenter'))return{refresh:async()=>{},open:()=>{}};
  const root=el('details',undefined,'panel');root.id='managerPublicProfileCenter';root.append(el('summary','Profil public responsable / expert'));
  root.append(el('p','Projection publique uniquement avec votre consentement. Expertise et services sont déclarés ; groupes publics gérés et attestations Academy ne sont affichés que si vous choisissez de les partager. Aucun téléphone, email, solde, dette, CNI ou rôle privé n’est publié. Ce profil n’accorde jamais automatiquement un pouvoir de gestion.','truth-notice'));
  const grid=el('div',undefined,'two-col'),mine=el('section'),search=el('section');mine.className=search.className='item';grid.append(mine,search);root.append(grid);
  const anchor=document.getElementById('geoDirectoryCenter')??document.querySelector('#discoverySearchForm')?.closest('section.panel');anchor?.insertAdjacentElement('afterend',root);

  const renderMine=async()=>{
    mine.replaceChildren(el('h3','Mon profil public'));
    const p=await app.managerPublicProfile().catch(()=>null);
    const form=document.createElement('form');form.className='form-grid';
    form.innerHTML='<label>Alias public<input name="displayAlias" required maxlength="80"></label><label>Localité / zone<input name="locality" maxlength="120"></label><label class="full">Expertises déclarées<input name="expertise" placeholder="gestion, trésorerie, médiation…"></label><label class="full">Services proposés<input name="services" placeholder="accompagnement, formation, secrétariat…"></label><label class="full">Bio publique<textarea name="bio" rows="3" maxlength="700"></textarea></label><label>Disponibilité<input name="availability" maxlength="160"></label><label class="check"><input type="checkbox" name="sharePublicGroups"><span>Partager mes groupes publics gérés</span></label><label class="check"><input type="checkbox" name="shareAcademyCertificates"><span>Partager mes attestations Academy</span></label><label class="check"><input type="checkbox" name="optIn"><span>Rendre ce profil découvrable</span></label><button class="primary">Enregistrer</button>';
    const values={displayAlias:p?.displayAlias??'',locality:p?.locality??'',expertise:(p?.expertise??[]).join(', '),services:(p?.services??[]).join(', '),bio:p?.bio??'',availability:p?.availability??''};
    for(const [k,v] of Object.entries(values)){const i=form.elements.namedItem(k);if(i)i.value=String(v);}
    form.elements.namedItem('optIn').checked=Boolean(p?.optIn);
    form.elements.namedItem('sharePublicGroups').checked=Boolean(p?.managedPublicGroups?.length);
    form.elements.namedItem('shareAcademyCertificates').checked=Boolean(p?.academyCertificates?.length);
    form.onsubmit=e=>void(async()=>{e.preventDefault();const fd=new FormData(form);try{
      const saved=await app.saveManagerPublicProfile({displayAlias:String(fd.get('displayAlias')||''),locality:String(fd.get('locality')||''),expertise:split(fd.get('expertise')),services:split(fd.get('services')),bio:String(fd.get('bio')||''),availability:String(fd.get('availability')||''),sharePublicGroups:fd.get('sharePublicGroups')==='on',shareAcademyCertificates:fd.get('shareAcademyCertificates')==='on',optIn:fd.get('optIn')==='on'});
      notify(saved.optIn?'Profil public responsable/expert publié avec votre consentement.':'Profil public retiré de la découverte.');await renderMine();
    }catch(err){showError(err);}})();
    mine.append(form);
    if(p){const proof=el('article',undefined,'item');proof.append(el('strong','Preuves publiques choisies'),el('p',(p.evidenceSummary?.managedPublicGroupCount??0)+' groupe(s) public(s) géré(s) · '+(p.evidenceSummary?.academyCertificateCount??0)+' attestation(s) Academy','hint'),el('small','Expertise autodéclarée : oui · contact partagé : non · finance partagée : non · rôle automatique : non'));mine.append(proof);}
  };

  const renderSearch=()=>{
    search.replaceChildren(el('h3','Trouver un responsable / expert opt-in'));
    const form=document.createElement('form');form.className='form-grid';form.innerHTML='<label>Mot-clé<input name="q" placeholder="trésorerie, formation…"></label><label>Localité<input name="locality" placeholder="Yaoundé…"></label><label class="full">Expertise / service<input name="expertise" placeholder="gestion, médiation…"></label><button class="secondary">Chercher</button>';
    const results=el('div',undefined,'stack');search.append(form,results);
    form.onsubmit=e=>void(async()=>{e.preventDefault();const fd=new FormData(form),input={q:String(fd.get('q')||'').trim()||undefined,locality:String(fd.get('locality')||'').trim()||undefined,expertise:split(fd.get('expertise'))};results.replaceChildren(el('p','Recherche…','hint'));try{
      const rows=await app.searchManagerPublicProfiles(input);results.replaceChildren();if(!rows.length)results.append(el('p','Aucun profil public correspondant.','empty-state'));
      for(const p of rows){const c=el('article',undefined,'item');c.append(el('strong',p.displayAlias),el('span','Profil opt-in','pill'),el('p',[p.locality,...(p.expertise??[]),...(p.services??[])].filter(Boolean).join(' · '),'hint'));if(p.bio)c.append(el('p',p.bio));const proof=[];if(p.evidenceSummary?.managedPublicGroupCount)proof.push(p.evidenceSummary.managedPublicGroupCount+' groupe(s) public(s) géré(s)');if(p.evidenceSummary?.academyCertificateCount)proof.push(p.evidenceSummary.academyCertificateCount+' attestation(s) Academy');c.append(el('small',(proof.length?proof.join(' · '):'Expertise autodéclarée, sans preuve publique sélectionnée')+' · aucun contact privé exposé'));results.append(c);}
    }catch(err){results.replaceChildren();showError(err);results.append(el('p','Recherche indisponible : '+String(err?.message??err),'hint'));}})();
  };
  const refresh=async()=>{await renderMine();renderSearch();};
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  return{refresh,open:()=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
