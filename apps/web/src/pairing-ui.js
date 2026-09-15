const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const extractCode=input=>{
  const raw=String(input??'').trim();if(!raw)return'';
  try{const u=new URL(raw,location.origin);return u.searchParams.get('code')??raw;}catch{return raw;}
};
const copy=async text=>{try{await navigator.clipboard.writeText(text);return true;}catch{return false;}};

export function mountPairingUI({app,notify=()=>{},showError=console.error,getMembers=()=>[],isManager=()=>false,afterMembershipChanged=async()=>{}}){
  const joinStatus=document.getElementById('joinStatus'),myCode=document.getElementById('myPairingCodeResult'),managerBox=document.getElementById('managerPairingBox'),linkResult=document.getElementById('joinLinkResult'),requestsRoot=document.getElementById('pairingRequestList'),memberSelect=document.getElementById('pairMemberMembership');
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

  const handleUrlCode=async()=>{
    if(autoCodeHandled)return;const url=new URL(location.href),code=url.searchParams.get('code');if(!code)return;
    autoCodeHandled=true;const input=document.getElementById('joinCodeInput');if(input)input.value=code;
    try{await redeem(code);url.searchParams.delete('code');history.replaceState(null,'',url.pathname+url.search+url.hash);}catch(err){showError(err);}
  };

  const refresh=async()=>{try{await renderManager();await handleUrlCode();}catch(err){showError(err);}};
  return{refresh,stop};
}
