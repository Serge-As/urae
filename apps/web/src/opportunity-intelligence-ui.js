const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const money=n=>Number(n??0).toLocaleString('fr-FR')+' XAF';
const state=x=>String(x?.data?.state??x?.status??'');

export function mountOpportunityIntelligenceUI({app,notify=()=>{},showError=()=>{},isManager=()=>false}={}){
  const marketHub=document.getElementById('marketHub');if(!marketHub||document.getElementById('opportunityIntelligence'))return{refresh:async()=>{}};
  const root=el('details',undefined,'panel');root.id='opportunityIntelligence';
  root.append(el('summary','Matching besoins ↔ offres · Market Intelligence'));
  root.append(el('p','Projection explicable des besoins du groupe vers les offres compatibles. Les prix, délais et preuves influencent le classement ; le sponsoring ne modifie jamais le score. Le profil financier reste agrégé au niveau du groupe et n’expose aucun membre.','truth-notice'));
  const metrics=el('div',undefined,'metrics small'),graph=el('div',undefined,'stack'),market=el('div',undefined,'stack');
  const grid=el('div',undefined,'two-col'),left=el('section'),right=el('section');left.append(el('h3','Correspondance besoins → offres'),graph);right.append(el('h3','Intelligence marché agrégée'),market);grid.append(left,right);root.append(metrics,grid);
  marketHub.closest('section')?.insertAdjacentElement('afterend',root);

  const addMetric=(label,value,note='')=>{const m=el('article',undefined,'metric');m.append(el('span',label),el('strong',value));if(note)m.append(el('small',note));metrics.append(m);};
  const aggregateOffers=offers=>{
    const byCategory=new Map(),byLocality=new Map();
    for(const o of offers.filter(x=>String(x.data?.state??'ACTIVE')==='ACTIVE')){
      const cat=String(o.data?.category??'Autre').trim()||'Autre',loc=String(o.data?.locality??'Non précisée').trim()||'Non précisée';
      const c=byCategory.get(cat)??{count:0,knownPrices:[],capacity:0};c.count++;c.capacity+=Number(o.data?.availableQuantity??0);if(o.data?.unitPrice!==null&&o.data?.unitPrice!==undefined)c.knownPrices.push(Number(o.data.unitPrice));byCategory.set(cat,c);
      byLocality.set(loc,(byLocality.get(loc)??0)+1);
    }
    return{byCategory:[...byCategory.entries()].sort((a,b)=>b[1].count-a[1].count),byLocality:[...byLocality.entries()].sort((a,b)=>b[1]-a[1])};
  };

  const refresh=async()=>{
    metrics.replaceChildren();graph.replaceChildren();market.replaceChildren();
    if(!app.activeGroup()){graph.append(el('p','Sélectionnez un groupe.','empty-state'));return;}
    try{
      const [needs,offers,profile]=await Promise.all([
        app.valueNeeds().catch(()=>[]),app.valueOffers().catch(()=>[]),isManager()?app.economicProfile().catch(()=>null):Promise.resolve(null)
      ]);
      const openNeeds=needs.filter(x=>!['CLOSED','CANCELLED'].includes(state(x)));
      const activeOffers=offers.filter(x=>String(x.data?.state??'ACTIVE')==='ACTIVE');
      addMetric('Besoins ouverts',openNeeds.length);
      addMetric('Offres actives',activeOffers.length);
      addMetric('Catégories marché',new Set(activeOffers.map(x=>String(x.data?.category??''))).size);
      addMetric('Profil agrégé',profile?(profile.exportable?'Partage autorisable':'Partage bloqué'):'Privé / indisponible',profile?profile.memberCount+' membres actifs':'');
      if(profile){
        const p=el('article',undefined,'item');p.append(el('strong','Profil économique agrégé · '+String(profile.groupCode)),el('p','Collecté '+money(profile.collectedTotal)+' · entrées caisse '+money(profile.cashIn)+' · sorties '+money(profile.cashOut)+' · '+String(profile.transactionCount)+' écriture(s).','hint'),el('p',profile.exportable?'Seuil d’agrégation atteint ; le partage reste soumis au consentement du groupe.':'Export externe bloqué : '+String((profile.exportBlockers??[]).join(', ')),'truth-notice'));market.append(p);
      }
      const agg=aggregateOffers(activeOffers);
      for(const [category,data] of agg.byCategory.slice(0,12)){
        const prices=data.knownPrices.filter(Number.isFinite),min=prices.length?Math.min(...prices):null,max=prices.length?Math.max(...prices):null;
        const card=el('article',undefined,'item');card.append(el('strong',category),el('p',data.count+' offre(s) · capacité déclarée '+String(data.capacity)+(min===null?' · prix sur devis / inconnu':' · prix unitaires connus '+money(min)+(max!==min?' à '+money(max):'')),'hint'));market.append(card);
      }
      if(!agg.byCategory.length)market.append(el('p','Aucune offre active à agréger.','empty-state'));
      if(!openNeeds.length)graph.append(el('p','Aucun besoin ouvert. Créez un besoin dans « Besoins · offres · approvisionnement gouverné ».','empty-state'));
      for(const need of openNeeds.slice(0,30)){
        const card=el('article',undefined,'item');const header=el('strong',need.title);card.append(header,el('small',state(need)+' · '+String(need.data?.quantity??'')+' '+String(need.data?.unit??'')+' · '+String(need.data?.category??'')));
        if(!['VALIDATED','PUBLISHED','MATCHED','PROCUREMENT_DRAFTED'].includes(state(need))){card.append(el('p','Besoin encore en brouillon : aucun matching n’est calculé avant validation humaine.','hint'));graph.append(card);continue;}
        const matches=await app.valueNeedMatches(need.id).catch(()=>[]);
        if(!matches.length)card.append(el('p','Aucune offre compatible selon les règles actuelles de catégorie, quantité, unité, zone, délai et budget.','hint'));
        for(const m of matches.slice(0,5)){
          const edge=el('div',undefined,'opportunity-edge'),offer=m.offer??{},d=offer.data??{};
          edge.append(el('strong','↳ '+String(offer.title??'Offre')),el('span','Score explicable '+String(m.score??'—')+'/100','pill'),el('p',(m.landedTotal===null||m.landedTotal===undefined?'Coût rendu incomplet':'Coût rendu '+money(m.landedTotal))+' · '+String(d.locality??'')+(m.reliability===null||m.reliability===undefined?' · fiabilité à documenter':' · fiabilité '+Math.round(Number(m.reliability)*100)+'%'),'hint'));
          const reasons=[...(m.explanations??[]),...(m.warnings??[])].slice(0,5);if(reasons.length)edge.append(el('p',reasons.join(' · '),'hint'));
          card.append(edge);
        }
        graph.append(card);
      }
    }catch(error){showError(error);graph.append(el('p','Intelligence d’opportunités indisponible : '+String(error?.message??error),'hint'));}
  };
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  document.addEventListener('eco:group-context-changed',()=>{if(root.open)void refresh();});
  return{refresh,open:()=>{root.open=true;root.scrollIntoView({behavior:'smooth',block:'start'});void refresh();}};
}
