const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const num=id=>Number(value(id));

export function mountTontineManagerUI({app,getRubrics,getMembers,notify=()=>{},showError=console.error,fmt=n=>String(n),isManager=()=>false}){
  const cycleForm=document.getElementById('tontineCycleForm'),shareForm=document.getElementById('tontineShareForm'),root=document.getElementById('tontineManagerList');
  if(!cycleForm||!shareForm||!root)return{refresh:async()=>{}};
  let cycles=[],shares=[];
  const option=(v,t)=>{const o=document.createElement('option');o.value=v;o.textContent=t;return o;};
  const populate=()=>{
    const rubric=document.getElementById('tontineCycleRubric'),cycle=document.getElementById('tontineShareCycle'),member=document.getElementById('tontineShareMember');
    rubric.replaceChildren(option('','Choisir une rubrique Tontine'));
    for(const r of getRubrics().filter(r=>r.activityPlan?.kind==='TONTINE'))rubric.append(option(r.id,r.name));
    cycle.replaceChildren(option('','Choisir un cycle'));for(const c of cycles)cycle.append(option(c.id,c.title));
    member.replaceChildren(option('','Choisir un membre'));for(const m of getMembers())member.append(option(m.id,m.displayName));
  };
  const render=()=>{
    root.replaceChildren();
    if(!app.activeGroup()){root.append(el('p','Sélectionnez un groupe.','hint'));return;}
    if(!cycles.length){root.append(el('p','Aucun cycle Tontine permanent enregistré. Créez-en un depuis une rubrique Tontine du groupe.','hint'));return;}
    for(const cycle of cycles){
      const card=el('article',undefined,'item'),data=cycle.data??{};
      card.append(el('strong',cycle.title),el('p',(data.rounds??'—')+' tour(s) · '+(data.potsPerRound??'—')+' pot(s) par tour'+(data.nominalPotAmount?' · '+fmt(Number(data.nominalPotAmount)):'') ));
      const list=el('div',undefined,'stack'),own=shares.filter(s=>s.data?.cycleId===cycle.id).sort((a,b)=>Number(a.data?.scheduledRound??999)-Number(b.data?.scheduledRound??999));
      for(const share of own){
        const row=el('article',undefined,'item'),m=getMembers().find(x=>x.id===share.data?.membershipId),state=String(share.data?.completionState??'REGISTERED');
        row.append(el('strong',share.title),el('p',(m?.displayName??share.data?.membershipId??'Membre')+' · '+state+' · tour '+(share.data?.scheduledRound??'non programmé')));
        if(isManager()){
          const actions=el('div',undefined,'actions');
          if(state!=='SERVED'&&state!=='CANCELLED'){
            const schedule=el('button','Programmer / reprogrammer','secondary');schedule.type='button';schedule.onclick=()=>void(async()=>{try{const raw=prompt('Numéro du tour',String(share.data?.scheduledRound??1));if(raw===null)return;await app.scheduleTontineShare(share.id,Number(raw),Number(share.data?.completionVersion??1));notify('Part programmée.');await refresh();}catch(e){showError(e);}})();actions.append(schedule);
          }
          if(state==='SCHEDULED'){
            const serve=el('button','Servir le pot','primary');serve.type='button';serve.onclick=()=>void(async()=>{try{const raw=prompt('Montant réellement décaissé (F CFA)',String(data.nominalPotAmount??''));if(raw===null)return;await app.serveTontineShare(share.id,{amount:Number(raw),expectedVersion:Number(share.data?.completionVersion??1)});notify('Pot servi avec preuve Ledger canonique.');await refresh();}catch(e){showError(e);}})();actions.append(serve);
          }
          if(state!=='SERVED'&&state!=='CANCELLED'){
            const cancel=el('button','Annuler la part','link-btn');cancel.type='button';cancel.onclick=()=>void(async()=>{try{await app.transitionCompletion(share.id,'CANCELLED',Number(share.data?.completionVersion??1),{},'Annulation depuis le gestionnaire Tontines');notify('Part annulée sans effacer son historique.');await refresh();}catch(e){showError(e);}})();actions.append(cancel);
          }
          row.append(actions);
        }
        list.append(row);
      }
      if(!own.length)list.append(el('p','Aucune part enregistrée.','hint'));card.append(list);root.append(card);
    }
  };
  const refresh=async()=>{
    if(!app.activeGroup()){cycles=[];shares=[];populate();render();return;}
    [cycles,shares]=await Promise.all([app.listCompletion('TONTINE_CYCLE'),app.listCompletion('TONTINE_SHARE')]);populate();render();
  };
  cycleForm.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    await app.createTontineCycle({rubricId:value('tontineCycleRubric'),name:value('tontineCycleName'),rounds:num('tontineCycleRounds'),potsPerRound:num('tontineCyclePots'),nominalPotAmount:value('tontineCycleAmount')?num('tontineCycleAmount'):undefined});
    notify('Cycle Tontine créé.');cycleForm.reset();await refresh();
  }catch(err){showError(err);}})();});
  shareForm.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    await app.addTontineShare({cycleId:value('tontineShareCycle'),membershipId:value('tontineShareMember'),label:value('tontineShareLabel')});
    notify('Part Tontine ajoutée.');document.getElementById('tontineShareLabel').value='';await refresh();
  }catch(err){showError(err);}})();});
  return{refresh};
}
