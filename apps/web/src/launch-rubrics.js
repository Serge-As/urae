import {validateLaunchRubrics} from '../../../packages/rubrics/src/launch-config.js';

const el=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;};
const key=()=>crypto.randomUUID();
export const activityLabels={CONTRIBUTION:'Collection / Aide locale / Ration',TONTINE:'Tontine / Cotisation',SAVINGS:'Épargne',SOLIDARITY:'Secours / Solidarité / Assurance',TRANSPORT:'Transport',REPAYMENT:'Remboursement',LOAN:'Prêt',ASSISTANCE:'Assistance',LEVY:'Main levée',OFFICE:'Fonctionnement du Bureau',OTHER:'Autres'};
const units={DAYS:'jours',WEEKS:'semaines',MONTHS:'mois',YEARS:'années',SESSIONS:'tours / séances'};
const field=(root,label,value='',options)=>{
  const wrap=el('label',label),input=el(options?'select':'input');
  if(options)for(const [v,t]of options){const o=el('option',t);o.value=v;input.append(o);}
  else input.type='text';
  input.value=String(value??'');input.required=true;wrap.append(input);root.append(wrap);return input;
};
const number=(root,label,value,min=1)=>{const input=field(root,label,value);input.type='number';input.min=String(min);input.step='1';return input;};
const button=(root,text,run)=>{const b=el('button',text,'secondary');b.type='button';b.onclick=run;root.append(b);return b;};

