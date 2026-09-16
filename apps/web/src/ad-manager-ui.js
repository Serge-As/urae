const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const value=id=>String(document.getElementById(id)?.value??'').trim();
const split=v=>v.split(',').map(x=>x.trim()).filter(Boolean);

export function mountAdManagerUI({app,notify=()=>{},showError=console.error,isManager=()=>false,fmt=n=>String(n)}){
  const root=document.getElementById('adCampaignList'),form=document.getElementById('adCampaignForm');
  if(!root||!form)return{refresh:async()=>{}};
  const render=async()=>{
    root.replaceChildren();
    if(!app.activeGroup()){root.append(el('p','Sélectionnez un groupe pour gérer ses campagnes.','hint'));return;}
    if(!isManager()){root.append(el('p','AdManager est réservé aux responsables habilités du groupe.','hint'));return;}
    const campaigns=await app.adCampaigns();
    if(!campaigns.length){root.append(el('p','Aucune campagne. Créez un brouillon sandbox : aucun débit réel ne sera effectué.','hint'));return;}
    for(const c of campaigns){
      const card=el('article',undefined,'item');
      card.append(el('strong',c.name),el('span',c.state,'pill'));
      card.append(el('p',c.creative?.headline||''),el('small',[c.objective,fmt(c.budgetSandbox),c.placements?.join(' · ')].filter(Boolean).join(' · ')));
      const metrics=el('p','Impressions '+c.impressions+' · Ouvertures '+c.opens+' · Actions '+c.actions+' · Retours négatifs '+c.negativeFeedback,'hint');card.append(metrics);
      const actions=el('div',undefined,'actions');
      const next={DRAFT:'PENDING_REVIEW',PENDING_REVIEW:'APPROVED',APPROVED:'ACTIVE',ACTIVE:'PAUSED',PAUSED:'ACTIVE'}[c.state];
      if(next){
        const b=el('button',next==='PENDING_REVIEW'?'Soumettre à modération':next==='APPROVED'?'Approuver':next==='ACTIVE'?'Activer':'Mettre en pause',next==='ACTIVE'?'primary':'secondary');
        b.type='button';b.onclick=()=>void(async()=>{try{await app.transitionAdCampaign(c.id,next);notify('Campagne mise à jour.');await render();}catch(e){showError(e);}})();actions.append(b);
      }
      card.append(actions);root.append(card);
    }
  };
  form.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    const input={name:value('adCampaignName'),objective:value('adCampaignObjective'),budgetSandbox:Number(value('adCampaignBudget')||0),currency:'XAF',
      placements:split(value('adCampaignPlacements')||'FEED'),frequencyCapPer7Days:Number(value('adCampaignFrequency')||3),
      targeting:{localities:split(value('adCampaignLocalities')),interestTags:split(value('adCampaignInterests')),rubricKinds:split(value('adCampaignRubricKinds')),aggregateRubricVolumeBands:split(value('adCampaignVolumeBands'))},
      creative:{headline:value('adCampaignHeadline'),body:value('adCampaignBody'),callToAction:value('adCampaignCta'),destinationRef:value('adCampaignDestination')}};
    await app.createAdCampaign(input);notify('Brouillon AdManager créé en sandbox.');form.reset();document.getElementById('adCampaignFrequency').value='3';await render();
  }catch(err){showError(err);}})();});
  document.addEventListener('eco:group-context-changed',()=>void render().catch(showError));
  return{refresh:render};
}
