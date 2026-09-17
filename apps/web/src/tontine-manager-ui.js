const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};

/**
 * Permanent Tontine cockpit.
 *
 * The operational forms are owned by completion-ui. 1.3.3 accidentally bound
 * this module to the same forms a second time, with older element ids. One
 * click could therefore submit two different commands. This module is now
 * deliberately render/action-only: one form, one owner, one mutation path.
 */
export function mountTontineManagerUI({app,getMembers,notify=()=>{},showError=console.error,fmt=n=>String(n),isManager=()=>false}){
  const root=document.getElementById('tontineManagerList');
  if(!root)return{refresh:async()=>{}};
  let cycles=[],shares=[];

  const render=()=>{
    root.replaceChildren();
    if(!app.activeGroup()){root.append(el('p','Sélectionnez un groupe.','hint'));return;}
    if(!cycles.length){
      root.append(el('p','Aucun cycle Tontine permanent enregistré. Créez le cycle depuis une rubrique Tontine du groupe.','hint'));
      return;
    }
    for(const cycle of cycles){
      const card=el('article',undefined,'item'),data=cycle.data??{};
      const amount=Number(data.nominalPotAmount??0);
      card.append(
        el('strong',cycle.title),
        el('p',(data.rounds??'—')+' tour(s) · '+(data.potsPerRound??'—')+' pot(s) par tour'+(amount>0?' · pot prévu '+fmt(amount):''))
      );
      const list=el('div',undefined,'stack');
      const own=shares.filter(s=>s.data?.cycleId===cycle.id).sort((a,b)=>Number(a.data?.scheduledRound??999)-Number(b.data?.scheduledRound??999));
      for(const share of own){
        const row=el('article',undefined,'item'),m=getMembers().find(x=>x.id===share.data?.membershipId),state=String(share.data?.completionState??'REGISTERED');
        row.append(el('strong',share.title),el('p',(m?.displayName??share.data?.membershipId??'Membre')+' · '+state+' · tour '+(share.data?.scheduledRound??'non programmé')));
        if(isManager()){
          const actions=el('div',undefined,'actions');
          if(state!=='SERVED'&&state!=='CANCELLED'){
            const schedule=el('button','Programmer / reprogrammer','secondary');schedule.type='button';
            schedule.onclick=()=>void(async()=>{try{
              const raw=prompt('Numéro du tour',String(share.data?.scheduledRound??1));if(raw===null)return;
              const round=Number(raw);if(!Number.isSafeInteger(round)||round<1)throw Error('Numéro de tour invalide.');
              await app.scheduleTontineShare(share.id,round,Number(share.data?.completionVersion??1));
              notify('Part programmée.');await refresh();
            }catch(e){showError(e);}})();actions.append(schedule);
          }
          if(state==='SCHEDULED'){
            const serve=el('button','Servir le pot','primary');serve.type='button';
            serve.onclick=()=>void(async()=>{try{
              const raw=prompt('Montant réellement décaissé (F CFA)',String(data.nominalPotAmount??''));if(raw===null)return;
              const amount=Number(raw);if(!Number.isSafeInteger(amount)||amount<=0)throw Error('Montant du pot invalide.');
              await app.serveTontineShare(share.id,{amount,expectedVersion:Number(share.data?.completionVersion??1)});
              notify('Pot servi avec preuve Ledger canonique.');await refresh();
            }catch(e){showError(e);}})();actions.append(serve);
          }
          if(state!=='SERVED'&&state!=='CANCELLED'){
            const cancel=el('button','Annuler la part','link-btn');cancel.type='button';
            cancel.onclick=()=>void(async()=>{try{
              await app.transitionCompletion(share.id,'CANCELLED',Number(share.data?.completionVersion??1),{},'Annulation depuis le gestionnaire Tontines');
              notify('Part annulée sans effacer son historique.');await refresh();
            }catch(e){showError(e);}})();actions.append(cancel);
          }
          row.append(actions);
        }
        list.append(row);
      }
      if(!own.length)list.append(el('p','Aucune part enregistrée.','hint'));
      card.append(list);root.append(card);
    }
  };

  const refresh=async()=>{
    if(!app.activeGroup()){cycles=[];shares=[];render();return;}
    [cycles,shares]=await Promise.all([app.listCompletion('TONTINE_CYCLE'),app.listCompletion('TONTINE_SHARE')]);
    render();
  };
  return{refresh};
}
