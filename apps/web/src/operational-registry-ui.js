const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const isoDate=v=>v?new Date(String(v)+'T23:59:59').toISOString():'';
const safeJson=(v,fallback)=>{try{return JSON.parse(String(v??''));}catch{return fallback;}};

export function mountOperationalRegistryUI({app,getGroups=()=>[],getMembers=()=>[],getRubrics=()=>[],isManager=()=>false,notify=()=>{},showError=()=>{}}={}){
  const settings=document.querySelector('#view-settings');if(!settings||document.querySelector('#operationalRegistryCenter'))return{refresh:async()=>{}};
  const root=el('section',undefined,'panel');root.id='operationalRegistryCenter';
  root.append(el('div','Mémoire opérationnelle gouvernée','eyebrow'),el('h2','Registres, exceptions & Time Machine'),el('p','Ces registres documentent des décisions et snapshots. Ils ne modifient jamais automatiquement le Ledger, une règle active, un rôle membre ou un droit à l’argent.','truth-notice'));
  const tabs=el('div',undefined,'view-switch compact'),body=el('div',undefined,'stack');root.append(tabs,body);
  const sections=[
    ['models','Modèles'],['cases','Jurisprudence'],['exceptions','Exceptions'],['time','Time Machine'],['succession','Contacts succession · préparation']
  ];
  let active='models';
  for(const [id,label] of sections){const b=el('button',label,id===active?'active':'');b.type='button';b.dataset.opRegistryTab=id;b.onclick=()=>{active=id;for(const x of tabs.querySelectorAll('button'))x.classList.toggle('active',x===b);void render();};tabs.append(b);}
  const hardening=document.querySelector('#hardeningHub')?.closest('section.panel');settings.insertBefore(root,hardening??null);

  const group=()=>getGroups().find(g=>g.id===app.activeGroup());
  const createForm=(title,fields,submitLabel,onSubmit)=>{
    const wrap=el('section',undefined,'item'),form=document.createElement('form');form.className='form-grid';wrap.append(el('h3',title),form);
    const controls={};
    for(const spec of fields){
      const label=el('label',spec.label);if(spec.full)label.className='full';let input;
      if(spec.type==='select'){input=document.createElement('select');for(const [v,t] of spec.options??[]){const o=new Option(t,v);input.append(o);}}
      else if(spec.type==='textarea'){input=document.createElement('textarea');input.rows=spec.rows??3;}
      else{input=document.createElement('input');input.type=spec.type??'text';}
      input.name=spec.name;if(spec.required)input.required=true;if(spec.placeholder)input.placeholder=spec.placeholder;label.append(input);form.append(label);controls[spec.name]=input;
    }
    const submit=el('button',submitLabel,'primary');submit.type='submit';form.append(submit);
    form.onsubmit=e=>void(async()=>{e.preventDefault();try{submit.disabled=true;const data={};for(const [k,v] of Object.entries(controls))data[k]=v instanceof HTMLInputElement&&v.type==='checkbox'?v.checked:v.value;await onSubmit(data);form.reset();await render();}catch(err){showError(err);}finally{submit.disabled=false;}})();
    return wrap;
  };
  const actions=(record,items)=>{const box=el('div',undefined,'actions');for(const [label,fn,cls='secondary'] of items){const b=el('button',label,cls);b.type='button';b.onclick=()=>void Promise.resolve(fn(record)).then(render).catch(showError);box.append(b);}return box;};

  const renderModels=async()=>{
    const g=group();body.append(createForm('Enregistrer le modèle actuel',[
      {name:'name',label:'Nom du modèle',required:true,placeholder:'Ex. Association épargne + secours'},
      {name:'evidenceRef',label:'Preuve / source',placeholder:'RI, PV, document de référence'},
      {name:'note',label:'Quand utiliser ce modèle ?',type:'textarea',full:true}
    ],'Enregistrer le modèle',async d=>{
      if(!g)throw Error('ACTIVE_GROUP_REQUIRED');
      await app.createWorkspaceRecord({moduleId:'GROUP.MODEL_REGISTRY',groupId:g.id,title:d.name,summary:d.note||'Modèle opérationnel documenté.',status:'ACTIVE',tags:['group-model','source:'+g.id],data:{registryKind:'GROUP_MODEL',sourceGroupId:g.id,family:String(g.kind??''),evidenceRef:String(d.evidenceRef??''),modelState:'ACTIVE',version:1}});
      notify('Modèle enregistré sans modifier le groupe actif.');
    }));
    const rows=await app.listWorkspaceRecords('GROUP.MODEL_REGISTRY',g?.id);if(!rows.length)body.append(el('p','Aucun modèle enregistré pour ce groupe.','empty-state'));
    for(const r of rows){const c=el('article',undefined,'item');c.append(el('strong',r.title),el('span',String(r.data.family??''),'pill'),el('p',r.summary??'','hint'));if(r.status!=='ARCHIVED')c.append(actions(r,[['Archiver',x=>app.updateWorkspaceRecord(x.id,{status:'ARCHIVED',data:{...x.data,modelState:'ARCHIVED'}}),'link-btn']]));body.append(c);}
  };

  const renderCases=async()=>{
    const g=group();body.append(createForm('Documenter une jurisprudence métier',[
      {name:'title',label:'Cas / titre',required:true},{name:'situation',label:'Situation rencontrée',type:'textarea',required:true,full:true},
      {name:'decision',label:'Décision prise',type:'textarea',required:true,full:true},{name:'evidenceRef',label:'Preuve / PV / source',required:true}
    ],'Créer le cas',async d=>{
      if(!g)throw Error('ACTIVE_GROUP_REQUIRED');
      await app.createWorkspaceRecord({moduleId:'GROUP.CASE_LAW',groupId:g.id,title:d.title,summary:d.situation,status:'DRAFT',tags:['case-law','needs-review'],data:{caseState:'DRAFT',decision:String(d.decision),evidenceRef:String(d.evidenceRef),sourceGroupId:g.id,version:1,autoRuleActivation:false}});
      notify('Cas créé en brouillon. Aucune règle n’a été activée.');
    }));
    const rows=await app.listWorkspaceRecords('GROUP.CASE_LAW',g?.id);if(!rows.length)body.append(el('p','Aucun précédent métier documenté.','empty-state'));
    for(const r of rows){const c=el('article',undefined,'item');c.append(el('strong',r.title),el('span',String(r.data.caseState??r.status),'pill'),el('p',r.summary??''),el('p','Décision : '+String(r.data.decision??''),'hint'),el('small','Preuve : '+String(r.data.evidenceRef??'—')+' · aucune activation automatique de règle'));const a=[];if(r.data.caseState==='DRAFT')a.push(['Valider le précédent',x=>app.updateWorkspaceRecord(x.id,{status:'ACTIVE',tags:['case-law','validated'],data:{...x.data,caseState:'VALIDATED',validatedAt:new Date().toISOString(),autoRuleActivation:false}}),'primary']);if(r.status!=='ARCHIVED')a.push(['Archiver',x=>app.updateWorkspaceRecord(x.id,{status:'ARCHIVED',data:{...x.data,caseState:'ARCHIVED'}}),'link-btn']);if(a.length)c.append(actions(r,a));body.append(c);}
  };

  const renderExceptions=async()=>{
    const g=group(),rubrics=getRubrics().filter(r=>r.status==='ACTIVE');body.append(createForm('Proposer une exception gouvernée',[
      {name:'title',label:'Titre',required:true},{name:'rubricId',label:'Rubrique',type:'select',options:[['','Choisir'],...rubrics.map(r=>[r.id,r.name])],required:true},
      {name:'scope',label:'Portée',type:'select',options:[['GROUP','Groupe'],['MEMBER','Membre'],['MEETING','Séance']]},{name:'targetRef',label:'Référence ciblée',placeholder:'ID membre/séance si nécessaire'},
      {name:'reason',label:'Motif',type:'textarea',required:true,full:true},{name:'validUntil',label:'Valable jusqu’au',type:'date'}
    ],'Proposer l’exception',async d=>{
      if(!g)throw Error('ACTIVE_GROUP_REQUIRED');
      await app.createWorkspaceRecord({moduleId:'RUBRIC.EXCEPTIONS',groupId:g.id,title:d.title,summary:d.reason,status:'DRAFT',tags:['rubric-exception','state:PROPOSED'],data:{exceptionState:'PROPOSED',rubricId:String(d.rubricId),scope:String(d.scope),targetRef:String(d.targetRef??''),validUntil:isoDate(d.validUntil),reason:String(d.reason),createsLedgerEntry:false,version:1}});
      notify('Exception proposée. Elle n’a encore aucun effet opérationnel.');
    }));
    const rows=await app.listWorkspaceRecords('RUBRIC.EXCEPTIONS',g?.id);if(!rows.length)body.append(el('p','Aucune exception documentée.','empty-state'));
    for(const r of rows){const rubric=rubrics.find(x=>x.id===r.data.rubricId),c=el('article',undefined,'item');c.append(el('strong',r.title),el('span',String(r.data.exceptionState??r.status),'pill'),el('p',(rubric?.name??String(r.data.rubricId??''))+' · '+String(r.data.scope??'GROUP'),'hint'),el('p',r.summary??''),el('small','Cette exception ne crée aucune écriture financière.'));const a=[];if(r.data.exceptionState==='PROPOSED')a.push(['Approuver',x=>app.updateWorkspaceRecord(x.id,{status:'ACTIVE',tags:['rubric-exception','state:APPROVED'],data:{...x.data,exceptionState:'APPROVED',approvedAt:new Date().toISOString(),createsLedgerEntry:false}}),'primary']);if(r.status!=='ARCHIVED')a.push(['Clore',x=>app.updateWorkspaceRecord(x.id,{status:'ARCHIVED',data:{...x.data,exceptionState:'CLOSED',closedAt:new Date().toISOString()}}),'link-btn']);c.append(actions(r,a));body.append(c);}
  };

  const renderTime=async()=>{
    const g=group(),capture=el('button','Créer un snapshot maintenant','primary');capture.type='button';capture.onclick=()=>void(async()=>{try{
      if(!g)throw Error('ACTIVE_GROUP_REQUIRED');const ledger=await app.ledger().catch(()=>null),snapshot={capturedAt:new Date().toISOString(),groupId:g.id,groupName:g.name,groupKind:g.kind,members:getMembers().filter(x=>x.status==='active').length,rubrics:getRubrics().filter(x=>x.status==='ACTIVE').length,meetings:(await app.listMeetings()).length,cashBalance:Number(ledger?.summary?.cashBalance??0),entryCount:Number(ledger?.summary?.entryCount??ledger?.entries?.length??0),receiptCount:Number(ledger?.receipts?.length??0)};
      await app.createWorkspaceRecord({moduleId:'DATA.TIME_MACHINE',groupId:g.id,title:'Snapshot · '+new Date(snapshot.capturedAt).toLocaleString('fr-FR'),summary:'Image de lecture non destructive du groupe.',status:'DONE',tags:['time-machine','read-only-snapshot'],data:{snapshotJson:JSON.stringify(snapshot),capturedAt:snapshot.capturedAt,readOnly:true,rollbackSupported:false}});
      notify('Snapshot Time Machine enregistré. Aucun rollback automatique n’est autorisé.');await render();
    }catch(err){showError(err);}})();body.append(capture,el('p','Time Machine conserve des snapshots de lecture pour comparaison. Restaurer le passé automatiquement est volontairement interdit afin de protéger le Ledger.','truth-notice'));
    const rows=(await app.listWorkspaceRecords('DATA.TIME_MACHINE',g?.id)).sort((a,b)=>String(b.data.capturedAt??b.createdAt).localeCompare(String(a.data.capturedAt??a.createdAt)));if(!rows.length)body.append(el('p','Aucun snapshot.','empty-state'));
    for(const r of rows.slice(0,30)){const s=safeJson(r.data.snapshotJson,{}),c=el('article',undefined,'item');c.append(el('strong',r.title),el('p',String(s.members??0)+' membre(s) · '+String(s.rubrics??0)+' rubrique(s) · '+String(s.meetings??0)+' séance(s)','hint'),el('p','Caisse '+Number(s.cashBalance??0).toLocaleString('fr-FR')+' XAF · '+String(s.entryCount??0)+' écriture(s)','hint'),el('small','Lecture seule · rollback automatique : non'));body.append(c);}
    if(rows.length>=2){const a=safeJson(rows[0].data.snapshotJson,{}),b=safeJson(rows[1].data.snapshotJson,{}),d=el('article',undefined,'item');d.append(el('strong','Écart entre les deux derniers snapshots'),el('p','Membres '+(Number(a.members??0)-Number(b.members??0))+' · rubriques '+(Number(a.rubrics??0)-Number(b.rubrics??0))+' · caisse '+(Number(a.cashBalance??0)-Number(b.cashBalance??0)).toLocaleString('fr-FR')+' XAF','hint'));body.prepend(d);}
  };

  const renderSuccession=async()=>{
    const g=group(),members=getMembers().filter(m=>m.status==='active');body.append(el('p','Préparation uniquement : ce registre conserve des contacts et preuves déclarés. Il ne réalise pas une succession, ne désigne pas juridiquement un ayant droit et ne transfère aucun rôle, solde ou droit financier.','truth-notice'));
    body.append(createForm('Enregistrer un contact / ayant droit déclaré',[
      {name:'membershipId',label:'Membre concerné',type:'select',options:[['','Choisir'],...members.map(m=>[m.id,m.displayName])],required:true},
      {name:'contactAlias',label:'Nom ou alias du contact',required:true},{name:'relationship',label:'Lien',required:true,placeholder:'Conjoint, enfant, frère/sœur…'},
      {name:'contactRef',label:'Référence de contact',required:true,placeholder:'Téléphone/email/référence interne'},{name:'consentRef',label:'Consentement / preuve',required:true,placeholder:'PV, formulaire signé, dossier'}
    ],'Enregistrer',async d=>{
      if(!g)throw Error('ACTIVE_GROUP_REQUIRED');
      await app.createWorkspaceRecord({moduleId:'SUCCESSION.NEXT_OF_KIN',groupId:g.id,title:'Succession · '+d.contactAlias,summary:'Contact déclaré pour '+(members.find(m=>m.id===d.membershipId)?.displayName??d.membershipId),status:'ACTIVE',tags:['next-of-kin','manager-only'],data:{membershipId:String(d.membershipId),contactAlias:String(d.contactAlias),relationship:String(d.relationship),contactRef:String(d.contactRef),consentRef:String(d.consentRef),successionState:'RECORDED',grantsMembership:false,grantsFinancialRights:false,grantsSigningAuthority:false,version:1}});
      notify('Contact de succession enregistré sans attribution automatique de droit.');
    }));
    const rows=await app.listWorkspaceRecords('SUCCESSION.NEXT_OF_KIN',g?.id);if(!rows.length)body.append(el('p','Aucun contact de succession enregistré.','empty-state'));
    for(const r of rows){const m=members.find(x=>x.id===r.data.membershipId),c=el('article',undefined,'item');c.append(el('strong',String(r.data.contactAlias??r.title)),el('p',(m?.displayName??String(r.data.membershipId??''))+' · '+String(r.data.relationship??''),'hint'),el('small','Référence : '+String(r.data.contactRef??'')+' · preuve : '+String(r.data.consentRef??'')));if(r.status!=='ARCHIVED')c.append(actions(r,[['Archiver',x=>app.updateWorkspaceRecord(x.id,{status:'ARCHIVED',data:{...x.data,successionState:'ARCHIVED'}}),'link-btn']]));body.append(c);}
  };

  const render=async()=>{
    body.replaceChildren();if(!app.activeGroup()){body.append(el('p','Sélectionnez un groupe.','empty-state'));return;}if(!isManager()){body.append(el('p','Ces registres sont réservés aux responsables habilités.','empty-state'));return;}
    try{if(active==='models')await renderModels();else if(active==='cases')await renderCases();else if(active==='exceptions')await renderExceptions();else if(active==='time')await renderTime();else await renderSuccession();}catch(e){body.append(el('p','Registre indisponible : '+String(e?.message??e),'hint'));}
  };
  document.addEventListener('eco:group-context-changed',()=>void render());
  return{refresh:render,open:(tab)=>{if(tab&&sections.some(x=>x[0]===tab)){active=tab;for(const b of tabs.querySelectorAll('button'))b.classList.toggle('active',b.dataset.opRegistryTab===tab);}root.scrollIntoView({behavior:'smooth',block:'start'});void render();}};
}
