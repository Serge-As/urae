const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const levelLabel={CERTAIN:'Certain',VERY_PROBABLE:'Très probable',HISTORICAL_INFERENCE:'Inférence historique',OPPORTUNITY:'Opportunité'};

export function mountAnticipationUI({app,isManager=()=>false,notify=()=>{},showError=()=>{}}={}){
  const host=document.querySelector('#view-dashboard');if(!host||document.querySelector('#anticipationCenter'))return{refresh:async()=>{},open:()=>{}};
  const root=el('section',undefined,'panel');root.id='anticipationCenter';
  root.append(el('div','Préparer · ne jamais imposer','eyebrow'),el('h2','Anticipation du groupe'),el('p','Signaux déterministes et clairement étiquetés. Aucun signal ne modifie le RI, le Ledger, une obligation financière ou la date d’une séance.','truth-notice'));
  const actions=el('div',undefined,'actions'),generate=el('button','Générer un brouillon','primary'),refreshBtn=el('button','Actualiser','secondary');generate.type=refreshBtn.type='button';actions.append(generate,refreshBtn);root.append(actions);
  const signals=el('div',undefined,'stack'),history=el('div',undefined,'stack'),grid=el('div',undefined,'two-col'),a=el('section'),b=el('section');a.append(el('h3','Signaux actuels'),signals);b.append(el('h3','Plans d’anticipation'),history);grid.append(a,b);root.append(grid);
  const cockpit=document.querySelector('#roleDashboardsCenter')??document.querySelector('#personalCockpitPanel');cockpit?.insertAdjacentElement('afterend',root);
  const refresh=async()=>{
    signals.replaceChildren();history.replaceChildren();generate.hidden=!isManager();
    if(!app.activeGroup()){signals.append(el('p','Sélectionnez un groupe.','empty-state'));return;}
    try{
      const model=await app.anticipation();
      if(!model.signals?.length)signals.append(el('p','Aucun signal disponible.','empty-state'));
      for(const s of model.signals??[]){const c=el('article',undefined,'item');c.append(el('strong',s.title),el('span',levelLabel[s.level]??s.level,'pill'),el('p',s.detail,'hint'));if(s.sourceRefs?.length)c.append(el('small','Sources : '+s.sourceRefs.join(', ')));signals.append(c);}
      if(!model.items?.length)history.append(el('p','Aucun brouillon créé.','empty-state'));
      for(const r of model.items??[]){const state=String(r.data?.anticipationState??r.status),rows=JSON.parse(String(r.data?.signalsJson??'[]')),c=el('article',undefined,'item');c.append(el('strong',r.title),el('span',state,'pill'),el('p',rows.length+' signal(s) · validation humaine : '+(r.data?.humanValidated?'oui':'non'),'hint'));
        if(isManager()&&state==='DRAFT'){const v=el('button','Valider ce plan','primary');v.type='button';v.onclick=()=>void app.transitionAnticipation(r.id,'validate').then(()=>{notify('Plan d’anticipation validé. Aucun effet financier automatique.');return refresh();}).catch(showError);c.append(v);}
        if(isManager()&&state==='ACTIVE'){const done=el('button','Marquer traité','secondary');done.type='button';done.onclick=()=>void app.transitionAnticipation(r.id,'complete').then(refresh).catch(showError);c.append(done);}
        if(isManager()&&!['ARCHIVED'].includes(state)){const arch=el('button','Archiver','link-btn');arch.type='button';arch.onclick=()=>void app.transitionAnticipation(r.id,'archive').then(refresh).catch(showError);c.append(arch);}
        history.append(c);
      }
    }catch(e){signals.append(el('p','Anticipation indisponible : '+String(e?.message??e),'hint'));}
  };
  generate.onclick=()=>void app.createAnticipationDraft().then(()=>{notify('Brouillon déterministe créé. Il reste à le valider.');return refresh();}).catch(showError);
  refreshBtn.onclick=()=>void refresh();document.addEventListener('eco:group-context-changed',()=>void refresh());
  return{refresh,open:()=>{root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
