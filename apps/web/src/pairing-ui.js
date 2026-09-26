const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const extractCode=input=>{
  const raw=String(input??'').trim();if(!raw)return'';
  try{const u=new URL(raw,location.origin);return u.searchParams.get('code')??raw;}catch{return raw;}
};
const copy=async text=>{try{await navigator.clipboard.writeText(text);return true;}catch{return false;}};

export function mountPairingUI({app,notify=()=>{},showError=console.error,getMembers=()=>[],isManager=()=>false,afterMembershipChanged=async()=>{}}){
  const joinStatus=document.getElementById('joinStatus'),myCode=document.getElementById('myPairingCodeResult'),managerBox=document.getElementById('managerPairingBox'),linkResult=document.getElementById('joinLinkResult'),requestsRoot=document.getElementById('pairingRequestList'),memberSelect=document.getElementById('pairMemberMembership'),discoveryHub=document.getElementById('discoveryHub');
  if(!joinStatus||!myCode||!managerBox||!linkResult||!requestsRoot||!memberSelect)return{refresh:async()=>{},stop:()=>{}};
  let pendingTimer=null,autoCodeHandled=false;

  const stop=()=>{if(pendingTimer){clearTimeout(pendingTimer);pendingTimer=null;}};
  const showJoin=(title,detail)=>{
    const card=el('article',undefined,'item');card.append(el('strong',title));if(detail)card.append(el('p',detail,'hint'));joinStatus.replaceChildren(card);
  };
  const watchPairing=(requestId,groupId)=>{
    stop();
    const tick=async()=>{
      try{
        const status=await app.pairingStatus(requestId);
        if(status.status==='APPROVED'){
          showJoin('Appairage validé','Votre compte personnel est maintenant relié à votre ancienne fiche de membre.');
          notify('Votre groupe historique est maintenant disponible.');
          await app.recordEcoPulse({itemId:groupId,itemKind:'group-membership',action:'JOIN',source:'secure-pairing',groupId,tags:['historical-group','membership']}).catch(()=>{});
          await afterMembershipChanged(groupId);return;
        }
        if(status.status==='REJECTED'){showJoin('Appairage non validé',status.decisionReason||'Contactez un responsable du groupe.');return;}
        showJoin('Rapprochement en attente','Un responsable doit seulement choisir votre ancienne fiche de membre. Vous pouvez laisser cette page ouverte.');
        pendingTimer=setTimeout(tick,8000);
      }catch{pendingTimer=setTimeout(tick,12000);}
    };
    void tick();
  };
  const redeem=async raw=>{
    const code=extractCode(raw);if(!code)throw Error('INVITE_CODE_REQUIRED');
    const result=await app.redeemJoinCode(code);
    if(result.status==='JOINED'){
      showJoin('Bienvenue dans le groupe','Votre compte est relié. Les données autorisées du groupe vont se charger automatiquement.');
      notify('Groupe rejoint avec succès.');
      await app.recordEcoPulse({itemId:result.groupId,itemKind:'group-membership',action:'JOIN',source:'secure-join',groupId:result.groupId,tags:['group','membership']}).catch(()=>{});
      await afterMembershipChanged(result.groupId);
    }else{
      showJoin('Code reconnu','Ce groupe existait avant Eco-System. Un responsable doit vous rattacher à votre fiche historique.');
      watchPairing(result.pairingRequestId,result.groupId);
    }
    return result;
  };

  document.getElementById('joinCodeForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{await redeem(value('joinCodeInput'));}catch(err){showError(err);}})();});
  document.getElementById('myPairingCodeBtn')?.addEventListener('click',()=>void (async()=>{try{
    const result=await app.createMemberPairingCode();myCode.replaceChildren();
    const card=el('article',undefined,'item');card.append(el('strong',result.code),el('p','Montrez ou envoyez ce code au responsable. Il expire rapidement et ne peut servir qu’une fois.','hint'));
    const b=el('button','Copier le code','secondary');b.type='button';b.onclick=async()=>{if(await copy(result.code))notify('Code copié.');};card.append(b);myCode.append(card);
  }catch(err){showError(err);}})());

  document.getElementById('joinLinkForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    const mode=value('joinLinkMode')||undefined;
    const result=await app.createJoinLink({mode,label:value('joinLinkLabel')||undefined,expiresHours:Number(value('joinLinkHours')||72),maxUses:Number(value('joinLinkUses')||200)});
    const url=new URL(result.joinPath,location.origin).toString();linkResult.replaceChildren();
    const card=el('article',undefined,'item');card.append(el('strong',result.code),el('p',result.mode==='HISTORICAL_MATCH'?'Rapprochement historique : aucun nouveau compte membre ne remplace automatiquement une ancienne fiche.':'Adhésion directe sécurisée : le membre rejoint le groupe sans nouvelle intervention après ouverture du lien.','hint'),el('p',url,'hint'));
    const buttons=el('div',undefined,'actions');
    const cp=el('button','Copier le lien','secondary');cp.type='button';cp.onclick=async()=>{if(await copy(url))notify('Lien copié.');};buttons.append(cp);
    if(navigator.share){const sh=el('button','Partager','primary');sh.type='button';sh.onclick=()=>void navigator.share({title:'Rejoindre mon groupe Eco-System',text:'Utilisez ce lien pour rejoindre le groupe.',url}).catch(()=>{});buttons.append(sh);}
    card.append(buttons);linkResult.append(card);
  }catch(err){showError(err);}})();});

  document.getElementById('pairMemberCodeForm')?.addEventListener('submit',e=>{e.preventDefault();void (async()=>{try{
    if(!memberSelect.value)throw Error('MEMBERSHIP_REQUIRED');const code=value('pairMemberCode');if(!code)throw Error('MEMBER_PAIRING_CODE_REQUIRED');
    const result=await app.pairMemberCode(memberSelect.value,code);notify('Compte appairé à '+String(result.displayName??'ce membre')+'.');document.getElementById('pairMemberCode').value='';await afterMembershipChanged(app.activeGroup());await refresh();
  }catch(err){showError(err);}})();});

  const renderManager=async()=>{
    const manager=Boolean(app.activeGroup()&&isManager());managerBox.hidden=!manager;if(!manager){requestsRoot.replaceChildren();return;}
    const current=memberSelect.value;memberSelect.replaceChildren();
    for(const m of getMembers())memberSelect.append(new Option(m.displayName,m.id));
    if([...memberSelect.options].some(o=>o.value===current))memberSelect.value=current;
    const requests=await app.listPairingRequests();requestsRoot.replaceChildren();
    if(!requests.length){requestsRoot.append(el('p','Aucune demande de rapprochement en attente.','hint'));return;}
    for(const r of requests){
      const card=el('article',undefined,'item');card.append(el('strong',r.displayName),el('p','État : '+r.status,'hint'));
      if(r.status==='PENDING'){
        const select=document.createElement('select');select.append(new Option('Choisir sa fiche historique',''));
        for(const m of getMembers())select.append(new Option(m.displayName,m.id));
        const actions=el('div',undefined,'actions');
        const approve=el('button','Appairer','primary');approve.type='button';approve.onclick=()=>void (async()=>{try{if(!select.value)throw Error('MEMBERSHIP_REQUIRED');await app.decidePairingRequest(r.requestId,{decision:'APPROVE',membershipId:select.value});notify('Membre historique appairé.');await afterMembershipChanged(app.activeGroup());await renderManager();}catch(err){showError(err);}})();
        const reject=el('button','Refuser','secondary');reject.type='button';reject.onclick=()=>void (async()=>{try{const reason=window.prompt('Motif du refus :','Membre non reconnu');if(reason===null)return;await app.decidePairingRequest(r.requestId,{decision:'REJECT',reason});notify('Demande refusée.');await renderManager();}catch(err){showError(err);}})();
        actions.append(approve,reject);card.append(select,actions);
      }else if(r.membershipId)card.append(el('p','Fiche liée : '+r.membershipId,'hint'));
      requestsRoot.append(card);
    }
  };

  let candidateRoot=document.getElementById('candidateDiscoveryJourney');
  if(!candidateRoot&&discoveryHub?.closest('section')){
    candidateRoot=el('section',undefined,'panel');candidateRoot.id='candidateDiscoveryJourney';
    discoveryHub.closest('section').insertAdjacentElement('beforebegin',candidateRoot);
  }
  const split=v=>String(v??'').split(',').map(x=>x.trim()).filter(Boolean);
  const field=(labelText,name,type='text')=>{const l=el('label',labelText),i=document.createElement(type==='textarea'?'textarea':'input');i.name=name;if(type!=='textarea')i.type=type;l.append(i);return{label:l,input:i};};

  const renderCandidateJourney=async()=>{
    if(!candidateRoot)return;candidateRoot.replaceChildren();
    candidateRoot.append(el('h2','Candidats consentants · recrutement privé'),el('p','Vous contrôlez ce qui devient public. Aucun téléphone, CNI, solde ou contact privé n’est révélé par la recherche. Un responsable peut signaler l’intérêt de son groupe ; vous choisissez ensuite de répondre.','truth-notice'));
    const grid=el('div',undefined,'two-col');
    const profileBox=el('div',undefined,'stack'),profileForm=el('form',undefined,'form-grid');
    profileForm.append(el('h3','Mon portfolio public'));
    const alias=field('Nom / alias public','alias'),locality=field('Localité approximative','locality'),skills=field('Compétences (séparées par virgule)','skills'),interests=field('Centres d’intérêt','interests'),desired=field('Types de groupes recherchés','desired'),availability=field('Disponibilité / préférence','availability'),bio=field('Présentation courte','bio','textarea');
    const optLabel=el('label',undefined,'check'),opt=document.createElement('input');opt.type='checkbox';opt.name='optIn';optLabel.append(opt,el('span','Je consens à apparaître dans la recherche de candidats'));
    const save=el('button','Enregistrer mon choix','primary');save.type='submit';profileForm.append(alias.label,locality.label,skills.label,interests.label,desired.label,availability.label,bio.label,optLabel,save);
    const inbox=el('div',undefined,'stack');profileBox.append(profileForm,el('h3','Invitations reçues'),inbox);grid.append(profileBox);
    const profile=await app.candidateProfile().catch(()=>undefined);if(profile){alias.input.value=profile.displayAlias??'';locality.input.value=profile.locality??'';skills.input.value=(profile.skills??[]).join(', ');interests.input.value=(profile.interests??[]).join(', ');desired.input.value=(profile.desiredGroupTags??[]).join(', ');availability.input.value=profile.availability??'';bio.input.value=profile.bio??'';opt.checked=true;}
    profileForm.onsubmit=e=>void(async()=>{e.preventDefault();try{save.disabled=true;await app.saveCandidateProfile({displayAlias:alias.input.value,locality:locality.input.value,skills:split(skills.input.value),interests:split(interests.input.value),desiredGroupTags:split(desired.input.value),availability:availability.input.value,bio:bio.input.value,optIn:opt.checked});notify(opt.checked?'Portfolio public activé.':'Portfolio retiré de la recherche.');await renderCandidateJourney();}catch(err){showError(err);}finally{save.disabled=false;}})();
    const invitations=await app.candidateInvitations().catch(()=>[]);if(!invitations.length)inbox.append(el('p','Aucune invitation de recrutement.','hint'));
    for(const inv of invitations){const card=el('article',undefined,'item');card.append(el('strong',inv.groupName||'Groupe'),el('p',inv.message||'Ce groupe souhaite entrer en relation via Eco-System.','hint'),el('span',inv.state,'pill'));if(inv.state==='PENDING'){const a=el('div',undefined,'actions'),yes=el('button','Je suis intéressé(e)','primary'),no=el('button','Décliner','secondary');yes.type=no.type='button';yes.onclick=()=>void(async()=>{try{await app.respondCandidateInvitation(inv.id,'INTERESTED');notify('Intérêt transmis. Le contact reste sous votre contrôle.');await renderCandidateJourney();}catch(err){showError(err);}})();no.onclick=()=>void(async()=>{try{await app.respondCandidateInvitation(inv.id,'DECLINED');await renderCandidateJourney();}catch(err){showError(err);}})();a.append(yes,no);card.append(a);}inbox.append(card);}
    const managerBox2=el('div',undefined,'stack');grid.append(managerBox2);candidateRoot.append(grid);
    if(!app.activeGroup()||!isManager()){managerBox2.append(el('h3','Recherche côté groupe'),el('p','Sélectionnez un groupe dont vous êtes responsable pour rechercher des candidats consentants.','hint'));return;}
    managerBox2.append(el('h3','Recherche côté groupe'));
    const campaignForm=el('form',undefined,'form-grid'),ct=field('Nom de la campagne','title'),cl=field('Localité','locality'),ctags=field('Compétences / thèmes','tags'),cm=field('Message','message','textarea'),cb=el('button','Créer la campagne','secondary');cb.type='submit';campaignForm.append(ct.label,cl.label,ctags.label,cm.label,cb);
    const campaignsRoot=el('div',undefined,'stack');managerBox2.append(campaignForm,campaignsRoot);
    campaignForm.onsubmit=e=>void(async()=>{e.preventDefault();try{await app.createRecruitmentCampaign({title:ct.input.value,message:cm.input.value,locality:cl.input.value,tags:split(ctags.input.value)});notify('Campagne de recrutement créée.');await renderCandidateJourney();}catch(err){showError(err);}})();
    const campaigns=await app.recruitmentCampaigns().catch(()=>[]);for(const c of campaigns){const card=el('article',undefined,'item');card.append(el('strong',c.title),el('span',String(c.data?.campaignState??c.status),'pill'),el('p',String(c.data?.message??''),'hint'));if(String(c.data?.campaignState)==='ACTIVE'){const pause=el('button','Mettre en pause','link-btn');pause.type='button';pause.onclick=()=>void(async()=>{await app.setRecruitmentCampaignState(c.id,'PAUSED');await renderCandidateJourney();})();card.append(pause);}campaignsRoot.append(card);}
    const searchForm=el('form',undefined,'form-grid'),sq=field('Mot-clé','q'),sl=field('Localité','locality'),st=field('Compétences / thèmes','tags'),sb=el('button','Rechercher les profils opt-in','primary');sb.type='submit';searchForm.append(sq.label,sl.label,st.label,sb);const results=el('div',undefined,'stack');managerBox2.append(el('h3','Candidats consentants'),searchForm,results);
    searchForm.onsubmit=e=>void(async()=>{e.preventDefault();try{results.replaceChildren(el('p','Recherche…','hint'));const rows=await app.searchConsentingCandidates({q:sq.input.value,locality:sl.input.value,tags:split(st.input.value)});results.replaceChildren();if(!rows.length)results.append(el('p','Aucun profil opt-in correspondant.','hint'));for(const match of rows){const c=match.candidate,card=el('article',undefined,'item');card.append(el('strong',c.displayAlias),el('p',[c.locality,(c.skills??[]).join(', ')].filter(Boolean).join(' · '),'hint'),el('span','Score recherche '+match.score,'pill'));const actions=el('div',undefined,'actions'),fit=el('button','Voir l’affinité explicable','secondary'),invite=el('button','Signaler l’intérêt du groupe','primary');fit.type=invite.type='button';fit.onclick=()=>void(async()=>{try{const f=await app.candidateGroupFit(c.id);card.append(el('p','Affinité consultative : '+f.score+'/100 · '+f.reasonCodes.join(' · '),'truth-notice'));fit.disabled=true;}catch(err){showError(err);}})();invite.onclick=()=>void(async()=>{try{const active=campaigns.find(x=>String(x.data?.campaignState)==='ACTIVE');const message=window.prompt('Message visible par le candidat :',active?.data?.message||'Notre groupe souhaite vous inviter à découvrir ses activités.');if(message===null)return;await app.inviteConsentingCandidate(c.id,{campaignId:active?.id,message});notify('Invitation transmise sans divulguer les coordonnées privées du candidat.');}catch(err){showError(err);}})();actions.append(fit,invite);card.append(actions);results.append(card);}}catch(err){results.replaceChildren();showError(err);}})();
  };

  const handleUrlCode=async()=>{
    if(autoCodeHandled)return;const url=new URL(location.href),code=url.searchParams.get('code');if(!code)return;
    autoCodeHandled=true;const input=document.getElementById('joinCodeInput');if(input)input.value=code;
    try{await redeem(code);url.searchParams.delete('code');history.replaceState(null,'',url.pathname+url.search+url.hash);}catch(err){showError(err);}
  };

  const refresh=async()=>{try{await renderManager();await renderCandidateJourney();await handleUrlCode();}catch(err){showError(err);}};
  return{refresh,stop};
}
