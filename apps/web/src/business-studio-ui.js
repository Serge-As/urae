const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const money=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(n||0))+' F CFA';
const field=(label,type='text',name=label)=>{const l=el('label',label);const i=document.createElement('input');i.type=type;i.name=name;l.append(i);return{label:l,input:i};};
const selectField=(label,name,options)=>{const l=el('label',label),s=document.createElement('select');s.name=name;for(const [v,t] of options){const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);}l.append(s);return{label:l,input:s};};

export function mountBusinessStudioUI({app,notify=()=>{},showError=console.error}){
  const marketHub=document.getElementById('marketHub');if(!marketHub)return{refresh:async()=>{}};
  const root=el('details',undefined,'panel');root.id='businessStudioOperational';root.open=false;
  const summary=document.createElement('summary');summary.append(el('strong','Business Studio · activité professionnelle réelle'),el('span',' Mandats · clients · devis · factures · coûts · temps · marge','hint'));root.append(summary);
  const intro=el('p','Cet espace est privé au gestionnaire. Les dépenses collectives restent dans le Ledger du groupe ; Business Studio ne conserve que leur référence lorsqu’un mandat professionnel les concerne.','truth-notice');root.append(intro);
  const metrics=el('div',undefined,'metrics');root.append(metrics);
  const actions=el('div',undefined,'actions');root.append(actions);
  const list=el('div',undefined,'stack');root.append(list);
  marketHub.closest('section')?.insertAdjacentElement('afterend',root);

  const button=(label,cb,cls='secondary')=>{const b=el('button',label,cls);b.type='button';b.onclick=()=>void Promise.resolve(cb()).catch(showError);actions.append(b);return b;};
  const dialogForm=async(title,fields,submitLabel='Enregistrer')=>new Promise((resolve,reject)=>{
    const d=document.createElement('dialog'),form=document.createElement('form');form.method='dialog';form.className='form-grid';form.append(el('h3',title));
    for(const f of fields)form.append(f.label);
    const row=el('div',undefined,'actions'),cancel=el('button','Annuler','link-btn'),ok=el('button',submitLabel,'primary');cancel.type='button';ok.type='submit';row.append(cancel,ok);form.append(row);d.append(form);document.body.append(d);
    cancel.onclick=()=>{d.close();d.remove();resolve(null);};
    form.onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());d.close();d.remove();resolve(data);};d.addEventListener('cancel',()=>{d.remove();resolve(null)},{once:true});d.showModal();
  });

  button('Configurer mon activité',async()=>{
    const n=field('Nom de l’activité','text','name'),loc=field('Localité','text','locality'),services=field('Services (séparés par virgule)','text','services'),fixed=field('Coûts fixes mensuels','number','monthlyFixedCosts');
    const d=await dialogForm('Configurer Business Studio',[n,loc,services,fixed]);if(!d)return;
    await app.configureBusiness({name:d.name,locality:d.locality,services:String(d.services).split(',').map(x=>x.trim()).filter(Boolean),monthlyFixedCosts:Number(d.monthlyFixedCosts||0)});notify('Activité professionnelle mise à jour.');await refresh();
  },'primary');

  button('Nouveau mandat',async()=>{
    if(!app.activeGroup())throw new Error('ACTIVE_GROUP_REQUIRED');
    const srv=field('Services du mandat','text','services'),start=field('Début','date','startsAt'),end=field('Fin facultative','date','endsAt'),model=selectField('Honoraires','feeModel',[['FIXED','Forfait'],['PER_SESSION','Par séance'],['PERCENT_SANDBOX','Pourcentage (simulation)'],['CUSTOM','Personnalisé']]),fee=field('Montant / base honoraires','number','feeAmount');
    const d=await dialogForm('Créer un mandat pour le groupe actif',[srv,start,end,model,fee]);if(!d)return;
    await app.createBusinessMandate({groupId:app.activeGroup(),services:String(d.services).split(',').map(x=>x.trim()).filter(Boolean),startsAt:d.startsAt,endsAt:d.endsAt||undefined,feeModel:d.feeModel,feeAmount:Number(d.feeAmount||0),currency:'XAF'});notify('Mandat créé en brouillon.');await refresh();
  });

  button('Nouveau client',async()=>{
    const n=field('Nom / organisation','text','name'),type=selectField('Type','type',[['GROUP','Groupe'],['PERSON','Personne'],['BUSINESS','Entreprise'],['NGO','ONG'],['OTHER','Autre']]),contact=field('Référence de contact','text','contactRef');
    const d=await dialogForm('Créer un prospect / client',[n,type,contact]);if(!d)return;
    await app.createBusinessClient({name:d.name,type:d.type,contactRef:d.contactRef,consentToContact:false});notify('Prospect créé.');await refresh();
  });

  button('Nouvelle dépense',async()=>{
    const n=field('Libellé','text','label'),amount=field('Montant','number','amount'),cat=selectField('Catégorie','category',[['TRAVEL','Déplacement'],['SUPPLIES','Fournitures'],['TRAINING','Formation'],['COMMUNICATION','Communication'],['LABOUR','Main-d’œuvre'],['OTHER','Autre']]);
    const d=await dialogForm('Enregistrer un coût professionnel',[n,amount,cat]);if(!d)return;
    await app.recordBusinessExpense({label:d.label,amount:Number(d.amount),category:d.category,currency:'XAF'});notify('Dépense enregistrée.');await refresh();
  });

  button('Simuler rentabilité',async()=>{
    const name=field('Scénario','text','name'),rev=field('Recettes mensuelles','number','monthlyRevenue'),varc=field('Coûts variables mensuels','number','monthlyVariableCosts'),fixed=field('Coûts fixes mensuels','number','monthlyFixedCosts'),months=field('Nombre de mois','number','months');
    const d=await dialogForm('Scénario de rentabilité',[name,rev,varc,fixed,months]);if(!d)return;
    await app.createBusinessScenario({name:d.name,monthlyRevenue:Number(d.monthlyRevenue),monthlyVariableCosts:Number(d.monthlyVariableCosts),monthlyFixedCosts:Number(d.monthlyFixedCosts),months:Number(d.months)});notify('Scénario créé sans écriture financière.');await refresh();
  });

  const refresh=async()=>{
    metrics.replaceChildren();list.replaceChildren();
    try{
      const [s,records]=await Promise.all([app.businessSummary(),app.businessRecords()]);
      for(const [label,value] of [['Facturé',money(s.invoiced)],['Reçu',money(s.received)],['Dépenses',money(s.expenses)],['Marge',money(s.margin)],['Impayés',money(s.outstanding)],['Mandats actifs',String(s.activeMandates)],['Clients actifs',String(s.activeClients)],['Heures',Number(s.hours||0).toFixed(1)]]){const c=el('article',undefined,'metric');c.append(el('span',label),el('strong',value));metrics.append(c);}
      if(!records.length)list.append(el('p','Aucun dossier Business Studio pour le moment.','hint'));
      for(const r of records.filter(x=>x.data.businessKind!=='WORKSPACE').slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,30)){
        const c=el('article',undefined,'item'),kind=String(r.data.businessKind??'DOSSIER');c.append(el('strong',r.title),el('span',kind+' · '+String(r.status),'pill'));
        if(kind==='MANDATE'){c.append(el('p','État : '+String(r.data.mandateState??'DRAFT')+' · honoraires '+money(r.data.feeAmount),'hint'));if(r.data.mandateState==='DRAFT'){const b=el('button','Activer','secondary');b.type='button';b.onclick=()=>void app.activateBusinessMandate(r.id).then(()=>{notify('Mandat activé.');return refresh();}).catch(showError);c.append(b);}}
        if(kind==='CLIENT')c.append(el('p','Relation : '+String(r.data.clientState??'PROSPECT'),'hint'));
        if(kind==='QUOTE')c.append(el('p','Total : '+money(r.data.total)+' · '+String(r.data.quoteState),'hint'));
        if(kind==='INVOICE')c.append(el('p','Facture : '+money(r.data.amount)+' · reçu '+money(r.data.receivedAmount)+' · '+String(r.data.invoiceState),'hint'));
        if(kind==='EXPENSE')c.append(el('p',money(r.data.amount)+' · '+String(r.data.category),'hint'));
        if(kind==='SCENARIO')c.append(el('p','Résultat projeté : '+money(r.data.projectedProfit)+' · simulation uniquement','hint'));
        list.append(c);
      }
    }catch(e){list.append(el('p','Business Studio indisponible : '+String(e?.message??e),'hint'));}
  };
  root.addEventListener('toggle',()=>{if(root.open)void refresh();});
  document.addEventListener('eco:group-context-changed',()=>{if(root.open)void refresh();});
  return{refresh};
}