export function createRubricEditor(root,{plan,initialName='',initialKind='',initialContributionMode='MONEY',onChange=()=>{},onRemove}={}){
  const card=el('fieldset',null,'launch-rubric'),head=el('legend','Rubrique personnalisée');card.append(head);root.append(card);
  const identity=el('div',null,'form-grid');card.append(identity);
  const kind=field(identity,'Cette rubrique sert à…',plan?.kind??initialKind,[['','Choisir la nature de la rubrique'],...Object.entries(activityLabels)]);
  const name=field(identity,'Nom utilisé dans votre association',plan?.name??initialName);name.maxLength=120;name.placeholder='Votre propre nom pour cette rubrique';
  const config=el('fieldset',null,'form-grid rubric-settings');card.append(config);config.append(el('legend','Caractéristiques de cette rubrique'));
  const context=el('details',null,'full');context.open=true;context.append(el('summary','Contexte de cette rubrique'));config.append(context);
  const contextFields=el('div',null,'form-grid');context.append(contextFields);
  const participation=field(contextFields,'Qui participe à cette rubrique ?',plan?.participationMode??'OPTIONAL',[['OPTIONAL','Participation libre / volontaire'],['MANDATORY','Tous les membres concernés doivent participer'],['RULE_BASED','Selon une règle ou une catégorie du groupe']]);
  const contributionMode=field(contextFields,'Que verse-t-on ?',plan?.contributionMode??initialContributionMode,[['MONEY','Argent'],['IN_KIND','En nature'],['MIXED','Argent + nature']]);
  const contributionLabel=field(contextFields,'Nature / article',plan?.contributionLabel??'');contributionLabel.required=false;contributionLabel.placeholder='Ex. savon, huile, drap, sac de riz…';contributionLabel.maxLength=120;
  const contributionUnit=field(contextFields,'Unité',plan?.contributionUnit??'unité');contributionUnit.required=false;contributionUnit.placeholder='Ex. pièce, litre, paquet…';contributionUnit.maxLength=60;
  const contributionQuantity=number(contextFields,'Quantité par part / versement',plan?.contributionQuantity??1,0);contributionQuantity.step='0.01';
  const contextNoteWrap=el('label','Règle / contexte propre à cette rubrique');const contextNote=el('textarea');contextNote.rows=2;contextNote.maxLength=1000;contextNote.required=false;contextNote.value=plan?.contextNote??'';contextNote.placeholder='Ex. réservée aux volontaires, remise le 1er dimanche, bénéficiaire choisit la marque…';contextNoteWrap.append(contextNote);contextFields.append(contextNoteWrap);
  const amount=number(config,'Montant nominal par versement (XAF)',plan?.nominalAmount?.amount??'',0);
  const basis=field(config,'Ce montant est dû pour…',plan?.amountBasis??'PER_MEMBER',[['PER_MEMBER','Chaque membre'],['PER_SHARE','Chaque nom / part']]);
  const members=number(config,'Nombre de membres participant à cette rubrique',plan?.memberCount??'');
  const shares=number(config,'Nombre total de noms / parts',plan?.shareCount??'');
  const pots=number(config,'Pots servis par tour',plan?.potCount??'');
  const sessions=number(config,'Nombre de tours / versements dans le cycle',plan?.sessions??'');
  const duration=number(config,'Durée du cycle',plan?.duration.value??'');
  const durationUnit=field(config,'Unité de durée',plan?.duration.unit??'MONTHS',Object.entries(units));
  const explanation=el('p','Un nom / une part donne droit à un pot sur le cycle. Un membre peut avoir plusieurs parts et bénéficier de plusieurs pots au même tour.','hint full');config.append(explanation);
  const costs=el('details',null,'full');costs.append(el('summary','Frais et coûts prévisionnels (facultatif)'));config.append(costs);
  const costFields=el('div',null,'form-grid');costs.append(costFields);
  const fees=number(costFields,'Frais de gestion par versement / unité (XAF)',plan?.managementFeePerPayment??0,0);
  const external=number(costFields,'Coûts externes (%)',(plan?.estimatedExternalCostRate??0)*100,0);external.max='100';external.step='0.01';
  const fixed=number(costFields,'Coût fixe par tour / séance (XAF)',plan?.fixedCostPerSession??0,0);
  const roster=el('details',null,'full');config.append(roster);roster.append(el('summary','Prévoir les parts et les bénéficiaires (facultatif)'));
  roster.append(el('p','Préparation du cycle : ces noms ne créent pas de comptes ni d’adhésions. Laissez le tour vide si le passage de cette part reste à programmer.','hint'));
  const peopleRoot=el('div',null,'stack');roster.append(peopleRoot);const people=[];
  const addPerson=(person)=>{
    const box=el('fieldset',null,'plan-member');box.append(el('legend','Participant prévu'));peopleRoot.append(box);
    const personName=field(box,'Nom du participant',person?.name??'');personName.maxLength=120;
    const rowRoot=el('div',null,'stack');box.append(rowRoot);const rows=[];
    const addShare=(share)=>{
      const row=el('div',null,'share-row');rowRoot.append(row);
      const label=field(row,'Nom de cette part',share?.name??`Part ${rows.length+1}`);label.maxLength=120;
      const turn=number(row,'Tour de bénéfice',share?.turn??'');turn.required=false;turn.placeholder='À programmer';
      const state={key:share?.key??key(),row,read:()=>({key:state.key,name:label.value.trim(),turn:turn.value===''?undefined:Number(turn.value)})};rows.push(state);
      button(row,'Retirer la part',()=>{rows.splice(rows.indexOf(state),1);row.remove();onChange();});
    };
    for(const s of person?.shares??[undefined])addShare(s);
    button(box,'+ Ajouter une part à ce membre',()=>{addShare();onChange();});
    const state={key:person?.key??key(),read:()=>({key:state.key,name:personName.value.trim(),shares:rows.map(r=>r.read())})};people.push(state);
    button(box,'Retirer le participant',()=>{people.splice(people.indexOf(state),1);box.remove();onChange();});
  };
  for(const person of plan?.participants??[])addPerson(person);
  button(roster,'+ Prévoir un participant',()=>{addPerson();onChange();});
  const sync=()=>{
    const ready=Boolean(kind.value&&name.value.trim()),tontine=kind.value==='TONTINE',inKind=contributionMode.value==='IN_KIND',mixed=contributionMode.value==='MIXED';config.hidden=!ready;config.disabled=!ready;
    if(tontine)basis.value='PER_SHARE';basis.options[0].disabled=tontine;
    shares.parentElement.hidden=basis.value!=='PER_SHARE';shares.disabled=basis.value!=='PER_SHARE';
    pots.parentElement.hidden=!tontine;pots.disabled=!tontine;
    explanation.hidden=!tontine;roster.hidden=!tontine;
    contributionLabel.parentElement.hidden=contributionMode.value==='MONEY';
    contributionUnit.parentElement.hidden=contributionMode.value==='MONEY';
    contributionQuantity.parentElement.hidden=contributionMode.value==='MONEY';
    contributionLabel.required=inKind||mixed;contributionQuantity.required=inKind||mixed;
    amount.parentElement.hidden=inKind;amount.required=!inKind;if(inKind)amount.value='0';
    for(const input of roster.querySelectorAll('input,select,button'))input.disabled=!tontine;
    head.textContent=name.value.trim()||'Rubrique personnalisée';
  };
  card.addEventListener('input',()=>{sync();onChange();});sync();
  if(onRemove)button(card,'Supprimer cette rubrique',()=>onRemove());
  const planKey=plan?.key??key();
  return{card,focus:()=>kind.focus(),read:()=>({key:planKey,name:name.value.trim(),kind:kind.value,nominalAmount:{currency:plan?.nominalAmount?.currency??'XAF',amount:Number(amount.value||0)},amountBasis:basis.value,participationMode:participation.value,contributionMode:contributionMode.value,contributionLabel:contributionMode.value==='MONEY'?undefined:contributionLabel.value.trim(),contributionUnit:contributionMode.value==='MONEY'?undefined:contributionUnit.value.trim(),contributionQuantity:contributionMode.value==='MONEY'?undefined:Number(contributionQuantity.value),contextNote:contextNote.value.trim()||undefined,memberCount:Number(members.value),shareCount:basis.value==='PER_SHARE'?Number(shares.value):undefined,potCount:kind.value==='TONTINE'?Number(pots.value):undefined,sessions:Number(sessions.value),duration:{value:Number(duration.value),unit:durationUnit.value},managementFeePerPayment:Number(fees.value),estimatedExternalCostRate:Number(external.value)/100,fixedCostPerSession:Number(fixed.value),participants:kind.value==='TONTINE'?people.map(p=>p.read()):undefined})};
}

