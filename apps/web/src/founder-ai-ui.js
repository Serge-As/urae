const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const severity={CRITICAL:'Critique',HIGH:'Important',WATCH:'À surveiller',INFO:'Information'};
export function mountFounderAIUI({app,showError=()=>{}}={}){
  const host=document.getElementById('founderControlRoot');if(!host||document.getElementById('founderAICenter'))return{open:()=>{},refresh:async()=>false};
  const root=el('details',undefined,'panel');root.id='founderAICenter';root.append(el('summary','Founder AI · brief stratégique sourcé'));
  root.append(el('p','Réservé à l’équipe fondatrice. Le brief croise Knowledge Bank, catalogue, Control Center et apprentissages collectifs k-anonymisés. Il explique et suggère ; il ne peut ni exécuter une action, ni activer une règle, ni écrire dans le Ledger.','truth-notice'));
  const form=document.createElement('form');form.className='form-grid';const lab=el('label','Question / thème'),q=document.createElement('input');q.placeholder='Ex. Live, offline, régressions, marketplace…';lab.append(q);const b=el('button','Construire le brief','primary');b.type='submit';form.append(lab,b);const metrics=el('div',undefined,'metrics small'),list=el('div',undefined,'stack'),actions=el('div',undefined,'stack');root.append(form,metrics,list,actions);host.insertBefore(root,host.children[3]??null);
  const render=async()=>{
    metrics.replaceChildren();list.replaceChildren();actions.replaceChildren();
    try{const brief=await app.founderAiContext(q.value.trim()),ps=brief.priorities??[];for(const [label,value] of [['Priorités',ps.length],['Critiques',ps.filter(x=>x.severity==='CRITICAL').length],['Actions suggérées',(brief.suggestedActions??[]).length],['Exécution autonome',brief.guardrails?.canExecute?'Oui':'Non']]){const m=el('article',undefined,'metric');m.append(el('span',label),el('strong',value));metrics.append(m);}
      if(!ps.length)list.append(el('p','Aucune priorité sourcée ne correspond à ce thème. Founder AI n’invente pas de signal.','empty-state'));
      for(const p of ps){const c=el('article',undefined,'item');c.append(el('strong',p.title),el('span',severity[p.severity]??p.severity,'pill'),el('p',p.reason,'hint'),el('small','Preuve : '+p.evidenceRef));list.append(c);}
      if(brief.suggestedActions?.length){actions.append(el('h3','Actions à décider humainement'));for(const a of brief.suggestedActions){const c=el('article',undefined,'item');c.append(el('strong',a.label),el('small','Preuve : '+a.evidenceRef+' · exécution automatique : non'));actions.append(c);}}
      actions.append(el('p','Garde-fous : écriture Ledger '+(brief.guardrails?.canWriteLedger?'oui':'non')+' · activation de règles '+(brief.guardrails?.canActivateRules?'oui':'non')+' · données membres brutes '+(brief.guardrails?.rawMemberData?'oui':'non')+' · apprentissage groupe brut '+(brief.guardrails?.rawGroupLearningData?'oui':'non'),'truth-notice'));return true;
    }catch(e){if(String(e?.message??e).includes('FOUNDER_TEAM_ONLY')){root.hidden=true;return false;}showError(e);return false;}
  };
  form.onsubmit=e=>{e.preventDefault();void render();};root.addEventListener('toggle',()=>{if(root.open)void render();});
  return{refresh:render,open:()=>{root.hidden=false;root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void render();}};
}
