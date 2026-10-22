const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(className)node.className=className;return node;};

export function mountIdentityVerificationUI({app,getGroups=()=>[],navigate,notify=()=>{},showError=()=>{}}={}){
  const settings=document.querySelector('#view-settings');if(!settings||document.querySelector('#identityVerificationCenter'))return{refresh:async()=>{}};
  const panel=el('section',undefined,'panel');panel.id='identityVerificationCenter';
  const head=el('div',undefined,'section-kicker'),copy=el('div');copy.append(el('span','Identité sécurisée','eyebrow'),el('h2','Centre de vérification'),el('p','Rapprochez votre compte avec d’anciens dossiers par nom, téléphone ou CNI. Les valeurs sont transformées en empreinte HMAC côté serveur et ne sont jamais réaffichées.'));head.append(copy);panel.append(head);
  const grid=el('div',undefined,'two-col'),left=el('div'),right=el('div');
  const form=el('form',undefined,'form-grid');form.id='identityProofForm';
  const typeLabel=el('label','Type de preuve');const type=document.createElement('select');type.id='identityProofType';for(const [value,label] of [['NAME','Nom'],['PHONE','Téléphone'],['CNI','CNI']]){const o=document.createElement('option');o.value=value;o.textContent=label;type.append(o);}typeLabel.append(type);
  const valueLabel=el('label','Valeur à indexer');const value=document.createElement('input');value.id='identityProofValue';value.required=true;value.autocomplete='off';value.maxLength=120;valueLabel.append(value);
  const submit=el('button','Indexer de manière sécurisée','primary');submit.type='submit';
  const notice=el('p','Aucune valeur en clair n’est conservée par ce panneau.','hint');notice.id='identityProofNotice';
  form.append(typeLabel,valueLabel,submit,notice);left.append(el('h3','Mes preuves de rapprochement'),form);
  const refresh=el('button','Actualiser les rapprochements','secondary');refresh.type='button';const list=el('div',undefined,'stack');list.id='identityProofMatches';right.append(el('h3','Rapprochements exacts'),refresh,list);grid.append(left,right);panel.append(grid);
  right.append(el('p','Un nom ou téléphone commun est un indice à examiner, jamais une preuve suffisante pour fusionner des personnes. Le rattachement demande les preuves et la validation du parcours d’appairage historique.','truth-notice'));
  const scope=()=>JSON.stringify([app.currentActor?.(),app.currentTenant?.()]);let identity=scope(),generation=0;
  const clearForContext=(force=false)=>{if(!force&&identity===scope())return;identity=scope();generation++;value.value='';list.replaceChildren();notice.textContent='Les preuves sont vérifiées par le serveur ; aucun rapprochement automatique.';};
  const hardening=document.querySelector('#hardeningHub')?.closest('section.panel');settings.insertBefore(panel,hardening??null);

  const renderMatches=async()=>{
    clearForContext();const token=generation,current=identity;
    list.replaceChildren();
    if(typeof navigator!=='undefined'&&navigator.onLine===false){list.append(el('p','Connexion requise pour vérifier les empreintes. Aucune vérification locale approximative n’est effectuée.','empty-state'));return;}
    try{
      const visible=new Map((getGroups()??[]).map(g=>[g.id,g]));
      const rows=await app.identityProofMatches();
      if(token!==generation||current!==scope())return;
      const authorized=rows.filter(x=>visible.has(x.groupId));
      if(!authorized.length){list.append(el('p','Aucun rapprochement exact visible pour ce compte.','empty-state'));return;}
      for(const row of authorized){
        const group=visible.get(row.groupId),card=el('article',undefined,'item');
        card.append(el('strong',group?.name??'Groupe'),el('small',row.proofType+' · correspondance exacte par empreinte'));
        const open=el('button','Ouvrir le groupe','link-btn');open.type='button';open.onclick=async()=>{app.selectGroup(row.groupId);if(navigate)navigate('members',{force:true});};card.append(open);list.append(card);
      }
    }catch(error){if(token===generation&&current===scope())list.append(el('p','Centre indisponible : '+String(error?.message??error),'hint'));}
  };
  form.addEventListener('submit',event=>{event.preventDefault();void(async()=>{
    clearForContext();const token=generation,current=identity;
    const raw=value.value;value.value='';
    try{
      if(typeof navigator!=='undefined'&&navigator.onLine===false)throw Error('NETWORK_UNAVAILABLE');
      const result=await app.registerIdentityProof(type.value,raw,'USER_PRESENTED_VERIFICATION_CENTER');
      if(token!==generation||current!==scope())return;
      notice.textContent='Preuve indexée : '+String(result.proofType)+' · état '+String(result.state)+'. La valeur saisie a été effacée.';
      notify('Preuve d’identité indexée sans conserver la valeur en clair dans l’interface.');
      await renderMatches();
    }catch(error){if(token===generation&&current===scope()){notice.textContent=String(error?.message??error);showError(error);}}
  })();});
  refresh.onclick=()=>void renderMatches();
  return{refresh:renderMatches,clearForContext};
}