export const readRubricEditors=editors=>validateLaunchRubrics(editors.map(editor=>editor.read()));
export function describeRubricPlan(plan){
  const parts=plan.amountBasis==='PER_SHARE'?' · '+plan.shareCount+' parts':'';
  const pots=plan.kind==='TONTINE'?' · '+plan.potCount+' pots par tour':'';
  const participation=plan.participationMode==='MANDATORY'?'obligatoire':plan.participationMode==='RULE_BASED'?'selon règle':'libre';
  let contribution;
  if(plan.contributionMode==='IN_KIND')contribution=String(plan.contributionQuantity??1)+' '+String(plan.contributionUnit??'unité')+' de '+String(plan.contributionLabel??'nature');
  else if(plan.contributionMode==='MIXED')contribution=plan.nominalAmount.amount.toLocaleString('fr-FR')+' '+plan.nominalAmount.currency+' + '+String(plan.contributionQuantity??1)+' '+String(plan.contributionUnit??'unité')+' de '+String(plan.contributionLabel??'nature');
  else contribution=plan.nominalAmount.amount.toLocaleString('fr-FR')+' '+plan.nominalAmount.currency;
  return activityLabels[plan.kind]+' · '+contribution+' par '+(plan.amountBasis==='PER_SHARE'?'part':'membre')+' · participation '+participation+' · '+plan.memberCount+' participants'+parts+pots+' · '+plan.sessions+' versements · durée : '+plan.duration.value+' '+units[plan.duration.unit];
}

export function editRubricPlan(rubric,save,onError){
  const dialog=el('dialog',null,'rubric-dialog');const form=el('form');dialog.append(form);
  form.append(el('h2',`Configurer ${rubric.name}`));
  const editor=createRubricEditor(form,{plan:rubric.activityPlan,initialName:rubric.name});
  const status=el('p');status.setAttribute('role','status');form.append(status);
  const submit=el('button','Enregistrer les caractéristiques','primary');submit.type='submit';form.append(submit);
  button(form,'Fermer',()=>dialog.close());
  form.onsubmit=async event=>{event.preventDefault();if(submit.disabled)return;try{const [plan]=readRubricEditors([editor]);submit.disabled=true;await save(plan);dialog.close();}catch(error){status.textContent=onError(error);submit.disabled=false;}};
  dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
}
