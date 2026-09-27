const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const money=n=>Number(n??0).toLocaleString('fr-FR')+' XAF';
const accessLabel={AVAILABLE:'Disponible',RESERVED:'Réservé',REVIEW_REQUIRED:'Règle à vérifier',ACTIVITY_ONLY:'Activité non dépensable'};

export function mountWalletUI({app,notify=()=>{},showError=()=>{},navigate=()=>{}}={}){
  const host=document.querySelector('#view-dashboard');if(!host||document.getElementById('walletCenter'))return{refresh:async()=>{},open:()=>{}};
  const root=el('details',undefined,'panel');root.id='walletCenter';root.append(el('summary','Wallet Eco-System · mes soldes internes'));
  root.append(el('p','Le Wallet est une projection personnelle du Ledger canonique. Il ne duplique aucune écriture. Les rubriques non remboursables restent visibles comme activité mais ne deviennent pas de l’argent disponible. Les recharges Mobile Money/cartes restent désactivées tant qu’un fournisseur réel n’est pas connecté.','truth-notice'));
  const metrics=el('div',undefined,'metrics small'),subs=el('div',undefined,'stack'),history=el('div',undefined,'stack');
  const grid=el('div',undefined,'two-col'),left=el('section'),right=el('section');left.append(el('h3','Sous-comptes'),subs);right.append(el('h3','Historique'),history);grid.append(left,right);root.append(metrics,grid);
  const anchor=document.getElementById('personalCockpitPanel');anchor?.insertAdjacentElement('afterend',root);

  const metric=(label,value,note='')=>{const m=el('article',undefined,'metric');m.append(el('span',label),el('strong',value));if(note)m.append(el('small',note));metrics.append(m);};
  const refresh=async()=>{
    metrics.replaceChildren();subs.replaceChildren();history.replaceChildren();
    try{
      const w=await app.wallet();
      metric('Wallet',money(w.walletBalance),'Disponible + réservé');
      metric('Disponible',money(w.availableBalance));
      metric('Réservé',money(w.reservedBalance));
      metric('Activité non dépensable',money(w.activityOnlyBalance),'Ex. Collation / Aide locale selon la règle');
      if(!w.subaccounts?.length)subs.append(el('p','Aucun sous-compte personnel alimenté.','empty-state'));
      for(const s of w.subaccounts??[]){
        const c=el('article',undefined,'item');c.append(el('strong',s.groupName+' · '+s.label),el('span',accessLabel[s.access]??s.access,'pill'),el('p','Suivi '+money(s.trackedBalance)+' · réservé '+money(s.reservedBalance)+' · disponible '+money(s.availableBalance),'hint'));
        if(s.reasonCodes?.length)c.append(el('small',s.reasonCodes.join(' · ')));
        if(s.availableBalance>0&&s.access==='AVAILABLE'){
          const reserve=el('button','Réserver une partie','secondary');reserve.type='button';reserve.onclick=()=>void(async()=>{const raw=prompt('Montant à réserver (XAF)',String(Math.min(s.availableBalance,1000)));if(raw===null)return;const amount=Number(raw);if(!Number.isSafeInteger(amount)||amount<=0)return;const purpose=prompt('Objet de la réservation :')?.trim();if(!purpose)return;try{await app.reserveWallet({groupId:s.groupId,subaccountKey:s.key,amount,purpose});notify('Montant réservé sans créer de nouvelle écriture Ledger.');await refresh();}catch(e){showError(e);}})();c.append(reserve);
        }
        subs.append(c);
      }
      const rows=(w.history??[]).slice(0,80);if(!rows.length)history.append(el('p','Aucun mouvement personnel.','empty-state'));
      for(const r of rows){const c=el('article',undefined,'item');const sign=Number(r.amount??0)>0?'+':'';c.append(el('strong',(r.groupName?String(r.groupName)+' · ':'')+String(r.label??r.kind)),el('span',String(r.kind),'pill'),el('p',sign+money(r.amount),'hint'),el('small',new Date(String(r.at)).toLocaleString('fr-FR')));if(r.kind==='RESERVATION'){const release=el('button','Libérer la réservation','link-btn');release.type='button';release.onclick=()=>void app.releaseWalletReservation(String(r.id)).then(()=>{notify('Réservation libérée.');return refresh();}).catch(showError);c.append(release);}history.append(c);}
      if(w.providerTopupEnabled===false){const note=el('p','Recharge externe : non activée. Aucune fausse intégration Mobile Money / carte n’est affichée.','truth-notice');history.prepend(note);}
    }catch(e){subs.append(el('p','Wallet indisponible : '+String(e?.message??e),'hint'));}
  };
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  document.addEventListener('eco:group-context-changed',()=>{if(root.open)void refresh();});
  return{refresh,open:()=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
