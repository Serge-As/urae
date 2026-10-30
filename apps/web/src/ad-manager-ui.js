const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const split=v=>v.split(',').map(x=>x.trim()).filter(Boolean);
const selected=id=>[...(document.getElementById(id)?.selectedOptions??[])].map(o=>o.value).filter(Boolean);

export function mountAdManagerUI({app,notify=()=>{},showError=console.error,isManager=()=>false,fmt=n=>String(n)}){
  const root=document.getElementById('adCampaignList'),form=document.getElementById('adCampaignForm');
  const kpis=document.getElementById('adKpis'),inventoryRoot=document.getElementById('adInventoryList'),houseRoot=document.getElementById('adHouseList'),prospectRoot=document.getElementById('adProspectList'),prospectForm=document.getElementById('adProspectForm');
  if(!root||!form)return{refresh:async()=>{}};
  document.addEventListener('eco:partner-ad-imported',()=>void render().catch(showError));
  document.addEventListener('eco:visual-media-updated',()=>void render().catch(showError));
  // Preview is a local projection of the existing media/campaign fields.
  // No campaign is activated, impression counted or money charged here.
  const preview=el('section',undefined,'ad-creative-preview item full');
  preview.setAttribute('aria-label',document.documentElement.lang==='en'?'Advertising draft preview':'Aperçu du brouillon publicitaire');
  const previewDisclosure=el('small','','eco-ad-disclosure'),
    previewTitle=el('strong','',''),previewBody=el('p','',''),
    previewAction=el('span','','pill'),previewPlacements=el('small','','hint'),
    previewImage=el('img','','ad-creative-preview-image');
  previewImage.alt='';previewImage.loading='lazy';previewImage.hidden=true;
  const previewMediaAction=el('button',document.documentElement.lang==='en'?'Manage images':'Gérer les images','secondary');
  previewMediaAction.type='button';
  previewMediaAction.onclick=()=>{
    const studio=document.getElementById('ecoVisualMediaStudio');
    if(!studio)return;
    for(let parent=studio.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    studio.scrollIntoView({behavior:'smooth',block:'start'});
    studio.querySelector('input[type="file"]')?.focus({preventScroll:true});
  };
  preview.append(previewDisclosure,previewImage,previewTitle,previewBody,previewAction,previewPlacements,previewMediaAction);
  form.insertBefore(preview,form.querySelector('button.primary'));
  let previewUrl='',previewGeneration=0;
  const clearPreviewImage=()=>{
    previewGeneration++;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}
    previewImage.hidden=true;previewImage.removeAttribute('src');
  };
  const paintPreview=()=>{
    const en=document.documentElement.lang==='en';
    previewDisclosure.textContent=en?'Sponsored content · draft only':'Contenu sponsorisé · aperçu non publié';
    previewTitle.textContent=value('adCampaignHeadline')||(en?'Your campaign headline':'Le titre de votre campagne');
    previewBody.textContent=value('adCampaignBody')||(en?'Your message will appear here.':'Votre message apparaîtra ici.');
    previewAction.textContent=value('adCampaignCta')||(en?'Action':'Action');
    const option=document.getElementById('adCampaignPlacements');
    const placements=[...(option?.selectedOptions??[])].map(o=>o.textContent.trim());
    previewPlacements.textContent=(en?'Planned placements: ':'Emplacements envisagés : ')+(placements.join(' · ')||(en?'not selected':'non sélectionnés'));
  };
  const loadPreviewImage=async()=>{
    clearPreviewImage();const id=value('adCampaignMedia'),generation=previewGeneration;
    if(!id||navigator.onLine===false)return;
    try{
      const blob=await app.visualMediaBlob(id);
      if(generation!==previewGeneration||value('adCampaignMedia')!==id)return;
      previewUrl=URL.createObjectURL(blob);previewImage.src=previewUrl;previewImage.hidden=false;
    }catch{/* Protected or unavailable media are not represented as published. */}
  };
  form.addEventListener('input',paintPreview);
  form.addEventListener('change',event=>{
    paintPreview();if(event.target?.id==='adCampaignMedia')void loadPreviewImage();
  });
  paintPreview();
    let imageUrls=[];
  const clearImages=()=>{for(const url of imageUrls)URL.revokeObjectURL(url);imageUrls=[];};

  const metric=(label,value)=>{const c=el('article',undefined,'metric');c.append(el('strong',String(value)),el('span',label));return c;};
  const renderKpis=data=>{
    if(!kpis)return;kpis.replaceChildren();
    const x=data?.kpis??{};
    kpis.append(metric('Campagnes',x.campaigns??0),metric('Actives',x.active??0),metric('Impressions',x.impressions??0),metric('Actions',x.actions??0),metric('Taux action',((x.actionRate??0)*100).toFixed(1)+'%'),metric('Retours négatifs',x.negativeFeedback??0));
  };

  const renderCampaigns=async campaigns=>{
    clearImages();root.replaceChildren();
    if(!campaigns.length){root.append(el('p','Aucune campagne. Créez un brouillon sandbox : aucun débit réel ne sera effectué.','hint'));return;}
    for(const c of campaigns){
      const card=el('article',undefined,'item ad-campaign-card');
      card.append(el('strong',c.name),el('span',c.state,'pill'));
      card.append(el('p',c.creative?.headline||''),el('small',[c.objective,fmt(c.budgetSandbox),c.placements?.join(' · ')].filter(Boolean).join(' · ')));
      if(c.creative?.mediaAssetId){
        const picture=el('img');picture.className='eco-ad-creative-thumb';picture.alt=c.creative.headline||'Advertising visual';
        card.append(picture);
        void app.visualMediaBlob(c.creative.mediaAssetId).then(blob=>{
          if(!picture.isConnected)return;
          const url=URL.createObjectURL(blob);imageUrls.push(url);picture.src=url;
        }).catch(()=>{picture.remove();});
      }
      card.append(el('p','Impressions '+c.impressions+' · Ouvertures '+c.opens+' · Actions '+c.actions+' · Retours négatifs '+c.negativeFeedback,'hint'));
      const budget=el('dl',undefined,'eco-ad-budget');for(const[label,value]of [['Budget autorisé de simulation',fmt(Number(c.budgetSandbox??0))],['Dépenses financières réelles','Non activées · argent réel désactivé'],['Période',[c.startsAt,c.endsAt].filter(Boolean).map(x=>new Date(x).toLocaleDateString()).join(' → ')||'À préciser'],['Audience autorisée',Object.entries(c.targeting??{}).map(([k,v])=>k+' : '+(Array.isArray(v)?v.join(', '):String(v))).join(' · ')||'Contexte du groupe'],['Source des résultats','Compteurs AdManager · impressions, ouvertures et actions constatées']]){budget.append(el('dt',label),el('dd',value));}card.append(budget);
      const actions=el('div',undefined,'actions');
      const next={DRAFT:'PENDING_REVIEW',PENDING_REVIEW:'APPROVED',APPROVED:'ACTIVE',ACTIVE:'PAUSED',PAUSED:'ACTIVE'}[c.state];
      if(next){
        const b=el('button',next==='PENDING_REVIEW'?'Soumettre à modération':next==='APPROVED'?'Approuver':next==='ACTIVE'?'Activer':'Mettre en pause',next==='ACTIVE'?'primary':'secondary');
        b.type='button';b.onclick=()=>void(async()=>{try{await app.transitionAdCampaign(c.id,next);notify('Campagne mise à jour.');document.dispatchEvent(new Event('eco:ad-campaign-state-changed'));await render();}catch(e){showError(e);}})();actions.append(b);
      }
      card.append(actions);root.append(card);
    }
  };

  const renderInventory=data=>{
    if(!inventoryRoot)return;inventoryRoot.replaceChildren();
    for(const p of data?.inventory??[]){
      const card=el('article',undefined,'ad-placement-card');card.append(el('strong',p.labelFr),el('span',p.paid?'Payant possible':'House Ads','pill'));
      card.append(el('p',p.reason),el('p','Densité : '+p.maxDensity,'hint'),el('p','Mode faible-data : '+p.lowData,'hint'));inventoryRoot.append(card);
    }
  };

  const renderHouse=(data,housePlan)=>{
    if(!houseRoot)return;houseRoot.replaceChildren();
    const context=housePlan?.context,plan=housePlan?.plan??[];
    if(context){
      const note=el('article',undefined,'truth-notice');
      note.append(el('strong','Composition calculée pour ce groupe'),document.createTextNode(' · étape '+String(plan[0]?.stage??'—')+(context.monthsToExerciseEnd!==undefined?' · '+context.monthsToExerciseEnd.toFixed(1)+' mois estimés avant fin':'')+' · '+(context.rubricNames??[]).join(', ')));
      houseRoot.append(note);
    }
    for(const h of plan.length?plan:data?.houseAds??[]){
      const card=el('article',undefined,'ad-placement-card house-ad-card');
      card.append(el('strong',h.headline),el('span',h.score!==undefined?'score '+Math.round(h.score):h.objective,'pill'));
      card.append(el('p',h.body),el('p',(h.reasonCodes??[]).join(' · '),'hint'),el('small','CTA : '+h.callToAction+' · '+h.destinationRef));houseRoot.append(card);
    }
  };

  const prospectNext={DISCOVERED:'CONTACT_CANDIDATE',CONTACT_CANDIDATE:'CONTACTED',CONTACTED:'QUALIFIED',QUALIFIED:'PROPOSAL',PROPOSAL:'WON'};
  const prospectLabel={DISCOVERED:'Repéré',CONTACT_CANDIDATE:'À contacter',CONTACTED:'Contacté',QUALIFIED:'Qualifié',PROPOSAL:'Proposition',WON:'Gagné',LOST:'Perdu'};
  const renderProspects=prospects=>{
    if(!prospectRoot)return;prospectRoot.replaceChildren();
    if(!prospects?.length){prospectRoot.append(el('p','Aucun prospect. Ajoutez une organisation à partir d’une source publique, d’un salon, d’une recommandation ou d’une demande entrante.','hint'));return;}
    for(const p of prospects){
      const card=el('article',undefined,'item');card.append(el('strong',p.organization),el('span',prospectLabel[p.state]??p.state,'pill'));
      card.append(el('p',[p.category,p.locality,p.estimatedMonthlyBudget?fmt(p.estimatedMonthlyBudget):''].filter(Boolean).join(' · ')),el('small',p.note||p.sourceRef||''));
      const actions=el('div',undefined,'actions'),next=prospectNext[p.state];
      if(next){const b=el('button','Passer à « '+(prospectLabel[next]??next)+' »','secondary');b.type='button';b.onclick=()=>void(async()=>{try{await app.transitionAdProspect(p.id,next);notify('Prospect mis à jour.');await render();}catch(e){showError(e);}})();actions.append(b);}
      if(!['WON','LOST'].includes(p.state)){const lost=el('button','Classer perdu','link-btn');lost.type='button';lost.onclick=()=>void(async()=>{try{await app.transitionAdProspect(p.id,'LOST');await render();}catch(e){showError(e);}})();actions.append(lost);}
      card.append(actions);prospectRoot.append(card);
    }
  };

  const render=async()=>{
    root.replaceChildren();kpis?.replaceChildren();inventoryRoot?.replaceChildren();houseRoot?.replaceChildren();prospectRoot?.replaceChildren();
    if(!app.activeGroup()){root.append(el('p','Sélectionnez un groupe pour gérer sa régie.','hint'));return;}
    if(!isManager()){root.append(el('p','AdManager est réservé aux responsables habilités du groupe.','hint'));return;}
    const [dashboard,housePlan,media]=await Promise.all([app.adDashboard(),app.adHousePlan(),app.visualMediaList().catch(()=>[])]);
    const mediaSelect=document.getElementById('adCampaignMedia');
    if(mediaSelect){
      const choice=mediaSelect.value;
      mediaSelect.replaceChildren(new Option(document.documentElement.lang==='en'?'No image':'Sans image',''));
      for(const asset of media.filter(x=>x.purpose==='AD_CREATIVE'))mediaSelect.append(new Option(asset.name,asset.id));
      if([...mediaSelect.options].some(x=>x.value===choice))mediaSelect.value=choice;
    }
    renderKpis(dashboard);await renderCampaigns(dashboard.campaigns??[]);renderInventory(dashboard);renderHouse(dashboard,housePlan);renderProspects(dashboard.prospects??[]);
  };

  form.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    const placements=selected('adCampaignPlacements');
    const input={name:value('adCampaignName'),objective:value('adCampaignObjective'),budgetSandbox:Number(value('adCampaignBudget')||0),currency:'XAF',
      placements:placements.length?placements:['FEED_NATIVE'],frequencyCapPer7Days:Number(value('adCampaignFrequency')||3),
      targeting:{localities:split(value('adCampaignLocalities')),interestTags:split(value('adCampaignInterests')),rubricKinds:split(value('adCampaignRubricKinds')),aggregateRubricVolumeBands:split(value('adCampaignVolumeBands'))},
      creative:{headline:value('adCampaignHeadline'),body:value('adCampaignBody'),callToAction:value('adCampaignCta'),destinationRef:value('adCampaignDestination'),...(value('adCampaignMedia')?{mediaAssetId:value('adCampaignMedia')}:{})}};
    await app.createAdCampaign(input);notify('Brouillon AdManager créé en sandbox.');form.reset();document.getElementById('adCampaignFrequency').value='3';clearPreviewImage();paintPreview();await render();
  }catch(err){showError(err);}})();});

  prospectForm?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    await app.createAdProspect({organization:value('adProspectOrganization'),category:value('adProspectCategory'),locality:value('adProspectLocality'),sourceRef:value('adProspectSource'),publicContact:value('adProspectContact'),estimatedMonthlyBudget:Number(value('adProspectBudget')||0),note:value('adProspectNote')});
    prospectForm.reset();notify('Prospect ajouté à la régie.');await render();
  }catch(err){showError(err);}})();});

  document.querySelectorAll('[data-adops-tab]').forEach(button=>button.addEventListener('click',()=>{
    const tab=button.dataset.adopsTab;document.querySelectorAll('[data-adops-tab]').forEach(b=>b.classList.toggle('active',b===button));
    document.querySelectorAll('[data-adops-panel]').forEach(p=>p.hidden=p.dataset.adopsPanel!==tab);
  }));
  document.getElementById('adHouseAIBtn')?.addEventListener('click',()=>void(async()=>{try{
    const status=document.getElementById('adHouseAIStatus');if(status)status.textContent='Composition IA en cours — contexte agrégé uniquement…';
    const data=await app.adHouseVariants();
    if(houseRoot){houseRoot.replaceChildren();
      for(const h of data.variants??[]){const card=el('article',undefined,'ad-placement-card house-ad-card');card.append(el('strong',h.headline),el('span',h.source==='WORKERS_AI'?'IA contextualisée':'Repli déterministe','pill'),el('p',h.body),el('small','CTA : '+h.callToAction+' · '+h.key));houseRoot.append(card);}
    }
    if(status)status.textContent=data.aiUsed?'Variantes Workers AI générées via AI Gateway. Le classement métier reste déterministe.':('Repli sans IA utilisé. '+(data.warning??''));
    notify(data.aiUsed?'4 variantes House Ads générées par IA.':'Variantes déterministes utilisées sans bloquer la régie.');
  }catch(e){showError(e);}})());
  document.getElementById('adManagerRefreshBtn')?.addEventListener('click',()=>void render().catch(showError));
  document.addEventListener('eco:group-context-changed',()=>{clearPreviewImage();void render().catch(showError);});
  return{refresh:render};
}
