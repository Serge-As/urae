const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
/** A deliberate handoff to Governance and the kernel task owner. No vote or payment is inferred. */
export async function openForumDecision({app,post,hubId,notify,showError}){
  const scope=JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]),valid=()=>scope===JSON.stringify([app.currentActor(),app.currentTenant(),app.activeGroup()]);
  const members=await app.listMembers();if(!valid())return;
  const d=el('dialog');d.className='eco-number-dialog eco-forum-decision';const title=el('h2','De la discussion à une décision'),notice=el('p','Vous préparez un brouillon gouverné. Le vote, les seuils et toute exécution financière restent soumis aux parcours habituels. L’affectation est une tâche de suivi sans montant.');
  const form=el('form');form.className='form-grid';const field=(label,input)=>{const l=el('label',label);l.append(input);form.append(l);return input;};
  const name=field('Intitulé',el('input'));name.required=true;name.maxLength=180;name.value=post.title||post.body.slice(0,100);
  const subject=field('Objet et contexte',el('textarea'));subject.required=true;subject.rows=4;subject.value=post.body;
  const threshold=field('Nombre d’accords requis',el('input'));threshold.type='number';threshold.min='1';threshold.step='1';threshold.value='2';threshold.required=true;
  const assignee=field('Responsable du suivi',el('select'));assignee.required=true;assignee.append(new Option('Choisir un membre',''));for(const m of members.filter(x=>x.status==='active'))assignee.append(new Option(m.displayName,m.id));
  const due=field('Échéance du suivi',el('input'));due.type='date';due.required=true;
  const status=el('p');status.setAttribute('role','status');const submit=el('button','Préparer la décision et son suivi');submit.type='submit';submit.className='primary';const close=el('button','Fermer');close.type='button';close.onclick=()=>{d.close();d.remove();};form.append(submit);d.append(title,notice,form,status,close);document.body.append(d);d.showModal();
  let decision=null,task=null,published=false;
  form.onsubmit=e=>void(async()=>{e.preventDefault();if(!valid()){status.textContent='Le compte ou le groupe a changé. Rouvrez cette discussion.';return;}submit.disabled=true;try{
    const reference='forum:'+hubId+':'+post.id;
    if(!decision)decision=await app.createGovernanceDecision({title:name.value,subject:subject.value+'\nDiscussion source : '+reference,threshold:Number(threshold.value),operationFingerprint:reference});
    if(!valid())return;status.textContent='Brouillon de décision créé : '+decision.id;
    if(!task)task=await app.createObligation({membershipId:assignee.value,type:'GOVERNANCE_FOLLOW_UP',title:'Suivi de décision · '+name.value,dueAt:new Date(due.value+'T18:00:00').toISOString(),sourceId:decision.id});
    if(!valid())return;
    if(!published){await app.createForumMessage(hubId,{kind:'DISCUSSION',parentId:post.id,body:'Décision préparée : '+name.value+'\nRéférence : '+decision.id+'\nÉtat : brouillon à soumettre au vote.\nResponsable : '+members.find(x=>x.id===assignee.value)?.displayName+'\nÉchéance : '+due.value+'\nLes preuves d’exécution peuvent être ajoutées en réponse à ce fil. Aucun paiement effectué.'});published=true;}
    if(!valid())return;status.textContent='Décision en brouillon et suivi enregistrés. Le responsable retrouve sa tâche dans À faire. Les preuves se joignent à ce fil.';submit.hidden=true;const open=el('button','Ouvrir Gouvernance · décisions');open.type='button';open.className='secondary';open.dataset.moduleOpen='GOVERNANCE.VOTE';open.onclick=()=>{d.close();d.remove();};d.append(open);notify('Brouillon préparé · aucune approbation ni dépense automatique.');
  }catch(error){if(valid()){status.textContent=(decision?'Le brouillon '+decision.id+' est conservé. ':'')+'La préparation n’est pas terminée ; réessayez pour poursuivre sans recréer les étapes déjà réussies.';showError(error);submit.disabled=false;}}})();
}
