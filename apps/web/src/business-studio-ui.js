const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const money=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(n||0))+' F CFA';
const num=v=>Number(v||0);
const field=(label,type='text',name=label,value='')=>{const l=el('label',label);const i=document.createElement('input');i.type=type;i.name=name;if(value!==''&&value!==undefined)i.value=String(value);if(type==='number'){i.min='0';i.step='1';i.inputMode='numeric';}l.append(i);return{label:l,input:i};};
const selectField=(label,name,options)=>{const l=el('label',label),s=document.createElement('select');s.name=name;for(const [v,t] of options){const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);}l.append(s);return{label:l,input:s};};
const parse=j=>{try{return JSON.parse(String(j??''));}catch{return null;}};
const metric=(label,value,note)=>{const c=el('article',undefined,'metric');c.append(el('span',label),el('strong',value));if(note)c.append(el('small',note));return c;};
const row=(label,value)=>{const p=el('p',undefined,'result-row');p.append(el('span',label),el('strong',value));return p;};

export function mountBusinessStudioUI({app,navigate=()=>{},notify=()=>{},showError=console.error}){
  const marketHub=document.getElementById('marketHub');if(!marketHub)return{refresh:async()=>{}};
  const root=el('details',undefined,'panel');root.id='businessStudioOperational';root.open=false;
  const summary=document.createElement('summary');summary.append(el('strong','Business Studio · gestionnaire entrepreneur'),el('span',' Rentabilité · mandats · clients · fournisseurs · coûts · temps · marge','hint'));root.append(summary);
  root.append(el('p','Cockpit privé du gestionnaire. Les cotisations et fonds collectifs ne deviennent jamais automatiquement son chiffre d’affaires. Un revenu issu du groupe ne peut être repris ici qu’avec une référence Ledger collective immuable.','truth-notice'));
  const shopsLink=el('button','Mes boutiques et mes achats','secondary');shopsLink.type='button';shopsLink.onclick=()=>{navigate('ecosystem',{anchor:'personalShopsPanel',force:true});const panel=document.getElementById('personalShopsPanel');if(panel)panel.open=true;};root.append(shopsLink);
  const metrics=el('div',undefined,'metrics'),guidance=el('section',undefined,'stack'),actions=el('div',undefined,'actions'),list=el('div',undefined,'stack');
  guidance.append(el('h3','Pilotage de l’activité et du groupe'));root.append(metrics,guidance,actions,list);
  marketHub.closest('section')?.insertAdjacentElement('afterend',root);

  const button=(label,cb,cls='secondary')=>{const b=el('button',label,cls);b.type='button';b.onclick=()=>void Promise.resolve(cb()).catch(showError);actions.append(b);return b;};
  const dialogForm=async(title,fields,submitLabel='Enregistrer')=>new Promise(resolve=>{
    const d=document.createElement('dialog'),form=document.createElement('form');form.method='dialog';form.className='form-grid';form.append(el('h3',title));
    for(const f of fields)form.append(f.label);
    const row=el('div',undefined,'actions full'),cancel=el('button','Annuler','link-btn'),ok=el('button',submitLabel,'primary');cancel.type='button';ok.type='submit';row.append(cancel,ok);form.append(row);d.append(form);document.body.append(d);
    const done=v=>{try{d.close();}catch{}d.remove();resolve(v);};cancel.onclick=()=>done(null);form.onsubmit=e=>{e.preventDefault();done(Object.fromEntries(new FormData(form).entries()));};d.addEventListener('cancel',()=>done(null),{once:true});d.showModal();
  });

  button('Configurer mon activité',async()=>{
    const n=field('Nom de l’activité','text','name'),loc=field('Localité','text','locality'),services=field('Services (séparés par virgule)','text','services'),fixed=field('Coûts fixes mensuels','number','monthlyFixedCosts');
    const d=await dialogForm('Configurer Business Studio',[n,loc,services,fixed]);if(!d)return;
    await app.configureBusiness({name:d.name,locality:d.locality,services:String(d.services).split(',').map(x=>x.trim()).filter(Boolean),monthlyFixedCosts:num(d.monthlyFixedCosts)});notify('Activité professionnelle mise à jour.');await refresh();
  },'primary');

  button('Ajouter une offre au catalogue',async()=>{
    const name=field('Nom du service / offre','text','name'),category=field('Catégorie','text','category'),price=field('Prix validé / unité','number','unitPrice'),description=field('Périmètre et conditions','text','description');
    const d=await dialogForm('Catalogue Business Studio',[name,category,price,description]);if(!d)return;
    await app.createBusinessOffer({name:d.name,category:d.category,unitPrice:num(d.unitPrice),description:d.description,currency:'XAF',active:true});notify('Offre ajoutée au catalogue privé du gestionnaire.');await refresh();
  });

  button('Enregistrer une demande client',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED');
    const client=selectField('Client (facultatif)','clientId',[['','Non encore identifié'],...clients.map(x=>[x.id,x.title])]),title=field('Objet de la demande','text','title'),need=field('Besoin exprimé','text','need'),budget=field('Budget indicatif (facultatif)','number','estimatedBudget'),due=field('Échéance souhaitée','date','dueAt');
    const d=await dialogForm('Qualifier une demande',[client,title,need,budget,due]);if(!d)return;
    await app.createBusinessRequest({clientId:d.clientId||undefined,title:d.title,need:d.need,estimatedBudget:num(d.estimatedBudget),dueAt:d.dueAt?new Date(String(d.dueAt)+'T12:00:00').toISOString():undefined,source:'BUSINESS_STUDIO'});notify('Demande qualifiée. Elle ne devient ni commande ni facture sans validation.');await refresh();
  });

  button('Créer une commande',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED'),quotes=records.filter(x=>x.data.businessKind==='QUOTE'&&x.data.quoteState==='ACCEPTED'),contracts=records.filter(x=>x.data.businessKind==='CONTRACT'&&x.data.contractState==='ACTIVE');if(!clients.length)throw new Error('CLIENT_REQUIRED');
    const client=selectField('Client','clientId',clients.map(x=>[x.id,x.title])),quote=selectField('Devis accepté (facultatif)','quoteId',[['','Aucun'],...quotes.map(x=>[x.id,x.title])]),contract=selectField('Contrat (facultatif)','contractId',[['','Aucun'],...contracts.map(x=>[x.id,x.title])]),title=field('Objet de la commande','text','title'),amount=field('Montant validé','number','amount'),due=field('Date attendue','date','dueAt');
    const d=await dialogForm('Créer une commande privée',[client,quote,contract,title,amount,due]);if(!d)return;
    await app.createBusinessOrder({clientId:d.clientId,quoteId:d.quoteId||undefined,contractId:d.contractId||undefined,title:d.title,amount:num(d.amount),currency:'XAF',dueAt:d.dueAt?new Date(String(d.dueAt)+'T12:00:00').toISOString():undefined});notify('Commande créée en brouillon. Confirmez-la explicitement avant exécution.');await refresh();
  });

  button('Journaliser un échange / une relance',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED');
    const client=selectField('Client (facultatif)','clientId',[['','Aucun'],...clients.map(x=>[x.id,x.title])]),channel=selectField('Canal','channel',[['CALL','Appel'],['WHATSAPP','WhatsApp'],['SMS','SMS'],['EMAIL','Email'],['IN_PERSON','En personne'],['OTHER','Autre']]),direction=selectField('Sens','direction',[['OUTBOUND','Sortant'],['INBOUND','Entrant']]),subject=field('Objet','text','subject'),note=field('Résumé / engagement','text','note'),next=field('Prochaine action','datetime-local','nextActionAt');
    const d=await dialogForm('Journal de communication',[client,channel,direction,subject,note,next]);if(!d)return;
    await app.logBusinessCommunication({clientId:d.clientId||undefined,channel:d.channel,direction:d.direction,subject:d.subject,note:d.note,nextActionAt:d.nextActionAt?new Date(String(d.nextActionAt)).toISOString():undefined});notify('Échange enregistré avec sa prochaine relance.');await refresh();
  });

  button('Créer une action de pilotage',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED');
    const client=selectField('Client (facultatif)','clientId',[['','Aucun'],...clients.map(x=>[x.id,x.title])]),title=field('Action à faire','text','title'),priority=selectField('Priorité','priority',[['NORMAL','Normale'],['HIGH','Haute'],['URGENT','Urgente'],['LOW','Basse']]),due=field('Échéance','datetime-local','dueAt'),note=field('Résultat attendu','text','note');
    const d=await dialogForm('Action de pilotage',[client,title,priority,due,note]);if(!d)return;
    await app.createBusinessAction({clientId:d.clientId||undefined,groupId:app.activeGroup()||undefined,title:d.title,priority:d.priority,dueAt:d.dueAt?new Date(String(d.dueAt)).toISOString():undefined,note:d.note});notify('Action ajoutée au plan de pilotage.');await refresh();
  });

  button('Business Agent · plan d’action',async()=>{
    const brief=await app.businessOperatingBrief(),box=el('article',undefined,'item');box.append(el('strong','Business Agent · recommandations déterministes'));for(const x of brief.actions??[])box.append(el('p','• '+x));const rules=el('details');rules.append(el('summary','Limites du Business Agent'));for(const x of brief.guardrails??[])rules.append(el('p','• '+x,'hint'));box.append(rules);guidance.prepend(box);notify('Plan d’action recalculé à partir des données Business Studio.');
  },'primary');

  button('Visibilité / publicité',async()=>{navigate('ecosystem',{anchor:'adManagerPanel',force:true});});
  button('Fournisseurs / approvisionnements',async()=>{marketHub.scrollIntoView({behavior:'smooth',block:'start'});});

  button('Nouveau mandat',async()=>{
    if(!app.activeGroup())throw new Error('ACTIVE_GROUP_REQUIRED');
    const srv=field('Services du mandat','text','services'),start=field('Début','date','startsAt'),end=field('Fin facultative','date','endsAt'),
      rights=selectField('Droits de mission','rightsPack',[['ADVICE','Conseil + rapports'],['MANAGEMENT','Appui séances + documents + membres + communication'],['BUSINESS','Approvisionnement + Business + rapports'],['TRAINING','Formation + rapports']]),
      approvers=field('Rôles pouvant approuver','text','approverRoles','founder,president,treasurer,manager'),minimum=field('Nombre minimum d’approbations distinctes','number','minimumApprovals','2'),
      model=selectField('Honoraires','feeModel',[['FIXED','Forfait'],['PER_SESSION','Par séance'],['PERCENT_SANDBOX','Pourcentage — simulation seulement'],['CUSTOM','Personnalisé']]),fee=field('Montant / base honoraires','number','feeAmount');
    const d=await dialogForm('Créer un mandat pour le groupe actif',[srv,start,end,rights,approvers,minimum,model,fee]);if(!d)return;
    const packs={ADVICE:['GROUP_ADVICE','REPORTING'],MANAGEMENT:['MEETING_SUPPORT','DOCUMENT_SUPPORT','REPORTING','MEMBER_ADMIN_SUPPORT','COMMUNICATION_SUPPORT'],BUSINESS:['PROCUREMENT_SUPPORT','BUSINESS_SUPPORT','REPORTING'],TRAINING:['TRAINING_SUPPORT','REPORTING']};
    await app.createBusinessMandate({groupId:app.activeGroup(),services:String(d.services).split(',').map(x=>x.trim()).filter(Boolean),startsAt:d.startsAt,endsAt:d.endsAt||undefined,feeModel:d.feeModel,feeAmount:num(d.feeAmount),currency:'XAF',delegatedRights:packs[d.rightsPack]??packs.ADVICE,approvalsRequired:String(d.approverRoles).split(',').map(x=>x.trim()).filter(Boolean),minimumApprovals:Math.max(1,num(d.minimumApprovals)||1)});notify('Mandat créé en brouillon. Il doit atteindre son quorum d’approbations avant activation.');await refresh();
  });

  button('Nouveau prospect / client',async()=>{
    const n=field('Nom / organisation','text','name'),type=selectField('Type','type',[['GROUP','Groupe'],['PERSON','Personne'],['BUSINESS','Entreprise'],['NGO','ONG'],['OTHER','Autre']]),contact=field('Référence de contact','text','contactRef');
    const d=await dialogForm('Créer un prospect / client',[n,type,contact]);if(!d)return;
    await app.createBusinessClient({name:d.name,type:d.type,contactRef:d.contactRef,consentToContact:false});notify('Prospect créé.');await refresh();
  });

  button('Nouvelle recette privée',async()=>{
    const n=field('Libellé','text','label'),amount=field('Montant reçu','number','amount'),source=selectField('Origine','source',[['MANAGEMENT_FEE','Frais / honoraires de gestion'],['HONORARIUM','Honoraires'],['COMMISSION','Commission'],['SUPPLIER_DISCOUNT','Remise fournisseur acquise au gestionnaire'],['SERVICE','Service professionnel'],['OTHER','Autre']]),ref=field('Référence libre','text','reference');
    const d=await dialogForm('Enregistrer une recette privée',[n,amount,source,ref]);if(!d)return;
    await app.recordBusinessRevenue({label:d.label,amount:num(d.amount),source:d.source,currency:'XAF',reference:d.reference||undefined});notify('Recette privée enregistrée sans toucher au Ledger collectif.');await refresh();
  });

  button('Nouvelle dépense',async()=>{
    const n=field('Libellé','text','label'),amount=field('Montant','number','amount'),cat=selectField('Catégorie','category',[
      ['TRANSPORT','Transport'],['INTERNET_DATA','Internet / data'],['COMMUNICATION','Communication / appels'],['PERSONNEL','Personnel'],['RENT','Location'],['ADVERTISING','Publicité'],['PROCUREMENT','Achats / approvisionnement'],['SUPPLIES','Fournitures'],['TRAINING','Formation'],['LABOUR','Main-d’œuvre'],['FEES','Frais externes'],['LOSS','Pertes'],['TRAVEL','Déplacement'],['OTHER','Autre']
    ]);
    const d=await dialogForm('Enregistrer un coût professionnel',[n,amount,cat]);if(!d)return;
    await app.recordBusinessExpense({label:d.label,amount:num(d.amount),category:d.category,currency:'XAF'});notify('Dépense enregistrée.');await refresh();
  });

  button('Créer un devis',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED');if(!clients.length)throw new Error('Créez d’abord un prospect / client.');
    const client=selectField('Client','clientId',clients.map(x=>[x.id,x.title])),title=field('Objet du devis','text','title'),label=field('Ligne / service','text','itemLabel'),qty=field('Quantité','number','quantity','1'),unit=field('Prix unitaire','number','unitPrice'),valid=field('Valable jusqu’au','date','validUntil');
    const d=await dialogForm('Créer un devis',[client,title,label,qty,unit,valid]);if(!d)return;
    await app.createBusinessQuote({clientId:d.clientId,title:d.title,items:[{label:d.itemLabel,quantity:num(d.quantity)||1,unitPrice:num(d.unitPrice)}],currency:'XAF',validUntil:d.validUntil||undefined});notify('Devis créé. Il reste à l’envoyer puis à enregistrer la décision du client.');await refresh();
  });

  button('Créer un contrat',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED'),quotes=records.filter(x=>x.data.businessKind==='QUOTE'&&x.data.quoteState==='ACCEPTED');if(!clients.length)throw new Error('CLIENT_REQUIRED');
    const client=selectField('Client','clientId',clients.map(x=>[x.id,x.title])),quote=selectField('Devis accepté (facultatif)','quoteId',[['','Aucun'],...quotes.map(x=>[x.id,x.title])]),title=field('Titre du contrat','text','title'),start=field('Début','date','startsAt'),end=field('Fin facultative','date','endsAt'),scope=field('Périmètre / livrables','text','scope');
    const d=await dialogForm('Créer un contrat',[client,quote,title,start,end,scope]);if(!d)return;
    await app.createBusinessContract({clientId:d.clientId,quoteId:d.quoteId||undefined,title:d.title,startsAt:d.startsAt,endsAt:d.endsAt||undefined,scope:d.scope});notify('Contrat enregistré.');await refresh();
  });

  button('Émettre une facture',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED'),contracts=records.filter(x=>x.data.businessKind==='CONTRACT'&&x.data.contractState==='ACTIVE');if(!clients.length)throw new Error('CLIENT_REQUIRED');
    const client=selectField('Client','clientId',clients.map(x=>[x.id,x.title])),contract=selectField('Contrat (facultatif)','contractId',[['','Aucun'],...contracts.map(x=>[x.id,x.title])]),amount=field('Montant','number','amount'),due=field('Échéance','date','dueAt');
    const d=await dialogForm('Émettre une facture',[client,contract,amount,due]);if(!d)return;
    await app.issueBusinessInvoice({clientId:d.clientId,contractId:d.contractId||undefined,amount:num(d.amount),currency:'XAF',dueAt:new Date(String(d.dueAt)+'T12:00:00').toISOString()});notify('Facture émise et suivie dans Business Studio.');await refresh();
  });

  button('Encaisser une facture',async()=>{
    const records=await app.businessRecords(),invoices=records.filter(x=>x.data.businessKind==='INVOICE'&&Number(x.data.receivedAmount||0)<Number(x.data.amount||0));if(!invoices.length)throw new Error('Aucune facture ouverte.');
    const invoice=selectField('Facture','invoiceId',invoices.map(x=>[x.id,x.title+' · reste '+money(Number(x.data.amount||0)-Number(x.data.receivedAmount||0))])),amount=field('Montant reçu','number','amount'),method=selectField('Mode','method',[['CASH','Espèces'],['MOMO','Mobile Money'],['OM','Orange Money'],['BANK','Banque'],['OTHER','Autre']]),ref=field('Référence','text','reference');
    const d=await dialogForm('Encaisser une facture',[invoice,amount,method,ref]);if(!d)return;
    await app.recordBusinessPayment({invoiceId:d.invoiceId,amount:num(d.amount),method:d.method,reference:d.reference||undefined});notify('Paiement enregistré.');await refresh();
  });

  button('Saisir mon temps',async()=>{
    const records=await app.businessRecords(),clients=records.filter(x=>x.data.businessKind==='CLIENT'&&x.data.clientState!=='CLOSED'),mandates=records.filter(x=>x.data.businessKind==='MANDATE'&&x.data.mandateState==='ACTIVE');
    const client=selectField('Client (facultatif)','clientId',[['','Aucun'],...clients.map(x=>[x.id,x.title])]),mandate=selectField('Mandat (facultatif)','mandateId',[['','Aucun'],...mandates.map(x=>[x.id,x.title])]),minutes=field('Minutes travaillées','number','minutes'),date=field('Date','date','workDate'),note=field('Travail effectué','text','note');
    const d=await dialogForm('Saisir le temps de travail',[client,mandate,minutes,date,note]);if(!d)return;
    await app.recordBusinessTime({clientId:d.clientId||undefined,mandateId:d.mandateId||undefined,minutes:num(d.minutes),workDate:new Date(String(d.workDate)+'T12:00:00').toISOString(),note:d.note||undefined});notify('Temps de travail enregistré.');await refresh();
  });

  button('Importer un honoraire validé du groupe',async()=>{
    const groupId=app.activeGroup();if(!groupId)throw new Error('ACTIVE_GROUP_REQUIRED');const ledger=await app.ledger(),entries=(ledger.entries??[]).filter(x=>x.status!=='reversed');if(!entries.length)throw new Error('Aucune écriture Ledger disponible à référencer.');
    const entry=selectField('Écriture collective de référence','collectiveLedgerEntryId',entries.slice(-100).reverse().map(x=>[x.id,String(x.memo??x.kind??'Écriture')+' · '+String(x.id).slice(-8)])),label=field('Libellé de la recette privée autorisée','text','label'),amount=field('Montant autorisé','number','amount'),source=selectField('Nature','source',[['MANAGEMENT_FEE','Frais de gestion'],['HONORARIUM','Honoraires'],['COMMISSION','Commission'],['OTHER','Autre']]);
    const d=await dialogForm('Importer une recette autorisée depuis le groupe',[entry,label,amount,source]);if(!d)return;
    await app.recordBusinessRevenue({label:d.label,amount:num(d.amount),source:d.source,currency:'XAF',groupId,collectiveLedgerEntryId:d.collectiveLedgerEntryId,reference:'Import Ledger collectif autorisé'});notify('Recette privée référencée au Ledger collectif sans modifier ses écritures.');await refresh();
  });

  button('Plan de rentabilité complet',async()=>{
    const fs=[
      field('Nom du scénario','text','name'),field('Cotisation nominale par membre/séance','number','nominalContribution'),field('Frais ajoutés par membre/séance','number','addedFeePerMemberSession'),
      field('Nombre de membres','number','members'),field('Nombre de séances','number','sessions'),field('Nombre de pots','number','pots'),field('Durée du cycle en mois','number','durationMonths'),
      field('Frais de transfert — cycle','number','transferFees'),field('Frais de retrait — cycle','number','withdrawalFees'),field('Transport — cycle','number','transport'),field('Internet / data — cycle','number','internet'),field('Communication / appels — cycle','number','communication'),
      field('Personnel — cycle','number','personnel'),field('Location — cycle','number','rent'),field('Publicité — cycle','number','advertising'),field('Achats / fournisseurs — cycle','number','purchases'),
      field('Remises fournisseur acquises — cycle','number','supplierDiscounts'),field('Commissions — cycle','number','commissions'),field('Honoraires / frais de gestion hors frais unitaires','number','managementFees'),field('Autres revenus privés','number','otherRevenue'),field('Pertes prévues','number','losses'),field('Taux d’impayés estimé (%)','number','expectedDefaultRate')
    ];
    const d=await dialogForm('Étude de faisabilité et rentabilité du gestionnaire',fs,'Calculer et enregistrer');if(!d)return;
    const payload={};for(const [k,v] of Object.entries(d))payload[k]=k==='name'?v:num(v);
    await app.createBusinessScenario(payload);notify('Étude de rentabilité enregistrée. Aucune écriture financière collective n’a été créée.');await refresh();
  },'primary');

  const renderScenario=(r,c)=>{
    const prudent=parse(r.data.prudentJson),central=parse(r.data.centralJson),optimistic=parse(r.data.optimisticJson),late5=parse(r.data.late5Json),late10=parse(r.data.late10Json);
    c.append(el('p','Cotisations collectives simulées : '+money(r.data.collectiveContributionVolume)+' — exclues du chiffre d’affaires privé.','truth-notice'));
    const g=el('div',undefined,'metrics small');
    for(const [label,value] of [['Revenu privé réalisable',money(r.data.realizedRevenue)],['Coûts totaux',money(r.data.totalCosts)],['Marge brute',money(r.data.grossMargin)],['Marge nette',money(r.data.netMargin)],['Marge / membre',money(r.data.marginPerMember)],['Marge / séance',money(r.data.marginPerSession)],['Seuil de CA',money(r.data.breakEvenRevenue)],['Membres minimum',Number(r.data.breakEvenMembers)<0?'Non calculable':String(r.data.breakEvenMembers)]])g.append(metric(label,value));
    c.append(g);
    const scenarios=el('div',undefined,'three-col');
    for(const [label,x] of [['Prudent',prudent],['Central',central],['Optimiste',optimistic]]){const a=el('article',undefined,'item');a.append(el('strong',label),row('Revenus',money(x?.revenue)),row('Coûts',money(x?.costs)),row('Marge nette',money(x?.netMargin)),row('Impayés hypothétiques',(x?.defaultRate??0)+' %'));scenarios.append(a);}c.append(scenarios);
    c.append(el('p','Sensibilité retards : +5 points d’impayés → '+money(late5?.netMargin)+' ; +10 points → '+money(late10?.netMargin)+'. Valeur collective potentiellement exposée aux impayés : '+money(r.data.memberValueAtRisk)+'.','hint'));
  };

  const refresh=async()=>{
    metrics.replaceChildren();guidance.querySelectorAll(':scope > :not(h3)').forEach(x=>x.remove());list.replaceChildren();
    try{
      const [s,records,groupMandates,proc,profitability,brief]=await Promise.all([app.businessSummary(),app.businessRecords(),app.activeGroup()?app.businessMandatesForGroup().catch(()=>[]):Promise.resolve([]),app.activeGroup()?app.marketProcurement().catch(()=>({procurements:[],credits:[],suppliers:[]})):Promise.resolve({procurements:[],credits:[],suppliers:[]}),app.businessProfitability().catch(()=>[]),app.businessOperatingBrief().catch(()=>({actions:[],guardrails:[]}))]);
      for(const [label,value,note] of [
        ['Recettes encaissées',money(s.received),'factures encaissées + revenus privés'],
        ['Revenus privés directs',money(s.directRevenue),'hors cotisations collectives'],
        ['Dépenses',money(s.expenses),'activité professionnelle'],
        ['Marge nette réelle',money(s.margin),'encaissements - dépenses'],
        ['Factures restant dues',money(s.outstanding),s.overdueInvoices+' en retard'],
        ['Prospects',String(s.prospects),'à convertir'],
        ['Clients actifs',String(s.activeClients),'relations actives'],
        ['Mandats actifs',String(s.activeMandates),'groupes / clients servis'],
        ['Temps saisi',Number(s.hours||0).toFixed(1)+' h','marge/h '+money(s.netMarginPerHour)],
        ['Offres catalogue',String(s.catalogOffers??0),'services/produits actifs'],
        ['Demandes ouvertes',String(s.openRequests??0),'à qualifier / deviser'],
        ['Commandes en cours',String(s.openOrders??0),(s.deliveredOrders??0)+' livrée(s)'],
        ['Relances dues',String(s.followUpsDue??0),'journal de communication'],
        ['Fournisseurs connus',String(proc.suppliers?.length??0),'groupe actif'],
        ['Approvisionnements',String(proc.procurements?.length??0),'groupe actif']
      ])metrics.append(metric(label,value,note));

      const alerts=[];
      if(s.overdueInvoices>0)alerts.push(['URGENT',s.overdueInvoices+' facture(s) dépassent leur échéance : relancer le client avant d’accroître les dépenses.']);
      if(s.margin<0)alerts.push(['MARGE','La marge réelle est négative : analyser les coûts dominants et les honoraires avant de poursuivre la croissance.']);
      if(s.prospects>0)alerts.push(['VENTE',s.prospects+' prospect(s) attendent une action commerciale : qualifier, proposer puis suivre un devis.']);
      if((proc.credits??[]).some(x=>Number(x.data?.outstandingAmount??x.outstandingAmount??0)>0))alerts.push(['FOURNISSEUR','Un crédit fournisseur reste ouvert : distinguer la dette du groupe de la dette privée et planifier son règlement.']);
      if(!records.some(x=>x.data.businessKind==='SCENARIO'))alerts.push(['PLAN','Aucune étude de faisabilité complète : calculez prudent / central / optimiste avant de fixer les frais.']);
      if((s.followUpsDue??0)>0)alerts.push(['RELANCE',(s.followUpsDue??0)+' relance(s) client sont arrivées à échéance.']);
      if((s.openOrders??0)>0)alerts.push(['LIVRAISON',(s.openOrders??0)+' commande(s) doivent être suivies jusqu’à livraison, preuve et facturation.']);
      if(!alerts.length)alerts.push(['SUIVI','Aucune alerte prioritaire détectée. Continuez à suivre prospects, impayés, coûts, fournisseurs et marge.']);
      for(const [tag,msg] of alerts){const a=el('article',undefined,'item');a.append(el('span',tag,'pill'),el('p',msg));guidance.append(a);}
      if((brief.actions??[]).length){const agent=el('details');agent.open=true;agent.append(el('summary','Business Agent · prochaine meilleure action'));for(const x of brief.actions)agent.append(el('p','• '+x));const g=el('p','Assistant borné : aucun prix inventé, aucun paiement supposé, aucun engagement sans validation humaine.','truth-notice');agent.append(g);guidance.append(agent);}
      if(profitability.length){const pro=el('details');pro.append(el('summary','Rentabilité réelle par client / groupe'));for(const x of profitability.slice(0,20)){const label=[records.find(r=>r.id===x.clientId)?.title,x.groupId?'Groupe '+String(x.groupId).slice(-8):''].filter(Boolean).join(' · ')||'Activité générale';const a=el('article',undefined,'item');a.append(el('strong',label),row('Recettes',money(x.revenue)),row('Dépenses',money(x.expenses)),row('Marge',money(x.margin)),row('Temps',Number(x.hours||0).toFixed(1)+' h'),row('Marge / heure',money(x.marginPerHour)));pro.append(a);}guidance.append(pro);}

      const breakdown=el('details');breakdown.append(el('summary','Lire la structure des recettes et dépenses'));const b=el('div',undefined,'two-col'),rev=el('div'),exp=el('div');rev.append(el('h4','Recettes privées par origine'));exp.append(el('h4','Dépenses par catégorie'));for(const [k,v] of Object.entries(s.revenueBySource??{}))rev.append(row(k,money(v)));for(const [k,v] of Object.entries(s.expenseByCategory??{}))exp.append(row(k,money(v)));if(!(Object.keys(s.revenueBySource??{}).length))rev.append(el('p','Aucune recette directe.','hint'));if(!(Object.keys(s.expenseByCategory??{}).length))exp.append(el('p','Aucune dépense.','hint'));b.append(rev,exp);breakdown.append(b);guidance.append(breakdown);

      if(groupMandates.length){
        const title=el('h3','Mandats du groupe actif');list.append(title);
        for(const r of groupMandates){
          const state=String(r.data.mandateState??'DRAFT'),approvals=parse(r.data.approvalsJson)??[],required=Number(r.data.minimumApprovals??1),rights=parse(r.data.delegatedRightsJson)??[],services=parse(r.data.servicesJson)??[],c=el('article',undefined,'item');
          c.append(el('strong',r.title),el('span',state,'pill'),el('p','Services : '+services.join(', '),'hint'),el('p','Droits de mission : '+rights.join(', ')+' · élévation système : non','truth-notice'),el('p','Approbations distinctes : '+approvals.length+' / '+required+' · honoraires '+money(r.data.feeAmount),'hint'));
          if(state==='DRAFT'){
            const approve=el('button','Approuver ce mandat','secondary');approve.type='button';approve.onclick=()=>void app.approveBusinessMandate(r.id).then(()=>{notify('Approbation enregistrée avec votre compte.');return refresh();}).catch(showError);c.append(approve);
            if(r.createdBy===app.currentActor()&&approvals.length>=required){const activate=el('button','Activer après quorum','primary');activate.type='button';activate.onclick=()=>void app.activateBusinessMandate(r.id).then(()=>{notify('Mandat activé après contrôle du quorum.');return refresh();}).catch(showError);c.append(activate);}
          }
          if(state==='ACTIVE'){const end=el('button','Terminer le mandat','link-btn');end.type='button';end.onclick=()=>void(async()=>{const reason=window.prompt('Motif de fin du mandat :')?.trim();if(!reason)return;await app.endBusinessMandate(r.id,reason);notify('Mandat terminé et tracé.');await refresh();})().catch(showError);c.append(end);}
          list.append(c);
        }
      }
      const recordsTitle=el('h3','Dossiers opérationnels');list.append(recordsTitle);
      if(!records.filter(x=>x.data.businessKind!=='WORKSPACE').length)list.append(el('p','Aucun dossier Business Studio pour le moment.','hint'));
      for(const r of records.filter(x=>x.data.businessKind!=='WORKSPACE').slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,80)){
        const c=el('article',undefined,'item'),kind=String(r.data.businessKind??'DOSSIER');c.append(el('strong',r.title),el('span',kind+' · '+String(r.status),'pill'));
        if(kind==='MANDATE'){const state=String(r.data.mandateState??'DRAFT'),approvals=parse(r.data.approvalsJson)??[],required=Number(r.data.minimumApprovals??1),rights=parse(r.data.delegatedRightsJson)??[];c.append(el('p','État : '+state+' · approbations '+approvals.length+'/'+required+' · honoraires '+money(r.data.feeAmount),'hint'),el('p','Droits de mission : '+rights.join(', ')+' · aucune élévation automatique de permission système','truth-notice'));}
        if(kind==='CLIENT')c.append(el('p','Relation : '+String(r.data.clientState??'PROSPECT'),'hint'));
        if(kind==='OFFER'){c.append(el('p','Catalogue : '+money(r.data.unitPrice)+' · '+String(r.data.offerState??'ACTIVE'),'hint'));}
        if(kind==='REQUEST')c.append(el('p','Demande : '+String(r.data.requestState??'OPEN')+' · budget '+money(r.data.estimatedBudget),'hint'));
        if(kind==='QUOTE'){c.append(el('p','Devis : '+money(r.data.total)+' · '+String(r.data.quoteState),'hint'));if(r.data.quoteState==='DRAFT'){const sent=el('button','Marquer envoyé','secondary');sent.type='button';sent.onclick=()=>void app.decideBusinessQuote(r.id,'SENT').then(refresh).catch(showError);c.append(sent);}if(['DRAFT','SENT'].includes(String(r.data.quoteState))){const accept=el('button','Accepté','primary'),reject=el('button','Refusé','link-btn');accept.type=reject.type='button';accept.onclick=()=>void app.decideBusinessQuote(r.id,'ACCEPTED').then(refresh).catch(showError);reject.onclick=()=>void app.decideBusinessQuote(r.id,'REJECTED').then(refresh).catch(showError);c.append(accept,reject);}}
        if(kind==='ORDER'){c.append(el('p','Commande : '+money(r.data.amount)+' · '+String(r.data.orderState),'hint'));const st=String(r.data.orderState);const next=st==='DRAFT'?'CONFIRMED':st==='CONFIRMED'?'IN_PROGRESS':st==='IN_PROGRESS'?'DELIVERED':'';if(next){const b=el('button',next==='CONFIRMED'?'Confirmer la commande':next==='IN_PROGRESS'?'Démarrer':'Marquer livrée',next==='DELIVERED'?'primary':'secondary');b.type='button';b.onclick=()=>void app.setBusinessOrderState(r.id,next).then(refresh).catch(showError);c.append(b);}}
        if(kind==='INVOICE')c.append(el('p','Facture : '+money(r.data.amount)+' · reçu '+money(r.data.receivedAmount)+' · '+String(r.data.invoiceState),'hint'));
        if(kind==='COMMUNICATION')c.append(el('p','Échange '+String(r.data.channel)+' · prochaine action '+(r.data.nextActionAt?new Date(String(r.data.nextActionAt)).toLocaleString():'—'),'hint'));
        if(kind==='ACTION'){c.append(el('p','Action : '+String(r.data.priority??'NORMAL')+' · '+String(r.data.actionState??'OPEN'),'hint'));if(r.data.actionState!=='DONE'){const done=el('button','Marquer faite','secondary');done.type='button';done.onclick=()=>void app.completeBusinessAction(r.id).then(refresh).catch(showError);c.append(done);}}
        if(kind==='EXPENSE')c.append(el('p','Coût : '+money(r.data.amount)+' · '+String(r.data.category),'hint'));
        if(kind==='REVENUE')c.append(el('p','Recette privée : '+money(r.data.amount)+' · '+String(r.data.source),'hint'));
        if(kind==='TIME')c.append(el('p','Temps : '+(Number(r.data.minutes||0)/60).toFixed(1)+' h','hint'));
        if(kind==='SCENARIO')renderScenario(r,c);
        list.append(c);
      }
    }catch(e){list.append(el('p','Business Studio indisponible : '+String(e?.message??e),'hint'));}
  };
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  document.addEventListener('eco:group-context-changed',()=>{if(root.open)void refresh();});
  return{refresh};
}
