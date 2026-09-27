const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const kindLabel={PERSON:'Personne',SKILL:'Compétence',GROUP:'Groupe',NEED:'Besoin',OFFER:'Offre',COURSE:'Formation',LOCALITY:'Zone',CATEGORY:'Catégorie'};

export function mountOpportunityGraphUI({app,showError=()=>{}}={}){
  const anchor=document.getElementById('opportunityIntelligence')??document.getElementById('marketHub')?.closest('section');if(!anchor||document.getElementById('opportunityGraphCenter'))return{refresh:async()=>{},open:()=>{}};
  const root=el('details',undefined,'panel');root.id='opportunityGraphCenter';root.append(el('summary','Eco Opportunity Graph'));
  root.append(el('p','Le graphe relie les objets déjà existants : personne, compétence, groupe, besoin, offre, formation, zone et catégorie. Il est calculé à la demande et ne devient jamais une seconde base de vérité.','truth-notice'));
  const filter=document.createElement('form');filter.className='inline-form';filter.innerHTML='<select name="kind"><option value="">Tous les types</option><option>PERSON</option><option>SKILL</option><option>GROUP</option><option>NEED</option><option>OFFER</option><option>COURSE</option><option>LOCALITY</option><option>CATEGORY</option></select><input name="q" placeholder="Filtrer libellé / relation"><button class="secondary">Filtrer</button>';
  const metrics=el('div',undefined,'metrics small'),nodes=el('div',undefined,'stack'),edges=el('div',undefined,'stack'),grid=el('div',undefined,'two-col'),left=el('section'),right=el('section');left.append(el('h3','Nœuds visibles'),nodes);right.append(el('h3','Relations visibles'),edges);grid.append(left,right);root.append(filter,metrics,grid);
  anchor.insertAdjacentElement('afterend',root);let model=null,kind='',q='';
  const metric=(label,value)=>{const m=el('article',undefined,'metric');m.append(el('span',label),el('strong',value));metrics.append(m);};
  const render=()=>{
    metrics.replaceChildren();nodes.replaceChildren();edges.replaceChildren();if(!model)return;
    const query=q.trim().toLowerCase(),visibleNodes=(model.nodes??[]).filter(n=>(!kind||n.kind===kind)&&(!query||String(n.label).toLowerCase().includes(query)||String(n.kind).toLowerCase().includes(query))),ids=new Set(visibleNodes.map(x=>x.id));
    const visibleEdges=(model.edges??[]).filter(e=>(!kind||ids.has(e.from)||ids.has(e.to))&&(!query||String(e.relation).toLowerCase().includes(query)||String(e.reasonCodes??[]).toLowerCase().includes(query)||ids.has(e.from)||ids.has(e.to)));
    metric('Nœuds',visibleNodes.length);metric('Relations',visibleEdges.length);metric('Persisté',model.persisted?'Oui':'Non');metric('Filtrage vie privée',model.privacyFiltered?'Actif':'À vérifier');
    if(!visibleNodes.length)nodes.append(el('p','Aucun nœud correspondant.','empty-state'));
    for(const n of visibleNodes.slice(0,100)){const c=el('article',undefined,'item');c.append(el('strong',n.label),el('span',kindLabel[n.kind]??n.kind,'pill'),el('small','Visibilité : '+n.visibility));if(n.meta&&Object.keys(n.meta).length)c.append(el('p',Object.entries(n.meta).filter(([,v])=>v!==''&&v!==null).map(([k,v])=>k+' : '+v).join(' · '),'hint'));nodes.append(c);}
    const byId=new Map((model.nodes??[]).map(n=>[n.id,n]));if(!visibleEdges.length)edges.append(el('p','Aucune relation correspondante.','empty-state'));
    for(const e of visibleEdges.slice(0,160)){const a=byId.get(e.from),b=byId.get(e.to),c=el('article',undefined,'item');c.append(el('strong',(a?.label??e.from)+' → '+(b?.label??e.to)),el('span',e.relation,'pill'),el('small','Visibilité : '+e.visibility+(e.reasonCodes?.length?' · '+e.reasonCodes.join(' · '):'')));edges.append(c);}
  };
  const refresh=async()=>{try{model=await app.opportunityGraph();render();}catch(e){showError(e);nodes.replaceChildren(el('p','Opportunity Graph indisponible : '+String(e?.message??e),'hint'));}};
  filter.onsubmit=e=>{e.preventDefault();const fd=new FormData(filter);kind=String(fd.get('kind')||'');q=String(fd.get('q')||'');render();};
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  return{refresh,open:()=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
