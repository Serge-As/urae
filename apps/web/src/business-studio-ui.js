const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const money=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(n||0))+' F CFA';
const num=v=>Number(v||0);
const field=(label,type='text',name=label,value='')=>{const l=el('label',label);const i=document.createElement('input');i.type=type;i.name=name;if(value!==''&&value!==undefined)i.value=String(value);if(type==='number'){i.min='0';i.step='1';i.inputMode='numeric';}l.append(i);return{label:l,input:i};};
const selectField=(label,name,options)=>{const l=el('label',label),s=document.createElement('select');s.name=name;for(const [v,t] of options){const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);}l.append(s);return{label:l,input:s};};
const parse=j=>{try{return JSON.parse(String(j??''));}catch{return null;}};
const metric=(label,value,note)=>{const c=el('article',undefined,'metric');c.append(el('span',label),el('strong',value));if(note)c.append(el('small',note));return c;};
const row=(label,value)=>{const p=el('p',undefined,'result-row');p.append(el('span',label),el('strong',value));return p;};

export function mountBusinessStudioUI({app,notify=()=>{},showError=console.error}){
  const marketHub=document.getElementById('marketHub');if(!marketHub)return{refresh:async()=>{}};
  const root=el('details',undefined,'panel');root.id='businessStudioOperational';root.open=false;
  const summary=document.createElement('summary');summary.append(el('strong','Business Studio · gestionnaire entrepreneur'),el('span',' Rentabilité · mandats · clients · fournisseurs · coûts · temps · marge','hint'));root.append(summary);
  root.append(el('p','Cockpit privé du gestionnaire. Les cotisations et fonds collectifs ne deviennent jamais automatiquement son chiffre d’affaires. Un revenu issu du groupe ne peut être repris ici qu’avec une référence Ledger collective immuable.','truth-notice'));
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

  button('Nouveau mandat',async()=>{
    if(!app.activeGroup())throw new Error('ACTIVE_GROUP_REQUIRED');
    const srv=field('Services du mandat','text','services'),start=field('Début','date','startsAt'),end=field('Fin facultative','date','endsAt'),model=selectField('Honoraires','feeModel',[['FIXED','Forfait'],['PER_SESSION','Par séance'],['PERCENT_SANDBOX','Pourcentage — simulation seulement'],['CUSTOM','Personnalisé']]),fee=field('Montant / base honoraires','number','feeAmount');
    const d=await dialogForm('Créer un mandat pour le groupe actif',[srv,start,end,model,fee]);if(!d)return;
    await app.createBusinessMandate({groupId:app.activeGroup(),services:String(d.services).split(',').map(x=>x.trim()).filter(Boolean),startsAt:d.startsAt,endsAt:d.endsAt||undefined,feeModel:d.feeModel,feeAmount:num(d.feeAmount),currency:'XAF'});notify('Mandat créé en brouillon.');await refresh();
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
      const [s,records,proc]=await Promise.all([app.businessSummary(),app.businessRecords(),app.activeGroup()?app.marketProcurement().catch(()=>({procurements:[],credits:[],suppliers:[]})):Promise.resolve({procurements:[],credits:[],suppliers:[]})]);
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
        ['Fournisseurs connus',String(proc.suppliers?.length??0),'groupe actif'],
        ['Approvisionnements',String(proc.procurements?.length??0),'groupe actif']
      ])metrics.append(metric(label,value,note));

      const alerts=[];
      if(s.overdueInvoices>0)alerts.push(['URGENT',s.overdueInvoices+' facture(s) dépassent leur échéance : relancer le client avant d’accroître les dépenses.']);
      if(s.margin<0)alerts.push(['MARGE','La marge réelle est négative : analyser les coûts dominants et les honoraires avant de poursuivre la croissance.']);
      if(s.prospects>0)alerts.push(['VENTE',s.prospects+' prospect(s) attendent une action commerciale : qualifier, proposer puis suivre un devis.']);
      if((proc.credits??[]).some(x=>Number(x.data?.outstandingAmount??x.outstandingAmount??0)>0))alerts.push(['FOURNISSEUR','Un crédit fournisseur reste ouvert : distinguer la dette du groupe de la dette privée et planifier son règlement.']);
      if(!records.some(x=>x.data.businessKind==='SCENARIO'))alerts.push(['PLAN','Aucune étude de faisabilité complète : calculez prudent / central / optimiste avant de fixer les frais.']);
      if(!alerts.length)alerts.push(['SUIVI','Aucune alerte prioritaire détectée. Continuez à suivre prospects, impayés, coûts, fournisseurs et marge.']);
      for(const [tag,msg] of alerts){const a=el('article',undefined,'item');a.append(el('span',tag,'pill'),el('p',msg));guidance.append(a);}

      const breakdown=el('details');breakdown.append(el('summary','Lire la structure des recettes et dépenses'));const b=el('div',undefined,'two-col'),rev=el('div'),exp=el('div');rev.append(el('h4','Recettes privées par origine'));exp.append(el('h4','Dépenses par catégorie'));for(const [k,v] of Object.entries(s.revenueBySource??{}))rev.append(row(k,money(v)));for(const [k,v] of Object.entries(s.expenseByCategory??{}))exp.append(row(k,money(v)));if(!(Object.keys(s.revenueBySource??{}).length))rev.append(el('p','Aucune recette directe.','hint'));if(!(Object.keys(s.expenseByCategory??{}).length))exp.append(el('p','Aucune dépense.','hint'));b.append(rev,exp);breakdown.append(b);guidance.append(breakdown);

      const recordsTitle=el('h3','Dossiers opérationnels');list.append(recordsTitle);
      if(!records.filter(x=>x.data.businessKind!=='WORKSPACE').length)list.append(el('p','Aucun dossier Business Studio pour le moment.','hint'));
      for(const r of records.filter(x=>x.data.businessKind!=='WORKSPACE').slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,80)){
        const c=el('article',undefined,'item'),kind=String(r.data.businessKind??'DOSSIER');c.append(el('strong',r.title),el('span',kind+' · '+String(r.status),'pill'));
        if(kind==='MANDATE'){c.append(el('p','État : '+String(r.data.mandateState??'DRAFT')+' · honoraires '+money(r.data.feeAmount),'hint'));if(r.data.mandateState==='DRAFT'){const b=el('button','Activer le mandat','secondary');b.type='button';b.onclick=()=>void app.activateBusinessMandate(r.id).then(()=>{notify('Mandat activé.');return refresh();}).catch(showError);c.append(b);}}
        if(kind==='CLIENT')c.append(el('p','Relation : '+String(r.data.clientState??'PROSPECT'),'hint'));
        if(kind==='QUOTE')c.append(el('p','Devis : '+money(r.data.total)+' · '+String(r.data.quoteState),'hint'));
        if(kind==='INVOICE')c.append(el('p','Facture : '+money(r.data.amount)+' · reçu '+money(r.data.receivedAmount)+' · '+String(r.data.invoiceState),'hint'));
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
