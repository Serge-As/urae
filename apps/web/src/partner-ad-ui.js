const tr=(fr,en)=>document.documentElement.lang?.startsWith('en')?en:fr;
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);if(cls)n.className=cls;return n;};
export function mountPartnerAdsUI({app,isManager=()=>false,notify=()=>{},showError=console.error}={}){
 const managerPanel=document.getElementById('adManagerPanel');
 if(!managerPanel)return{refresh:async()=>{}};
 const host=el('section',undefined,'panel eco-partner-ads');host.id='partnerAdPanel';managerPanel.insertAdjacentElement('afterend',host);
 let version=0,urls=[];
 const clear=()=>{for(const url of urls)URL.revokeObjectURL(url);urls=[];};
 const refresh=async()=>{
  const gen=++version;clear();host.replaceChildren();
  if(!document.getElementById('view-ecosystem')?.classList.contains('active'))return;
  if(!app.activeGroup()){host.append(el('p',tr('Choisissez un groupe.','Choose a group.'),'hint'));return;}
  host.append(el('h2',tr('Cockpit annonceur et partenaire','Advertiser & partner cockpit')));
  host.append(el('p',tr('Une proposition n’est jamais publiée directement. Un autre responsable doit l’examiner puis AdManager conserve sa propre modération.','A proposal is never directly published. Another manager must review it and AdManager retains its moderation process.'),'truth-notice'));
  const form=el('form',undefined,'form-grid');
  const fields=[['title','Nom de la proposition','Proposal name','text'],['headline','Titre publicitaire','Advertising headline','text'],['body','Message publicitaire','Ad message','textarea'],['callToAction','Action demandée','Call to action','text'],['destinationRef','Destination interne (ex. deal:offre-1)','Internal destination (e.g. deal:offer-1)','text'],['locality','Localité (facultatif)','Locality (optional)','text']];
  for(const [name,fr,en,type] of fields){
   const label=el('label',tr(fr,en)),input=el(type==='textarea'?'textarea':'input');input.name=name;if(type!=='textarea')input.type=type;else input.rows=3;
   input.required=name!=='locality';input.maxLength=name==='body'?1000:230;label.append(input);form.append(label);
  }
  const objectiveLabel=el('label',tr('Objectif','Objective')),objective=el('select');objective.name='objective';
  for(const x of ['AWARENESS','COMMUNITY_JOIN','EVENT_RSVP','DEAL_OPEN','GROUP_BUY','LEAD','PARTNER_PROGRAM'])objective.append(new Option(x,x));
  objectiveLabel.append(objective);form.append(objectiveLabel);
  const mediaLabel=el('label',tr('Image facultative','Optional image')),media=el('select');media.name='mediaAssetId';
  media.append(new Option(tr('Sans image','No image'),''));
  mediaLabel.append(media,el('small',tr('Importez d’abord une image dans Studio médias → Proposition partenaire.','Upload the picture in Media Studio → Partner proposal first.'),'hint'));
  form.append(mediaLabel);
  const submit=el('button',tr('Soumettre pour examen','Submit for review'),'primary');submit.type='submit';form.append(submit);host.append(form);
  const list=el('div',undefined,'stack');host.append(el('h3',tr('Propositions et suivi','Proposals & tracking')),list);
  try{
   const [assets,proposals]=await Promise.all([app.visualMediaList().catch(()=>[]),app.partnerAdProposals()]);
   if(gen!==version)return;
   for(const x of assets.filter(a=>a.purpose==='PARTNER_CREATIVE'&&(isManager()||a.ownerId===app.currentActor())))media.append(new Option(x.name,x.id));
   if(!proposals.length)list.append(el('p',tr('Aucune proposition.','No proposals.'),'hint'));
   for(const p of proposals){
    const card=el('article',undefined,'item eco-partner-proposal'),state=String(p.data?.proposalState??'UNKNOWN');
    card.append(el('strong',p.title),el('span',state,'pill'),el('p',String(p.data?.headline??'')),
      el('p',String(p.data?.body??''),'hint'));
    if(p.data?.reviewNote)card.append(el('p',String(p.data.reviewNote),'hint'));
    if(p.data?.campaignId)card.append(el('p',tr('Brouillon AdManager : ','AdManager draft: ')+p.data.campaignId,'hint'));
    if(p.data?.mediaAssetId){
     const img=el('img',undefined,'eco-ad-creative-thumb');img.alt=String(p.data.headline??'');card.append(img);
     void app.visualMediaBlob(String(p.data.mediaAssetId)).then(blob=>{
      if(!img.isConnected||gen!==version)return;
      const url=URL.createObjectURL(blob);urls.push(url);img.src=url;
     }).catch(()=>img.remove());
    }
    if(isManager()&&state==='SUBMITTED'&&p.createdBy!==app.currentActor()){
     const actions=el('div',undefined,'actions');
     const approve=el('button',tr('Importer en brouillon','Import as draft'),'secondary');approve.type='button';
     approve.onclick=()=>void(async()=>{approve.disabled=true;
      try{await app.reviewPartnerAdProposal(p.id,'IMPORT');notify(tr('Brouillon créé, non publié.','Draft created, not published.'));document.dispatchEvent(new Event('eco:partner-ad-imported'));await refresh();}
      catch(error){showError(error);}finally{approve.disabled=false;}
     })();
     const reject=el('button',tr('Refuser','Reject'),'link-btn');reject.type='button';
     reject.onclick=()=>void(async()=>{const reason=window.prompt(tr('Motif du refus','Reason for rejection'))?.trim();if(!reason)return;
       try{await app.reviewPartnerAdProposal(p.id,'REJECT',reason);await refresh();}catch(error){showError(error);}
     })();
     actions.append(approve,reject);card.append(actions);
    }
    list.append(card);
   }
  }catch(error){list.append(el('p',tr('Indisponible : ','Unavailable: ')+String(error?.message??error),'hint'));}
  form.addEventListener('submit',event=>{event.preventDefault();void(async()=>{
   submit.disabled=true;
   try{await app.createPartnerAdProposal(Object.fromEntries(new FormData(form).entries()));notify(tr('Proposition transmise.','Proposal submitted.'));await refresh();}
   catch(error){showError(error);}finally{submit.disabled=false;}
  })();});
 };
 const update=()=>void refresh().catch(showError);
 window.addEventListener('eco:view-changed',event=>{if(event.detail?.view==='ecosystem')update();});
 for(const name of ['eco:group-context-changed','eco:language-changed','eco:visual-media-updated'])document.addEventListener(name,update);
 return{refresh};
}
