const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const split=v=>v.split(',').map(x=>x.trim()).filter(Boolean);

export function mountExternalProgramsUI({app,notify=()=>{},showError=console.error,isManager=()=>false,fmt=n=>String(n)}){
  const form=document.getElementById('externalProgramForm'),root=document.getElementById('externalProgramList'),profileRoot=document.getElementById('economicProfilePreview');
  if(!form||!root||!profileRoot)return{refresh:async()=>{}};
  const renderProfile=async()=>{
    profileRoot.replaceChildren();
    if(!app.activeGroup()||!isManager())return;
    try{
      const p=await app.economicProfile();
      const card=el('article',undefined,'item');card.append(el('strong','Profil économique pseudonymisé · '+p.groupCode));
      card.append(el('p','Membres actifs : '+p.memberCount+' · Encaissements : '+fmt(p.collectedTotal)+' · Entrées caisse : '+fmt(p.cashIn)+' · Sorties caisse : '+fmt(p.cashOut)));
      const list=el('div',undefined,'stack');
      for(const r of p.rubricVolumes??[])list.append(el('p',r.rubricLabel+' : '+fmt(r.amount)+' · '+r.receiptCount+' opération(s)','hint'));
      if(!(p.rubricVolumes??[]).length)list.append(el('p','Aucune masse monétaire par rubrique disponible pour le moment.','hint'));
      card.append(list,el('p',p.exportable?'Ce profil peut être partagé sous forme agrégée avec un programme autorisé.':'Partage externe bloqué : '+(p.exportBlockers??[]).join(', '),'truth-notice'));
      profileRoot.append(card);
    }catch(e){profileRoot.append(el('p','Profil économique non disponible : '+String(e?.message??e),'hint'));}
  };
  const render=async()=>{
    root.replaceChildren();
    if(!app.activeGroup()){root.append(el('p','Sélectionnez un groupe.','hint'));return;}
    if(!isManager()){root.append(el('p','Les partenariats et programmes ONG sont réservés aux responsables habilités.','hint'));return;}
    const programs=await app.externalPrograms();
    if(!programs.length)root.append(el('p','Aucun partenariat ou programme ONG enregistré.','hint'));
    for(const p of programs){
      const card=el('article',undefined,'item');
      card.append(el('strong',p.partyName+' · '+p.programName),el('span',p.kind+' · '+p.state,'pill'),el('p',p.purpose),el('small',[...(p.localities??[]),...(p.tags??[])].join(' · ')));
      card.append(el('p','Accès données : '+(p.dataAccess==='GROUP_AGGREGATE_ECONOMIC'?'profil financier agrégé et pseudonymisé':'aucun partage financier'),'hint'));
      const actions=el('div',undefined,'actions');
      if(p.state==='DRAFT'){const b=el('button','Activer le programme','primary');b.type='button';b.onclick=()=>void(async()=>{try{await app.transitionExternalProgram(p.id,'ACTIVE');notify('Programme activé.');await render();}catch(e){showError(e);}})();actions.append(b);}
      if(p.state==='ACTIVE'){
        const share=el('button','Créer un dossier agrégé 30 jours','secondary');share.type='button';share.onclick=()=>void(async()=>{try{const pack=await app.issueExternalSharePack(p.id,p.purpose,30);notify('Dossier agrégé créé pour '+pack.groupCode+'.');await render();}catch(e){showError(e);}})();actions.append(share);
        const pause=el('button','Mettre en pause','link-btn');pause.type='button';pause.onclick=()=>void(async()=>{try{await app.transitionExternalProgram(p.id,'PAUSED');notify('Programme mis en pause.');await render();}catch(e){showError(e);}})();actions.append(pause);
      }else if(p.state==='PAUSED'){const b=el('button','Réactiver','secondary');b.type='button';b.onclick=()=>void(async()=>{try{await app.transitionExternalProgram(p.id,'ACTIVE');notify('Programme réactivé.');await render();}catch(e){showError(e);}})();actions.append(b);}
      const packs=await app.externalSharePacks(p.id).catch(()=>[]);
      if(packs.length){
        const box=el('div',undefined,'stack');box.append(el('strong','Dossiers agrégés actifs'));
        for(const x of packs.slice(0,6)){
          const row=el('div',undefined,'item');row.append(el('span',x.groupCode+' · expire '+new Date(x.expiresAt).toLocaleDateString('fr-FR'),'hint'));
          const revoke=el('button','Révoquer','link-btn');revoke.type='button';revoke.onclick=()=>void(async()=>{try{await app.revokeExternalSharePack(x.id);notify('Dossier révoqué.');await render();}catch(e){showError(e);}})();row.append(revoke);box.append(row);
        }
        card.append(box);
      }
      card.append(actions);root.append(card);
    }
    await renderProfile();
  };
  form.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    await app.createExternalProgram({kind:value('externalProgramKind'),partyName:value('externalPartyName'),programName:value('externalProgramName'),purpose:value('externalProgramPurpose'),localities:split(value('externalProgramLocalities')),tags:split(value('externalProgramTags')),dataAccess:value('externalProgramDataAccess')});
    notify('Programme créé en brouillon.');form.reset();document.getElementById('externalProgramDataAccess').value='NONE';await render();
  }catch(err){showError(err);}})();});
  document.addEventListener('eco:group-context-changed',()=>void render().catch(showError));
  return{refresh:render};
}
