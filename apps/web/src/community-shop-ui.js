import {openForumDecision} from './forum-decision-ui.js';
import {openWhatsAppShare,focusEcoShareTarget} from './share-out.js';
const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const v=id=>String(document.getElementById(id)?.value??'').trim();
const split=value=>value.split(',').map(x=>x.trim()).filter(Boolean);
const row=(label,value)=>{const p=el('p');const b=el('strong',label+' : ');p.append(b,document.createTextNode(String(value??'—')));return p;};

export function mountCommunityShopUI({app,notify=()=>{},showError=console.error,isManager=()=>false,fmt=n=>String(n),actorName=id=>id}){
  const scope=()=>JSON.stringify([app.currentActor?.(),app.currentTenant?.(),app.activeGroup()]);
  let hubs=[],activeHub='',beforeCursor='',draftTimer,readTimer,observer,loadingPosts=false,forumTypingTimer=0,lastForumTypingSignal=0;
  const hubList=document.getElementById('communityHubList'),postList=document.getElementById('communityPostList'),hubSelect=document.getElementById('communityPostHub'),storefront=document.getElementById('groupStorefront');
  const bodyInput=document.getElementById('communityPostBody'),titleInput=document.getElementById('communityPostTitle'),draftState=document.getElementById('communityDraftState'),readState=document.getElementById('communityReadState');
  let livePresence=document.getElementById('communityLivePresence');
  if(!livePresence&&draftState){livePresence=el('p','', 'hint full community-live-presence');livePresence.id='communityLivePresence';livePresence.hidden=true;draftState.insertAdjacentElement('afterend',livePresence);}

  const syncDraft=async()=>{
    if(!activeHub||!app.activeGroup()||!bodyInput)return;
    const at=scope(),hub=activeHub;
    try{const state=await app.saveForumDraft(hub,titleInput?.value??'',bodyInput.value??'');if(scope()===at&&hub===activeHub&&draftState)draftState.textContent=(state.localPending?'Brouillon local · en attente de connexion · ':'Brouillon synchronisé · ')+new Date(state.updatedAt).toLocaleTimeString('fr-FR');}
    catch(e){if(scope()===at&&hub===activeHub&&draftState)draftState.textContent='Brouillon conservé localement · synchronisation à reprendre';}
  };
  const queueDraft=()=>{if(activeHub)void app.saveForumDraftLocal?.(activeHub,titleInput?.value??'',bodyInput?.value??'').catch(showError);clearTimeout(draftTimer);if(draftState)draftState.textContent='Synchronisation du brouillon…';draftTimer=setTimeout(()=>void syncDraft(),650);};

  const forumSignalPayload=()=>({kind:'COMMUNITY_DRAFT',hubId:activeHub});
  const stopForumTyping=()=>{if(forumTypingTimer){clearTimeout(forumTypingTimer);forumTypingTimer=0;}if(activeHub)void app.publishLiveSignal?.('TYPING_STOP',forumSignalPayload()).catch(()=>{});};
  const signalForumTyping=()=>{
    if(!activeHub)return;const now=Date.now();
    if(now-lastForumTypingSignal>=800){lastForumTypingSignal=now;void app.publishLiveSignal?.('TYPING',forumSignalPayload()).catch(()=>{});}
    if(forumTypingTimer)clearTimeout(forumTypingTimer);forumTypingTimer=setTimeout(stopForumTyping,2500);
  };

  const restoreState=async(scroll=true)=>{
    if(!activeHub)return null;
    const at=scope(),hub=activeHub;
    try{
      const state=await app.forumUserState(hub);if(scope()!==at||hub!==activeHub)return null;
      if(bodyInput&&document.activeElement!==bodyInput&&bodyInput.value!==state.draftBody)bodyInput.value=state.draftBody??'';
      if(titleInput&&document.activeElement!==titleInput&&titleInput.value!==state.draftTitle)titleInput.value=state.draftTitle??'';
      if(draftState)draftState.textContent=state.draftBody?(state.localPending?'Brouillon local restauré · ':'Brouillon serveur restauré · ')+new Date(state.updatedAt).toLocaleString('fr-FR'):'Aucun brouillon en attente.';
      if(readState)readState.textContent=state.lastReadMessageId?'Dernière position mémorisée : '+new Date(state.lastReadAt??state.updatedAt).toLocaleString('fr-FR'):'Aucune position de lecture mémorisée.';
      if(scroll&&state.anchorMessageId)requestAnimationFrame(()=>document.querySelector('[data-forum-message-id="'+CSS.escape(state.anchorMessageId)+'"]')?.scrollIntoView({block:'center'}));
      return state;
    }catch{return null;}
  };

  const observeReadPositions=()=>{
    observer?.disconnect();if(!postList||!activeHub||typeof IntersectionObserver==='undefined')return;
    observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting&&x.intersectionRatio>=.6).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      const last=visible[visible.length-1];if(!last)return;const id=last.target.dataset.forumMessageId;if(!id)return;
      clearTimeout(readTimer);readTimer=setTimeout(()=>void(async()=>{try{await app.saveForumReadPosition(activeHub,id,.6);if(readState)readState.textContent='Position mémorisée automatiquement.';}catch{}})(),700);
    },{threshold:[.6]});
    for(const node of postList.querySelectorAll('[data-forum-message-id]'))observer.observe(node);
  };

  let forumPhotosByPost={},groupPortraits={},forumMediaUrls=[];
  const cleanForumUrls=()=>{for(const url of forumMediaUrls)URL.revokeObjectURL(url);forumMediaUrls=[];};
  const paintForumImage=(target,assetId,className)=>{
    if(!assetId)return;
    const img=el('img',undefined,className);img.alt='Photo partagée';img.loading='lazy';img.decoding='async';target.append(img);
    void app.visualMediaBlob(assetId).then(blob=>{
      if(!img.isConnected)return;
      const url=URL.createObjectURL(blob);forumMediaUrls.push(url);img.src=url;
    }).catch(()=>img.remove());
  };
  const renderRealtimeMessage=(post)=>{
    const card=el('article',undefined,'item');card.dataset.forumMessageId=post.id;card.dataset.ecoShareKind='forum-message';card.dataset.ecoShareId=post.id;
    if(post.parentId)card.append(el('span','↳ Réponse','pill'));
    const avatarId=groupPortraits[post.authorId];
    if(avatarId)paintForumImage(card,avatarId,'eco-forum-avatar');
    card.append(el('strong',post.title||post.kind),el('p',post.body??''),el('small',new Date(post.createdAt).toLocaleString('fr-FR')+' · auteur '+post.authorId));
    const mediaId=forumPhotosByPost[post.id];
    if(mediaId){
      paintForumImage(card,mediaId,'eco-forum-post-photo');
      if(post.authorId===app.currentActor()){
        const detach=el('button','Retirer ma photo','link-btn');
        detach.type='button';
        detach.onclick=()=>void app.assignForumPhoto(post.id,'').then(()=>renderPosts({preserveDraft:true,around:post.id})).catch(showError);
        card.append(detach);
      }
    }
    const actions=el('div',undefined,'actions');
    for(const reaction of ['👍','❤️','😂','👏']){
      const active=(post.viewerReactions??[]).includes(reaction),count=Number(post.reactions?.[reaction]??0);
      const b=el('button',reaction+(count?' '+count:''),active?'primary':'link-btn');b.type='button';b.onclick=()=>void(async()=>{try{await app.toggleForumReaction(post.id,reaction);await renderPosts({preserveDraft:true,around:post.id});}catch(e){showError(e);}})();actions.append(b);
    }
    const reply=el('button','Répondre','secondary');reply.type='button';reply.onclick=()=>{if(bodyInput){bodyInput.dataset.replyTo=post.id;bodyInput.focus();bodyInput.placeholder='Réponse à ce message…';}notify('Votre prochain message répondra à celui-ci.');};actions.append(reply);
    // Forum -> economic owner is a draft handoff, never a purchase, commitment,
    // finance write, or automatic publication. Only the current group can act.
    if((post.kind==='OFFER'||(post.kind==='REQUEST'&&isManager()))&&!post.parentId){
      const en=document.documentElement.lang?.startsWith('en');
      const opportunity=el('button',post.kind==='REQUEST'?(en?'Structure this need':'Structurer ce besoin'):(en?'Offer this service':'Proposer ce service'),'secondary');
      opportunity.type='button';
      opportunity.onclick=()=>{
        const groupId=app.activeGroup();
        if(!groupId)return;
        window.dispatchEvent(new CustomEvent('eco:forum-opportunity-intent',{detail:{
          groupId,hubId:activeHub,messageId:post.id,kind:String(post.kind),
          title:String(post.title??''),body:String(post.body??'')
        }}));
      };
      actions.append(opportunity);
    }if(isManager()){const decision=el('button','Préparer une décision et son suivi','secondary');decision.type='button';decision.onclick=()=>void openForumDecision({app,post,hubId:activeHub,notify,showError}).catch(showError);actions.append(decision);}const share=el('button','Partager WhatsApp','secondary');share.type='button';share.onclick=()=>{const payload=openWhatsAppShare({view:'ecosystem',anchor:'communityEnginePanel',kind:'forum-message',groupId:app.activeGroup(),objectId:post.id,contextId:activeHub,title:'Publication Eco-System',summary:'Ouvrir cette publication dans Eco-System.'});notify('WhatsApp ouvert · '+payload.refCode);};actions.append(share);card.append(actions);return card;
  };

  const renderPosts=async(options={})=>{
    if(!postList||!activeHub||loadingPosts){if(!activeHub)postList?.replaceChildren();return;}loadingPosts=true;
    const at=scope(),hub=activeHub;
    try{
      const state=await restoreState(false);if(scope()!==at||hub!==activeHub)return;
      const query={limit:60};if(options.around)query.around=options.around;else if(!options.latest&&state?.anchorMessageId)query.around=state.anchorMessageId;
      const [data,pictures,profiles]=await Promise.all([
        app.forumMessages(activeHub,query),
        app.forumPhotoMap(activeHub).catch(()=>({})),
        app.groupProfilePhotos().catch(()=>({}))
      ]);
      if(scope()!==at||hub!==activeHub)return;
      cleanForumUrls();forumPhotosByPost=pictures;groupPortraits=profiles;
      postList.replaceChildren();beforeCursor=data.nextBefore??'';
      if(!data.messages?.length)postList.append(el('p','Aucun message dans ce Hub. Votre brouillon reste synchronisé jusqu’à publication.','hint'));
      for(const post of data.messages??[])postList.append(renderRealtimeMessage(post));
      observeReadPositions();
      if(state?.anchorMessageId&&!options.latest)requestAnimationFrame(()=>postList.querySelector('[data-forum-message-id="'+CSS.escape(state.anchorMessageId)+'"]')?.scrollIntoView({block:'center'}));
    }catch(error){
      if(scope()!==at||hub!==activeHub)return;
      // Compatibility fallback for data created before Forum v2.
      try{const posts=await app.listCommunityPosts(hub);if(scope()!==at||hub!==activeHub)return;postList.replaceChildren();for(const post of posts){const card=el('article',undefined,'item');card.append(el('strong',post.title),row('Type',post.data?.postKind),el('p',post.summary??''),row('État',post.data?.moderationState));postList.append(card);}if(!posts.length)postList.append(el('p','Aucune publication dans ce Hub.','hint'));}catch(e){if(scope()===at)showError(error);}
    }finally{loadingPosts=false;}
  };

  const loadOlder=async()=>{
    if(!beforeCursor||!activeHub||loadingPosts)return;loadingPosts=true;
    try{const top=postList.firstElementChild,oldHeight=postList.scrollHeight,data=await app.forumMessages(activeHub,{limit:60,before:beforeCursor});beforeCursor=data.nextBefore??beforeCursor;for(const post of [...(data.messages??[])].reverse())postList.prepend(renderRealtimeMessage(post));observeReadPositions();if(top)window.scrollBy(0,postList.scrollHeight-oldHeight);}catch(e){showError(e);}finally{loadingPosts=false;}
  };

  const renderHubs=async()=>{
    if(!hubList||!hubSelect||!app.activeGroup())return;
    const at=scope(),next=await app.listCommunityHubs();if(scope()!==at)return;hubs=next;hubList.replaceChildren();hubSelect.replaceChildren();
    if(!hubs.length){hubList.append(el('p','Aucun Hub. Créez un espace thématique pour démarrer une communauté.','hint'));hubSelect.append(new Option('Aucun Hub',''));activeHub='';postList?.replaceChildren();return;}
    for(const hub of hubs){
      hubSelect.append(new Option(hub.title,hub.id));
      const card=el('article',undefined,'item');card.append(el('strong',hub.title),row('Visibilité',hub.data?.visibility),row('Modération',hub.data?.moderation));
      const open=el('button','Ouvrir et reprendre où je me suis arrêté','secondary');open.type='button';open.onclick=()=>{activeHub=hub.id;hubSelect.value=hub.id;void renderPosts();};card.append(open);hubList.append(card);
    }
    if(!activeHub||!hubs.some(x=>x.id===activeHub))activeHub=hubs[0].id;hubSelect.value=activeHub;await renderPosts();
  };

  let marketVisualRender=0;
  let stockPhotoUrls=[];
  const releaseStockPhotos=()=>{for(const url of stockPhotoUrls)URL.revokeObjectURL(url);stockPhotoUrls=[];};
  const decorateStockPhoto=(card,id,token)=>{
    if(!id)return;
    const image=el('img',undefined,'eco-market-product-photo');
    image.alt=document.documentElement.lang==='en'?'Product photo':'Photo du produit';
    image.loading='lazy';image.decoding='async';
    card.prepend(image);
    void app.visualMediaBlob(id).then(blob=>{
      if(marketVisualRender!==token||!card.isConnected)return;
      const url=URL.createObjectURL(blob);stockPhotoUrls.push(url);image.src=url;
    }).catch(()=>image.remove());
  };
  const renderStorefront=async()=>{
    const token=++marketVisualRender,at=scope();
    releaseStockPhotos();
    if(!storefront||!app.activeGroup())return;storefront.replaceChildren();
    const [data,visuals]=await Promise.all([app.groupStorefront(),app.marketStockVisuals().catch(()=>({}))]);
    if(scope()!==at||token!==marketVisualRender)return;
    if(token!==marketVisualRender)return;
    const overview=el('section',undefined,'eco-commerce-overview');overview.append(el('span','BOUTIQUE DU GROUPE','eyebrow'),el('h3','Du catalogue à la remise effective'),el('p','Un devis prépare la commande ; une commande ne prouve pas son paiement. Les stocks et livraisons restent ceux du moteur Marketplace.','hint'));
    const stats=el('div',undefined,'metrics small');for(const [value,label]of [[(data.items??[]).length,'Articles publiés'],[(data.items??[]).filter(x=>x.availableNow&&x.available>0).length,'Disponibles maintenant'],[(data.items??[]).filter(x=>!(x.available>0)).length,'À réapprovisionner']]){const metric=el('div',undefined,'metric');metric.append(el('strong',String(value)),el('span',label));stats.append(metric);}overview.append(stats);const work=el('button','Commandes, préparation, remises et litiges','primary');work.type='button';work.dataset.moduleOpen='MARKETPLACE.CORE';overview.append(work);storefront.append(overview);
    if(data.shop){
      const head=el('article',undefined,'item');head.append(el('strong',data.shop.name),row('Slogan',data.shop.tagline||'—'),row('Visibilité',data.shop.visibility),row('Localité',data.shop.locality||'—'),row('Catégories',(data.shop.categories??[]).join(', ')||'—'));storefront.append(head);
      const name=document.getElementById('groupShopName'),tag=document.getElementById('groupShopTagline'),vis=document.getElementById('groupShopVisibility'),loc=document.getElementById('groupShopLocality'),cats=document.getElementById('groupShopCategories');
      if(name)name.value=data.shop.name??'';if(tag)tag.value=data.shop.tagline??'';if(vis)vis.value=data.shop.visibility??'GROUP_ONLY';if(loc)loc.value=data.shop.locality??'';if(cats)cats.value=(data.shop.categories??[]).join(', ');
    }else storefront.append(el('p','La boutique n’est pas encore configurée.','hint'));
    for(const item of data.items??[]){
      const card=el('article',undefined,'item');decorateStockPhoto(card,visuals[item.id],token);card.append(el('strong',item.name),row('SKU',item.sku),row('Nature',item.ownership==='POT_RESERVED'?'Réservé pot / tontine':item.ownership==='CONSIGNMENT'?'Consignation':item.ownership==='DEPOSIT_SALE'?'Dépôt-vente':'Commercial'),row('Disponible',item.available+' '+item.unit),row('Prix',fmt(item.unitPrice)),row('Description',item.description||'—'),row('Variante',item.variant||'—'),row('Conditions de remise',item.deliveryTerms||'À convenir'),row('Disponibilité datée',[item.availableAt,item.availableUntil].filter(Boolean).join(' → ')||'Sans restriction datée'));
      if(isManager()&&item.availableNow&&item.available>0){const order=el('button','Préparer un devis ou une commande','secondary');order.type='button';order.onclick=()=>{const panel=document.getElementById('marketEnginePanel');if(panel){panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'start'});const select=document.getElementById('orderStockItem');if(select)select.value=item.id;}};card.append(order);}else if(!item.availableNow)card.append(el('p','Cet article ne peut pas être réservé à cette date.','truth-notice'));storefront.append(card);
    }
    if(isManager()){
      const records=await app.listWorkspaceRecords('MARKETPLACE.CORE',app.activeGroup());
      if(scope()!==at||token!==marketVisualRender)return;
      const stocks=records.filter(x=>x.data?.marketKind==='STOCK_ITEM');
      if(stocks.length){const manage=el('section',undefined,'stack');manage.append(el('h4','Publication des articles du stock'));for(const item of stocks){
        const ownership=String(item.data.ownership??'COMMERCIAL'),card=el('article',undefined,'item');decorateStockPhoto(card,visuals[item.id],token);card.append(el('strong',item.title),row('Disponible à vendre',Number(item.data.quantity)-Number(item.data.reserved??0)-Number(item.data.quarantine??0)),row('En quarantaine',Number(item.data.quarantine??0)),row('Nature',ownership==='POT_RESERVED'?'Réservé pot / tontine':ownership==='CONSIGNMENT'?'Consignation':ownership==='DEPOSIT_SALE'?'Dépôt-vente':'Commercial'),row('Vitrine',item.data.published?'Publié':'Masqué'));
        const photoForm=document.createElement('form');photoForm.className='eco-stock-photo-form';
        const photoInput=document.createElement('input');photoInput.type='file';photoInput.accept='image/jpeg,image/png,image/webp';
        photoInput.required=true;photoInput.setAttribute('aria-label',document.documentElement.lang==='en'?'Product photo':'Photo du produit');
        const upload=el('button',document.documentElement.lang==='en'?'Add or replace photo':'Ajouter / remplacer la photo','secondary');
        upload.type='submit';photoForm.append(photoInput,upload);
        photoForm.onsubmit=event=>{event.preventDefault();void(async()=>{
          const file=photoInput.files?.[0];if(!file)return;
          upload.disabled=true;
          try{
            const media=await app.uploadVisualMedia(file,'MARKET_PRODUCT');
            await app.setMarketStockVisual(item.id,media.id);
            notify(document.documentElement.lang==='en'?'Product photo saved.':'Photo de produit enregistrée.');
            await renderStorefront();
          }catch(error){showError(error);}finally{upload.disabled=false;}
        })();};
        card.append(photoForm);
        if(visuals[item.id]){
          const removePhoto=el('button',document.documentElement.lang==='en'?'Remove photo':'Retirer la photo','link-btn');
          removePhoto.type='button';
          removePhoto.onclick=()=>void app.setMarketStockVisual(item.id,'').then(()=>renderStorefront()).catch(showError);
          card.append(removePhoto);
        }
        if(ownership!=='POT_RESERVED'){const toggle=el('button',item.data.published?'Retirer de la vitrine':'Publier dans la vitrine',item.data.published?'secondary':'primary');toggle.type='button';
          toggle.onclick=()=>void(async()=>{try{let price=Number(item.data.unitPrice??0);if(!item.data.published){const raw=window.prompt('Prix unitaire XAF :',String(price||0));if(raw===null)return;price=Math.max(0,Math.trunc(Number(raw)||0));}await app.setStockListing(item.id,{published:!Boolean(item.data.published),unitPrice:price,description:String(item.data.description??'')});notify('Vitrine mise à jour.');await renderStorefront();}catch(e){showError(e);}})();card.append(toggle);
        }else card.append(el('p','Ce stock appartient au pot/tontine : la vente commerciale est bloquée par le moteur.','truth-notice'));
        manage.append(card);
      }storefront.append(manage);}

      const supply=el('section',undefined,'stack');supply.append(el('h4','Fournisseurs · approvisionnement · crédit'));
      supply.append(el('p','Le coût rendu = marchandises + transport + autres coûts. Le débiteur est toujours identifié. Une dette du groupe ne peut être marquée payée sans référence à une écriture du Ledger.','truth-notice'));
      const toolbar=el('div',undefined,'actions');
      const addSupplier=el('button','Ajouter un fournisseur','secondary');addSupplier.type='button';addSupplier.onclick=()=>void(async()=>{try{
        const name=window.prompt('Nom du fournisseur :')?.trim();if(!name)return;const locality=window.prompt('Localité :')?.trim()??'',terms=window.prompt('Conditions de paiement :')?.trim()??'';
        await app.registerMarketSupplier({name,locality,paymentTerms:terms});notify('Fournisseur enregistré.');await renderStorefront();
      }catch(e){showError(e);}})();toolbar.append(addSupplier);supply.append(toolbar);
      try{
        const state=await app.marketProcurement();
        if(scope()!==at||token!==marketVisualRender)return;
        for(const supplier of state.suppliers??[]){
          const card=el('article',undefined,'item');card.append(el('strong',supplier.title),row('Localité',supplier.data.locality||'—'),row('Conditions',supplier.data.paymentTerms||'—'));
          const order=el('button','Créer un approvisionnement','primary');order.type='button';order.onclick=()=>void(async()=>{try{
            const label=window.prompt('Produit / service acheté :')?.trim();if(!label)return;
            const quantity=Math.max(1,Math.trunc(Number(window.prompt('Quantité :','1')??1))),unitCost=Math.max(0,Math.trunc(Number(window.prompt('Coût unitaire XAF :','0')??0)));
            const freight=Math.max(0,Math.trunc(Number(window.prompt('Transport XAF :','0')??0))),otherCosts=Math.max(0,Math.trunc(Number(window.prompt('Autres coûts XAF :','0')??0)));
            const due=window.prompt('Échéance crédit fournisseur (AAAA-MM-JJ, vide si paiement comptant) :')?.trim()??'';
            await app.createMarketProcurement({supplierId:supplier.id,debtorType:'GROUP',debtorRef:app.activeGroup(),lines:[{label,quantity,unitCost}],freight,otherCosts,currency:'XAF',creditDueAt:due?new Date(due+'T12:00:00Z').toISOString():undefined});
            notify('Approvisionnement créé.');await renderStorefront();
          }catch(e){showError(e);}})();card.append(order);supply.append(card);
        }
        for(const p of state.procurements??[]){
          const card=el('article',undefined,'item');card.append(el('strong',p.title),row('État',p.data.state),row('Coût marchandises',fmt(Number(p.data.goodsCost??0))),row('Transport + autres',fmt(Number(p.data.freight??0)+Number(p.data.otherCosts??0))),row('Coût rendu',fmt(Number(p.data.landedCost??0))),row('Débiteur',String(p.data.debtorType)+' · '+String(p.data.debtorRef)));
          if(['ORDERED','PARTIAL_RECEIPT'].includes(String(p.data.state))){
            const receive=el('button','Constater la réception restante','secondary');receive.type='button';receive.onclick=()=>void(async()=>{try{
              const lines=JSON.parse(String(p.data.linesJson??'[]')),received=JSON.parse(String(p.data.receivedLinesJson??'[]')),todo=[];
              for(let i=0;i<lines.length;i++){const done=received.filter(x=>Number(x.lineIndex)===i).reduce((n,x)=>n+Number(x.quantity),0),left=Number(lines[i].quantity)-done;if(left>0)todo.push({lineIndex:i,quantity:left});}
              if(!todo.length)return notify('Toutes les quantités sont déjà reçues.');
              const ownership=window.prompt('Nature du stock reçu : COMMERCIAL, POT_RESERVED, CONSIGNMENT ou DEPOSIT_SALE','COMMERCIAL')?.trim().toUpperCase()||'COMMERCIAL';
              await app.receiveMarketProcurement(p.id,{lines:todo,stockOwnership:ownership});notify('Réception enregistrée et stock mis à jour.');await renderStorefront();
            }catch(e){showError(e);}})();card.append(receive);
          }
          const lifecycle=await app.marketProcurementLifecycle(p.id).catch(()=>({invoices:[],reconciliations:[],creditNotes:[],credits:[]}));
          if(scope()!==at||token!==marketVisualRender)return;
          card.append(row('Factures fournisseur',String(lifecycle.invoices?.length??0)),row('Rapprochements',String(lifecycle.reconciliations?.length??0)),row('Avoirs',String(lifecycle.creditNotes?.length??0)));
          const addInvoice=el('button','Ajouter facture fournisseur','secondary');addInvoice.type='button';addInvoice.onclick=()=>void(async()=>{try{
            const invoiceRef=window.prompt('Référence facture fournisseur :')?.trim();if(!invoiceRef)return;
            const amount=Math.max(1,Math.trunc(Number(window.prompt('Montant facture XAF :',String(p.data.landedCost??0))??0)));
            const evidenceRef=window.prompt('Référence de preuve : scan, photo, R2 ou reçu papier')?.trim();if(!evidenceRef)return;
            await app.recordMarketSupplierInvoice(p.id,{invoiceRef,amount,currency:'XAF',evidenceRef});notify('Facture fournisseur enregistrée.');await renderStorefront();
          }catch(e){showError(e);}})();card.append(addInvoice);
          for(const inv of lifecycle.invoices??[]){
            const line=el('section',undefined,'item');line.append(el('strong',String(inv.data.invoiceRef??inv.title)),row('Facturé',fmt(Number(inv.data.amount??0))),row('Preuve',String(inv.data.evidenceRef??'—')));
            const rec=(lifecycle.reconciliations??[]).find(x=>String(x.data.invoiceId??'')===String(inv.id));
            if(rec)line.append(row('Rapprochement',String(rec.data.state??'—')),row('Écart',fmt(Number(rec.data.difference??0))));
            else{
              const reconcile=el('button','Rapprocher facture / coût rendu','link-btn');reconcile.type='button';reconcile.onclick=()=>void(async()=>{try{
                const diff=Number(inv.data.amount??0)-Number(p.data.landedCost??0);
                const note=diff===0?'':(window.prompt('Écart détecté. Justification :')?.trim()??'');if(diff!==0&&!note)return;
                await app.reconcileMarketSupplierInvoice(p.id,inv.id,note||undefined);notify('Facture rapprochée au coût rendu.');await renderStorefront();
              }catch(e){showError(e);}})();line.append(reconcile);
            }
            const creditNote=el('button','Enregistrer un avoir','link-btn');creditNote.type='button';creditNote.onclick=()=>void(async()=>{try{
              const amount=Math.max(1,Math.trunc(Number(window.prompt('Montant de l’avoir XAF :','0')??0))),reason=window.prompt('Motif de l’avoir :')?.trim(),evidenceRef=window.prompt('Référence de preuve de l’avoir :')?.trim();
              if(!reason||!evidenceRef)return;await app.issueMarketSupplierCreditNote(p.id,{invoiceId:inv.id,amount,reason,evidenceRef});notify('Avoir enregistré ; la dette fournisseur a été ajustée si applicable.');await renderStorefront();
            }catch(e){showError(e);}})();line.append(creditNote);card.append(line);
          }
          supply.append(card);
        }
        for(const c of state.credits??[]){
          const remaining=Number(c.data.principal??0)-Number(c.data.paidAmount??0),card=el('article',undefined,'item');card.append(el('strong',c.title),row('Débiteur',String(c.data.debtorType)+' · '+String(c.data.debtorRef)),row('Principal',fmt(Number(c.data.principal??0))),row('Reste',fmt(remaining)),row('Échéance',String(c.data.dueAt??'—')),row('État',String(c.data.state)));
          if(remaining>0){const pay=el('button','Enregistrer un règlement','secondary');pay.type='button';pay.onclick=()=>void(async()=>{try{
            const amount=Math.max(1,Math.trunc(Number(window.prompt('Montant réglé XAF :',String(remaining))??0)));
            const ledgerEntryId=String(c.data.debtorType)==='GROUP'?(window.prompt('ID de l’écriture Ledger correspondant au décaissement :')?.trim()??''):'';
            await app.paySupplierCredit(c.id,{amount,ledgerEntryId:ledgerEntryId||undefined,reference:window.prompt('Référence / reçu :')?.trim()??''});notify('Règlement fournisseur rapproché.');await renderStorefront();
          }catch(e){showError(e);}})();card.append(pay);}supply.append(card);
        }
      }catch(e){supply.append(el('p','Approvisionnement indisponible : '+String(e?.message??e),'hint'));}
      storefront.append(supply);
    }
  };

  document.getElementById('communityHubForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{const hub=await app.createCommunityHub({title:v('communityHubTitle'),about:v('communityHubAbout')||undefined,visibility:v('communityHubVisibility'),tags:split(v('communityHubTags')),federatedGroupCodes:split(v('communityFederatedCodes'))});activeHub=hub.id;notify('Hub communautaire créé.');await renderHubs();}catch(err){showError(err);}})();});
  hubSelect?.addEventListener('change',()=>{clearTimeout(draftTimer);clearTimeout(readTimer);activeHub=hubSelect.value;void renderPosts();});
  bodyInput?.addEventListener('input',()=>{queueDraft();signalForumTyping();});
  titleInput?.addEventListener('input',()=>{queueDraft();signalForumTyping();});
  bodyInput?.addEventListener('focus',()=>{if(activeHub)void app.publishLiveSignal?.('CELL_FOCUS',forumSignalPayload()).catch(()=>{});});
  bodyInput?.addEventListener('blur',()=>{stopForumTyping();if(activeHub)void app.publishLiveSignal?.('CELL_BLUR',forumSignalPayload()).catch(()=>{});});
  document.getElementById('communityLoadOlderBtn')?.addEventListener('click',()=>void loadOlder());
  const forumForm=document.getElementById('communityPostForm');
  if(forumForm&&!document.getElementById('communityPostPhoto')){
    const label=el('label','Photo de publication (PNG, JPG ou WebP, 2 Mo maximum)');
    const input=document.createElement('input');input.type='file';input.id='communityPostPhoto';
    input.accept='image/png,image/jpeg,image/webp';input.setAttribute('aria-label','Photo de publication');
    label.append(input);forumForm.append(label);
  }
  document.getElementById('communityPostForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{
    const hubId=v('communityPostHub');if(!hubId)throw Error('COMMUNITY_HUB_REQUIRED');const parentId=bodyInput?.dataset.replyTo||undefined;
    const posted=await app.createForumMessage(hubId,{kind:v('communityPostKind'),title:v('communityPostTitle')||undefined,body:v('communityPostBody'),parentId});
    const photo=document.getElementById('communityPostPhoto')?.files?.[0];
    if(photo){
      try{
        const asset=await app.uploadVisualMedia(photo,'FORUM_PHOTO');
        await app.assignForumPhoto(posted.id,asset.id);
      }catch(error){
        showError(error);
        notify('Message publié ; la photo n’a pas été attachée. Réessayez depuis le message.');
      }
    }
    const photoInput=document.getElementById('communityPostPhoto');if(photoInput)photoInput.value='';
    if(bodyInput){bodyInput.value='';delete bodyInput.dataset.replyTo;bodyInput.placeholder='Le brouillon est synchronisé avec vos autres appareils.';}if(titleInput)titleInput.value='';
    notify('Message publié et synchronisé.');activeHub=hubId;await renderPosts({latest:true});
  }catch(err){showError(err);}})();});
  document.getElementById('groupShopForm')?.addEventListener('submit',e=>{e.preventDefault();void(async()=>{try{await app.saveGroupShop({name:v('groupShopName'),tagline:v('groupShopTagline')||undefined,visibility:v('groupShopVisibility'),locality:v('groupShopLocality')||undefined,categories:split(v('groupShopCategories'))});notify('Boutique du groupe enregistrée.');await renderStorefront();}catch(err){showError(err);}})();});

  window.addEventListener('eco:live-event',event=>{
    const e=event instanceof CustomEvent?event.detail:undefined,p=e?.payload??{};if(!activeHub)return;
    if(e?.type==='COMMUNITY_EVENT'&&String(p.hubId??'')===String(activeHub))void renderPosts({preserveDraft:true,latest:true});
    if(e?.type==='COMMUNITY_DRAFT_SYNC'&&String(p.hubId??'')===String(activeHub))void restoreState(false);
    if(e?.type==='COMMUNITY_READ_SYNC'&&String(p.hubId??'')===String(activeHub))void restoreState(false);
  });
  window.addEventListener('eco:share-intent',event=>{const intent=event instanceof CustomEvent?event.detail:null;if(!intent||String(intent.kind)!=='forum-message')return;void(async()=>{try{if(intent.contextId&&hubs.some(h=>h.id===intent.contextId)){activeHub=intent.contextId;if(hubSelect)hubSelect.value=activeHub;}await renderPosts({preserveDraft:true,around:intent.objectId});focusEcoShareTarget(intent,postList);}catch(e){showError(e);}})();});
  window.addEventListener('eco:live-signal',event=>{
    const e=event instanceof CustomEvent?event.detail:undefined,p=e?.payload??{},other=String(e?.actorId??'');
    if(!livePresence||String(p.kind??'')!=='COMMUNITY_DRAFT'||String(p.hubId??'')!==String(activeHub)||!other||other===String(app.currentActor?.()??''))return;
    if(['TYPING','CELL_FOCUS'].includes(String(e.type??''))){const who=actorName(other)||'Un membre';livePresence.textContent=e.type==='TYPING'?who+' écrit…':who+' prépare un message…';livePresence.hidden=false;clearTimeout(Number(livePresence.dataset.hideTimer||0));livePresence.dataset.hideTimer=String(setTimeout(()=>{livePresence.hidden=true;},3500));}
    if(['TYPING_STOP','CELL_BLUR'].includes(String(e.type??'')))livePresence.hidden=true;
  });
  const refresh=async()=>{if(!app.activeGroup()){stopForumTyping();hubList?.replaceChildren();postList?.replaceChildren();storefront?.replaceChildren();if(livePresence)livePresence.hidden=true;return;}try{await Promise.all([renderHubs(),renderStorefront()]);}catch(e){showError(e);}};
  window.addEventListener('eco:context-changed',()=>{clearTimeout(draftTimer);clearTimeout(readTimer);clearTimeout(forumTypingTimer);observer?.disconnect();activeHub='';hubs=[];loadingPosts=false;marketVisualRender++;cleanForumUrls();releaseStockPhotos();hubList?.replaceChildren();hubSelect?.replaceChildren();postList?.replaceChildren();storefront?.replaceChildren();if(bodyInput){bodyInput.value='';delete bodyInput.dataset.replyTo;}if(titleInput)titleInput.value='';if(draftState)draftState.textContent='';if(readState)readState.textContent='';if(livePresence)livePresence.hidden=true;});
  return{refresh};
}
