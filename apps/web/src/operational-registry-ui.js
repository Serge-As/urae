const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n;};
const isoDate=v=>v?new Date(String(v)+'T23:59:59').toISOString():'';
const safeJson=(v,fallback)=>{try{return JSON.parse(String(v??''));}catch{return fallback;}};

export function mountOperationalRegistryUI({app,getGroups=()=>[],getMembers=()=>[],getRubrics=()=>[],isManager=()=>false,notify=()=>{},showError=()=>{}}={}){
  const settings=document.querySelector('#view-settings');if(!settings||document.querySelector('#operationalRegistryCenter'))return{refresh:async()=>{}};
  const root=el('section',undefined,'panel');root.id='operationalRegistryCenter';
  root.append(el('div','Mémoire opérationnelle gouvernée','eyebrow'),el('h2','Registres, exceptions & Time Machine'),el('p','Ces registres documentent des décisions et snapshots. Ils ne modifient jamais automatiquement le Ledger, une règle active, un rôle membre ou un droit à l’argent.','truth-notice'));
  const tabs=el('div',undefined,'view-switch compact'),body=el('div',undefined,'stack');root.append(tabs,body);
  const sections=[
    ['exceptions','Exceptions'],['time','Time Machine'],['succession','Contacts succession · préparation']
  ];
  let active='exceptions';
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

  const renderExceptions=async()=>{
    const g=group(),rubrics=getRubrics().filter(r=>r.status==='ACTIVE');body.append(createForm('Proposer une exception gouvernée',[
      {name:'title',label:'Titre',required:true},{name:'rubricId',label:'Rubrique',type:'select',options:[['','Choisir'],...rubrics.map(r=>[r.id,r.name])],required:true},
      {name:'scope',label:'Portée',type:'select',options:[['GROUP','Groupe'],['MEMBERSHIP','Membre'],['MEETING','Séance']]},{name:'targetRef',label:'Référence ciblée',placeholder:'ID membre/séance si nécessaire'},
      {name:'reason',label:'Motif',type:'textarea',required:true,full:true},{name:'effectSummary',label:'Effet exceptionnel autorisé',type:'textarea',required:true,full:true},
      {name:'evidenceRef',label:'Preuve / PV / décision',required:true},{name:'validFrom',label:'Valable à partir du',type:'date'},{name:'validUntil',label:'Valable jusqu’au',type:'date'}
    ],'Proposer l’exception',async d=>{
      if(!g)throw Error('ACTIVE_GROUP_REQUIRED');
      await app.createRubricException({rubricId:String(d.rubricId),title:String(d.title),scope:String(d.scope),targetRef:String(d.targetRef??'')||undefined,reason:String(d.reason),effectSummary:String(d.effectSummary),evidenceRef:String(d.evidenceRef),validFrom:d.validFrom?new Date(String(d.validFrom)+'T00:00:00').toISOString():undefined,validUntil:d.validUntil?isoDate(d.validUntil):undefined});
      notify('Exception proposée : elle reste sans effet tant qu’un responsable ne l’a pas approuvée.');
    }));
    const rows=await app.rubricExceptions();if(!rows.length)body.append(el('p','Aucune exception documentée.','empty-state'));
    for(const r of rows){
      const rubric=rubrics.find(x=>x.id===r.data.rubricId),state=String(r.data.exceptionState??r.status),c=el('article',undefined,'item');
      c.append(el('strong',r.title),el('span',state,'pill'),el('p',(rubric?.name??String(r.data.rubricId??''))+' · '+String(r.data.scope??'GROUP')+(r.data.targetRef?' · '+String(r.data.targetRef):''),'hint'),el('p',String(r.data.reason??r.summary??'')),el('p','Effet exceptionnel : '+String(r.data.effectSummary??'—'),'hint'),el('small','Preuve : '+String(r.data.evidenceRef??'—')+' · période : '+new Date(String(r.data.validFrom??r.createdAt)).toLocaleDateString('fr-FR')+(r.data.validUntil?' → '+new Date(String(r.data.validUntil)).toLocaleDateString('fr-FR'):' · sans date de fin')+' · aucun mouvement d’argent automatique'));
      const a=[];
      if(state==='PROPOSED'){
        a.push(['Approuver',async x=>{const note=window.prompt('Motif de validation :')?.trim();if(!note)return;await app.decideRubricException(x.id,'APPROVED',note);},'primary']);
        a.push(['Rejeter',async x=>{const note=window.prompt('Motif du rejet :')?.trim();if(!note)return;await app.decideRubricException(x.id,'REJECTED',note);},'secondary']);
      }
      if(['PROPOSED','APPROVED'].includes(state))a.push(['Clore',async x=>{const note=window.prompt('Motif de clôture :')?.trim();if(!note)return;await app.closeRubricException(x.id,note);},'link-btn']);
      if(a.length)c.append(actions(r,a));body.append(c);
    }
  };

  const renderTime=async()=>{
    const g=group();body.append(el('p','Time Machine conserve des snapshots immuables de lecture et compare l’évolution du groupe. Aucun rollback automatique n’est autorisé : le Ledger canonique reste append-only.','truth-notice'));
    const capture=createForm('Créer un snapshot',[
      {name:'label',label:'Libellé',placeholder:'Ex. Avant clôture annuelle'},
      {name:'reason',label:'Pourquoi capturer cet état ?',type:'textarea',required:true,full:true}
    ],'Capturer maintenant',async d=>{if(!g)throw Error('ACTIVE_GROUP_REQUIRED');await app.captureTimeMachine({label:String(d.label??'')||undefined,reason:String(d.reason)});notify('Snapshot immuable enregistré sans modifier le Ledger.');});
    body.append(capture);
    const rows=await app.timeMachineSnapshots();if(!rows.length){body.append(el('p','Aucun snapshot.','empty-state'));return;}
    if(rows.length>=2){
      const compare=el('section',undefined,'item'),form=document.createElement('form');form.className='form-grid';
      const fromLabel=el('label','Depuis'),from=document.createElement('select'),toLabel=el('label','Vers'),to=document.createElement('select');
      for(const r of rows){const label=r.title+' · '+new Date(String(r.data.capturedAt??r.createdAt)).toLocaleString('fr-FR');from.append(new Option(label,r.id));to.append(new Option(label,r.id));}
      from.value=rows[1].id;to.value=rows[0].id;fromLabel.append(from);toLabel.append(to);const button=el('button','Comparer','secondary');button.type='submit';const result=el('div',undefined,'stack full');form.append(fromLabel,toLabel,button,result);compare.append(el('h3','Comparer deux instants'),form);body.append(compare);
      form.onsubmit=e=>void(async()=>{e.preventDefault();result.replaceChildren();try{const d=await app.compareTimeMachine(from.value,to.value);const x=d.deltas??{};result.append(el('p','Membres '+Number(x.members??0)+' · rubriques '+Number(x.rubrics??0)+' · séances '+Number(x.meetings??0)+' · écritures '+Number(x.ledgerEntries??0)+' · caisse '+Number(x.cashBalance??0).toLocaleString('fr-FR')+' XAF','hint'),el('small','Lecture seule · rollback automatique : non'));if(d.rubrics?.added?.length)result.append(el('p','Rubriques ajoutées : '+d.rubrics.added.map(x=>x.name).join(', '),'hint'));if(d.rubrics?.removed?.length)result.append(el('p','Rubriques retirées : '+d.rubrics.removed.map(x=>x.name).join(', '),'hint'));}catch(err){showError(err);}})();
    }
    for(const r of rows.slice(0,30)){const detail=await app.timeMachineSnapshot(r.id).catch(()=>null),snap=detail?.snapshot??safeJson(r.data.snapshotJson,{}),c=el('article',undefined,'item');c.append(el('strong',r.title),el('p',String(snap?.counts?.activeMembers??0)+' membre(s) actif(s) · '+String(snap?.counts?.rubrics??0)+' rubrique(s) · '+String(snap?.counts?.meetings??0)+' séance(s)','hint'),el('p','Caisse '+Number(snap?.finance?.cashBalance??0).toLocaleString('fr-FR')+' XAF · '+String(snap?.counts?.ledgerEntries??0)+' écriture(s)','hint'),el('small','Capture : '+new Date(String(snap?.capturedAt??r.createdAt)).toLocaleString('fr-FR')+' · lecture seule'));body.append(c);}
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
    try{if(active==='exceptions')await renderExceptions();else if(active==='time')await renderTime();else await renderSuccession();}catch(e){body.append(el('p','Registre indisponible : '+String(e?.message??e),'hint'));}
  };
  document.addEventListener('eco:group-context-changed',()=>void render());
  return{refresh:render,open:(tab)=>{if(tab&&sections.some(x=>x[0]===tab)){active=tab;for(const b of tabs.querySelectorAll('button'))b.classList.toggle('active',b.dataset.opRegistryTab===tab);}root.scrollIntoView({behavior:'smooth',block:'start'});void render();}};
}
