import {createRubricEditor,readRubricEditors} from './launch-rubrics.js';
import {mountLaunchGuide} from './launch-guide-ui.js';
import {LAUNCH_GUIDE_VERSION} from './launch-draft.js';
const byId=id=>document.getElementById(id);
const value=id=>String(byId(id)?.value??'').trim();
const checked=id=>Boolean(byId(id)?.checked);
const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};

export function mountLaunchStudio({app,getGroups,getRubrics,getEditors,restoreEditors,resumeCreation,addRubric,invalidate,toast,showError}){
  let step=1;
  let guide=null;
  const fingerprints=new Set();
  const panels=[...document.querySelectorAll('[data-launch-step]')];
  const indicators=[...document.querySelectorAll('[data-launch-indicator]')];

  const showStep=next=>{
    step=Math.max(1,Math.min(10,Number(next)||1));
    for(const p of panels){
      const inactive=Number(p.dataset.launchStep)!==step;
      // Keep values and canonical draft in the DOM, but prevent controls in
      // hidden wizard steps from blocking HTML5 form submission on step 7.
      // The business simulation still validates the complete project model.
      p.hidden=inactive;
      p.disabled=inactive;
    }
    for(const i of indicators){
      const n=Number(i.dataset.launchIndicator);i.classList.toggle('active',n===step);i.classList.toggle('done',n<step);
    }
    byId('launchPrevBtn').disabled=step===1;
    byId('launchNextBtn').hidden=step===10;
    byId('launchStepStatus').textContent='Étape '+step+' sur 10';
    if(step===10)renderPreview();
    guide?.changed();
  };

  const syncOrigin=()=>{
    const mode=value('launchOrigin');
    byId('sourceGroupWrap').hidden=mode!=='TRANSFORM_REGISTERED';
    byId('historicalCreatedAtWrap').hidden=mode==='NEW';
    byId('currentExerciseLabelWrap').hidden=mode==='NEW';
    byId('historyNoteWrap').hidden=mode==='NEW';
    if(mode==='IMPORT_EXISTING'&&byId('rosterMode'))byId('rosterMode').value='HISTORICAL_RECONCILIATION';
    invalidate();
  };

  const refreshGroups=()=>{
    const select=byId('sourceGroupId');if(!select)return;const previous=select.value;select.replaceChildren();
    select.append(option('','Choisir la tontine enregistrée'));
    for(const group of getGroups().filter(g=>['rotating_tontine','in_kind_tontine','hybrid'].includes(g.kind)))select.append(option(group.id,group.name));
    if([...select.options].some(o=>o.value===previous))select.value=previous;
  };

  const communication=()=>['IN_APP','PRINT','SMS','WHATSAPP','TELEGRAM'].filter(k=>({
    IN_APP:'channelInApp',PRINT:'channelPrint',SMS:'channelSms',WHATSAPP:'channelWhatsapp',TELEGRAM:'channelTelegram'
  })[k]&&checked(({IN_APP:'channelInApp',PRINT:'channelPrint',SMS:'channelSms',WHATSAPP:'channelWhatsapp',TELEGRAM:'channelTelegram'})[k]));

  const readProfile=()=>({
    tontineVariant:value('groupKind')==='rotating_tontine'?(value('tontineVariant')||'MONEY'):undefined,
    origin:{
      mode:value('launchOrigin')||'NEW',
      sourceGroupId:value('launchOrigin')==='TRANSFORM_REGISTERED'?(value('sourceGroupId')||undefined):undefined,
      historicalCreatedAt:value('historicalCreatedAt')||undefined,
      currentExerciseLabel:value('currentExerciseLabel')||undefined,
      historyNote:value('historyNote')||undefined
    },
    cycle:{
      label:value('cycleLabel')||undefined,startsAt:value('cycleStartsAt')||undefined,
      expectedSessions:Number(value('cycleExpectedSessions')||0)||undefined,cadence:value('cycleCadence')||undefined,
      meetingDay:value('meetingDay')||undefined,physicalMeetingExpected:checked('physicalMeetingExpected')
    },
    members:{
      expectedMembers:Number(value('expectedMembers')||0)||undefined,rosterMode:value('rosterMode')||undefined,
      allowWaitingList:checked('allowWaitingList'),allowProbation:checked('allowProbation')
    },
    communication:{channels:communication(),publishMemberStatements:checked('publishMemberStatements')},
    accessibility:{ultraSimple:checked('ultraSimpleMode'),oralAssistant:checked('oralAssistant'),lowBandwidthPriority:checked('lowBandwidthPriority'),oldDevicePriority:checked('oldDevicePriority'),preferredLocale:value('projectLocale')||'fr'},
    sourceDocumentFingerprints:[...fingerprints],
    previewConfirmed:checked('previewConfirmed')
  });

  const textLine=(root,label,value)=>{
    const row=document.createElement('p');const b=document.createElement('strong');b.textContent=label+' : ';row.append(b,document.createTextNode(value||'—'));root.append(row);
  };
  let lastStarterKit=null;
  const safeNumber=v=>Number.isFinite(Number(v))?Number(v):0;
  const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cadenceLabel=v=>({WEEKLY:'hebdomadaire',BIWEEKLY:'toutes les deux semaines',MONTHLY:'mensuelle',QUARTERLY:'trimestrielle',DAILY:'quotidienne'}[String(v??'').toUpperCase()]||String(v||'à définir'));
  const addCadence=(d,cadence,index)=>{
    const x=new Date(d);if(!Number.isFinite(x.getTime()))return null;const c=String(cadence??'').toUpperCase();
    if(c==='WEEKLY')x.setDate(x.getDate()+7*index);else if(c==='BIWEEKLY')x.setDate(x.getDate()+14*index);else if(c==='DAILY')x.setDate(x.getDate()+index);else if(c==='QUARTERLY')x.setMonth(x.getMonth()+3*index);else x.setMonth(x.getMonth()+index);return x;
  };
  const buildStarterKit=(profile,rubrics)=>{
    const groupName=value('projectName')||'Votre groupe',family=value('groupKind')||'association',governance=value('governanceModel')||'à préciser';
    const members=Math.max(0,Number(profile.members.expectedMembers??0)),sessions=Math.max(0,Number(profile.cycle.expectedSessions??0));
    const moneyRubrics=rubrics.filter(r=>r.contributionMode!=='IN_KIND'),rubricRows=rubrics.map(r=>{
      const p=r.activityPlan??r,amount=safeNumber(p.nominalAmount?.amount),units=p.kind==='TONTINE'?safeNumber(p.shareCount||p.memberCount||members):safeNumber(p.memberCount||members),count=safeNumber(p.sessions||sessions);
      const nominalCycle=amount*units*count,fees=safeNumber(p.managementFeePerPayment)*units*count,external=Math.round(nominalCycle*safeNumber(p.estimatedExternalCostRate)/100),fixed=safeNumber(p.fixedCostPerSession)*count;
      return{name:r.name,kind:p.kind||'OTHER',participation:p.participationMode||'RULE_BASED',amount,units,count,nominalCycle,fees,external,fixed,mode:p.contributionMode||'MONEY'};
    });
    const monetaryVolume=rubricRows.reduce((n,r)=>n+r.nominalCycle,0),managerFees=rubricRows.reduce((n,r)=>n+r.fees,0),estimatedExternal=rubricRows.reduce((n,r)=>n+r.external,0),fixedCosts=rubricRows.reduce((n,r)=>n+r.fixed,0),estimatedMargin=managerFees-estimatedExternal-fixedCosts;
    const monetaryAmounts=rubricRows.filter(r=>r.mode!=='IN_KIND'&&r.amount>0).map(r=>r.amount).sort((a,b)=>a-b);
    const indicativeAmount=monetaryAmounts.length?monetaryAmounts[Math.floor((monetaryAmounts.length-1)/2)]:0;
    const tontineRows=rubricRows.filter(r=>String(r.kind).toUpperCase()==='TONTINE');
    const recommendedModel=tontineRows.length
      ? 'Tontine rotative multi-rubriques : chaque tontine garde ses propres participants, parts, ordre/bénéficiaire et calendrier. Proposition à valider par le groupe.'
      : family==='association'
        ? 'Association à rubriques multiples : les cotisations, secours, épargne, prêts et autres rubriques restent séparés et gouvernés par leurs règles propres. Proposition à valider par le groupe.'
        : 'Groupe à règles vivantes : démarrer avec les seules rubriques réellement utilisées et compléter après validation du RI et des pratiques. Proposition à valider par le groupe.';
    const paymentUnits=rubricRows.reduce((n,r)=>n+(r.mode==='IN_KIND'?0:Math.max(0,r.units*r.count)),0);
    const feeExample={
      perPayment:paymentUnits>0?Math.round(managerFees/paymentUnits):0,
      estimatedExternal:estimatedExternal+fixedCosts,
      managerFees,
      indicativeMargin:estimatedMargin,
      explanation:'Exemple indicatif uniquement : cotisation collective, coûts externes, honoraires de gestion et marge éventuelle restent quatre notions distinctes.'
    };
    const orderPolicy=tontineRows.length
      ? 'Ordre / tirage à définir et valider séparément pour chaque rubrique de tontine. Eco-System ne désigne jamais automatiquement un bénéficiaire sans règle ou décision du groupe.'
      : 'Aucun ordre de bénéficiaire imposé. Si une rubrique rotative est ajoutée plus tard, son ordre/tirage sera défini dans cette rubrique.';
    const latePolicy={
      mode:'À décider selon le RI et la pratique validée',
      automaticPenalty:false,
      text:'Aucune pénalité n’est créée automatiquement par le Kit. Définir délai, grâce, preuve, montant/plafond éventuel, autorité de décision, procédure de réserve et date d’effet avant activation.'
    };
    const scenario=(feeFactor,costFactor,label)=>{const revenue=Math.max(0,Math.round(managerFees*feeFactor)),cost=Math.max(0,Math.round((estimatedExternal+fixedCosts)*costFactor));return{label,revenue,cost,indicativeMargin:revenue-cost};};
    const simulation={
      collectiveVolume:monetaryVolume,
      prudent:scenario(.85,1.15,'Prudent'),
      central:scenario(1,1,'Central'),
      optimistic:scenario(1.1,.95,'Optimiste'),
      warning:'Simulation de préparation, sans transaction ni promesse de revenu. Les montants réels doivent provenir du Ledger et des coûts constatés.'
    };
    const advice=[
      'Avant le lancement, faire relire le RI, les rubriques et les frais par les responsables habilités puis conserver la version validée.',
      'Faire une répétition de la première séance avec la feuille canonique et vérifier les totaux de chaque colonne avant d’utiliser des données réelles.',
      'Préparer un plan B hors ligne : feuille papier, fiches individuelles, émargement et procédure de réconciliation.',
      'Ne jamais présenter la cotisation collective comme le chiffre d’affaires du gestionnaire ; suivre séparément coûts, honoraires et marge dans Business Studio.',
      tontineRows.length?'Valider pour chaque tontine ses participants, parts, ordre/tirage, bénéficiaires et règle de remplacement avant la première échéance.':'Ajouter une tontine uniquement si le groupe en a réellement besoin ; chaque future tontine aura ses propres participants et règles.'
    ];
    const risks=[];
    if(!groupName||groupName==='Votre groupe')risks.push('Nom du groupe à confirmer avant diffusion du kit.');
    if(!members)risks.push('Effectif cible non renseigné : impossible de calculer correctement les volumes et la faisabilité.');
    if(!sessions)risks.push('Nombre de séances non renseigné : calendrier et simulation de cycle incomplets.');
    if(!rubrics.length)risks.push('Aucune rubrique : le groupe ne possède encore aucun cœur financier/opérationnel.');
    if(rubricRows.some(r=>r.mode!=='IN_KIND'&&r.amount<=0))risks.push('Au moins une rubrique monétaire n’a pas encore de montant.');
    if(estimatedMargin<0)risks.push('La marge de gestion simulée est négative avec les frais/coûts actuellement saisis.');
    if(!profile.communication.channels?.length)risks.push('Aucun canal de communication choisi : prévoir au minimum un canal de convocation et un support papier/offline.');
    const checklist=[
      ['OBLIGATOIRE','Identifier clairement le groupe, son exercice/cycle et les responsables autorisés.'],
      ['OBLIGATOIRE','Valider chaque rubrique, ses participants, son montant ou unité, sa fréquence et ses règles.'],
      ['OBLIGATOIRE','Fixer le calendrier des séances et le mécanisme de preuve/validation des écritures.'],
      ['OBLIGATOIRE','Séparer cotisations collectives, frais externes, honoraires de gestion et marge éventuelle.'],
      ['OBLIGATOIRE','Prévoir le traitement des retards, erreurs, corrections, réserves et contestations.'],
      ['RECOMMANDÉ','Préparer la première réunion avec ordre du jour, feuille d’émargement et PV.'],
      ['RECOMMANDÉ','Préparer un plan de trésorerie : encaissement, caisse physique, rapprochement et conservation des preuves.'],
      ['RECOMMANDÉ','Simuler prudent / central / optimiste avant de promettre un montant ou un rendement.'],
      ['RECOMMANDÉ','Prévoir le mode faible connexion : impressions, fiches individuelles et reprise offline.'],
      ['CONFIGURABLE','Choisir les canaux de communication, le tirage/ordre, les pénalités et les fournisseurs selon le RI du groupe.']
    ];
    const calendar=[];const start=profile.cycle.startsAt?new Date(profile.cycle.startsAt):null;
    for(let i=0;i<sessions;i++){const d=start?addCadence(start,profile.cycle.cadence,i):null;calendar.push({index:i+1,date:d&&Number.isFinite(d.getTime())?d.toLocaleDateString('fr-FR'):'À planifier',label:'Séance '+(i+1)});}
    const rubricText=rubricRows.length?rubricRows.map(r=>r.name+(r.mode==='IN_KIND'?' ('+r.mode+')':r.amount?' ('+r.amount.toLocaleString('fr-FR')+' XAF)':'')).join(', '):'rubriques à définir';
    const invitation=`Bonjour. Vous êtes invité(e) à rejoindre « ${groupName} ». Le cycle prévoit ${sessions||'—'} séance(s), rythme ${cadenceLabel(profile.cycle.cadence)}, avec les rubriques suivantes : ${rubricText}. Les règles, frais, calendrier et modalités de participation seront validés avant tout engagement. Merci de confirmer votre intérêt.`;
    const minutes=`PROCÈS-VERBAL — ${groupName}\nSéance n°___ / Date : ___ / Lieu ou canal : ___\nPrésents : ___ / Absents : ___ / Représentés : ___\nOrdre du jour : ___\nDécisions par rubrique : ___\nEncaissements constatés : ___\nDécaissements / bénéficiaires et preuves : ___\nCorrections, réserves ou contestations : ___\nActions / responsables / échéances : ___\nClôture : ___\nSignatures / validation selon le RI : ___`;
    const rules=[
      'Objet et périmètre du groupe ; membres éligibles et règles d’adhésion.',
      'Rubriques : montant/unité, participants, fréquence, échéances et bénéficiaires.',
      'Séances : convocation, quorum si prévu, émargement, décisions et procès-verbal.',
      'Finances : attendu ≠ collecté ≠ décaissé ; toute correction reste tracée.',
      'Frais : distinguer cotisation, frais externes estimés/constatés, honoraires de gestion et marge.',
      'Prêts : capital, intérêt, ordre d’imputation, échéances et absence de capitalisation automatique sauf règle explicite autorisée.',
      'Retards / impayés / sanctions : uniquement selon une règle validée du groupe.',
      'Réserves et contestations : auteur, preuve, revue indépendante et décision.',
      'Archives / Paper Bridge / offline : supports papier et numérique réconciliés sans double comptabilité.',
      'Modification des règles : version, date d’effet, décideur et historique.'
    ];
    return{groupName,family,governance,members,sessions,rubricRows,monetaryVolume,managerFees,estimatedExternal,fixedCosts,estimatedMargin,recommendedModel,indicativeAmount,feeExample,orderPolicy,latePolicy,simulation,advice,risks,checklist,calendar,invitation,minutes,rules,profile};
  };
  const printStarterKit=kit=>{
    const w=window.open('','_blank','noopener,noreferrer,width=900,height=800');if(!w){toast('Autorisez les fenêtres contextuelles pour imprimer le Kit.');return;}
    const section=(title,rows)=>'<h2>'+escapeHtml(title)+'</h2><ul>'+rows.map(x=>'<li>'+escapeHtml(x)+'</li>').join('')+'</ul>';
    const html='<!doctype html><meta charset="utf-8"><title>Starter Kit - '+escapeHtml(kit.groupName)+'</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:30px auto;padding:0 20px;line-height:1.45}h1,h2{margin-top:1.4em}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #bbb;padding:7px;text-align:left}.tag{font-weight:700}pre{white-space:pre-wrap;border:1px solid #ccc;padding:12px}@media print{button{display:none}}</style><h1>Kit prêt à l\'emploi — '+escapeHtml(kit.groupName)+'</h1><p>Famille : '+escapeHtml(kit.family)+' · Gouvernance : '+escapeHtml(kit.governance)+' · Membres : '+escapeHtml(kit.members||'—')+' · Séances : '+escapeHtml(kit.sessions||'—')+'</p>'+'<h2>Modèle recommandé — à valider</h2><p>'+escapeHtml(kit.recommendedModel)+'</p><p><strong>Montant indicatif :</strong> '+escapeHtml(kit.indicativeAmount?kit.indicativeAmount+' XAF':'À définir par rubrique')+'</p><p><strong>Ordre / tirage :</strong> '+escapeHtml(kit.orderPolicy)+'</p><p><strong>Retard :</strong> '+escapeHtml(kit.latePolicy.text)+'</p>'+section('Conseils de démarrage',kit.advice)+section('Checklist',kit.checklist.map(x=>'['+x[0]+'] '+x[1]))+section('Règlement type — clauses à adapter',kit.rules)+'<h2>Rubriques et chiffrage</h2><table><tr><th>Rubrique</th><th>Mode</th><th>Montant</th><th>Cycle collectif</th><th>Frais gestion</th></tr>'+kit.rubricRows.map(r=>'<tr><td>'+escapeHtml(r.name)+'</td><td>'+escapeHtml(r.mode)+'</td><td>'+escapeHtml(r.amount)+'</td><td>'+escapeHtml(r.nominalCycle)+'</td><td>'+escapeHtml(r.fees)+'</td></tr>').join('')+'</table><h2>Calendrier</h2><table><tr><th>#</th><th>Date</th></tr>'+kit.calendar.map(x=>'<tr><td>'+x.index+'</td><td>'+escapeHtml(x.date)+'</td></tr>').join('')+'</table>'+section('Risques / points à compléter',kit.risks.length?kit.risks:['Aucun point bloquant détecté par le kit ; relire néanmoins le RI et la simulation.'])+'<h2>Message d\'invitation</h2><pre>'+escapeHtml(kit.invitation)+'</pre><h2>Modèle de PV</h2><pre>'+escapeHtml(kit.minutes)+'</pre>'+section('Guide première réunion',['Vérifier la liste des membres et les rôles.','Présenter les rubriques et confirmer qui participe à quoi.','Relire frais, calendrier, retards, prêts et règles de correction.','Faire les saisies dans la feuille canonique puis vérifier les totaux de colonnes.','Rapprocher caisse / Ledger / preuves avant clôture.','Émettre et conserver le PV ; distribuer le résumé aux membres.'])+section('Guide trésorerie',['Ne jamais confondre cotisation, frais externes, honoraires et marge.','Compter la caisse physique avant et après séance.','Conserver la preuve de chaque sortie et identifier le bénéficiaire.','Traiter une correction par remplacement exact, jamais par addition implicite.','Séparer argent privé du gestionnaire et argent collectif.'])+section('Paper Bridge — modèles à préparer',['Feuille mensuelle / feuille de séance membres × rubriques.','Fiches individuelles par membre.','Feuille d’émargement.','Registre Président / Secrétaire / Trésorier / Commissaire aux comptes selon le RI.','Registre prêts / remboursements / intérêts.','Registre assistances / secours.','Cartes ou fiches membres.','PV et dossier des preuves.'])+'<button onclick="print()">Imprimer / Enregistrer en PDF</button>';
    w.document.open();w.document.write(html);w.document.close();
  };
  const persistStarterKit=async(groupId,recoveredKit)=>{
    if(!(recoveredKit??lastStarterKit)||!groupId)return null;
    const kit=recoveredKit??lastStarterKit;
    const data={
      kitVersion:'1.5.1',
      guideVersion:LAUNCH_GUIDE_VERSION,
      generatedAt:new Date().toISOString(),
      family:String(kit.family??''),
      governance:String(kit.governance??''),
      members:Number(kit.members??0),
      sessions:Number(kit.sessions??0),
      monetaryVolume:Number(kit.monetaryVolume??0),
      managerFees:Number(kit.managerFees??0),
      estimatedExternal:Number(kit.estimatedExternal??0),
      fixedCosts:Number(kit.fixedCosts??0),
      estimatedMargin:Number(kit.estimatedMargin??0),
      rubricRowsJson:JSON.stringify(kit.rubricRows??[]),
      checklistJson:JSON.stringify(kit.checklist??[]),
      calendarJson:JSON.stringify(kit.calendar??[]),
      risksJson:JSON.stringify(kit.risks??[]),
      rulesJson:JSON.stringify(kit.rules??[]),
      recommendedModel:String(kit.recommendedModel??'').slice(0,4000),
      indicativeAmount:Number(kit.indicativeAmount??0),
      feeExampleJson:JSON.stringify(kit.feeExample??{}),
      orderPolicy:String(kit.orderPolicy??'').slice(0,4000),
      latePolicyJson:JSON.stringify(kit.latePolicy??{}),
      simulationJson:JSON.stringify(kit.simulation??{}),
      adviceJson:JSON.stringify(kit.advice??[]),
      invitation:String(kit.invitation??'').slice(0,12000),
      minutes:String(kit.minutes??'').slice(0,20000),
      profileJson:JSON.stringify(kit.profile??{}).slice(0,50000)
    };
    return app.saveStarterKit(groupId,data);
  };

  const renderStarterKit=(root,kit)=>{
    const d=document.createElement('details');d.className='panel starter-kit-panel';d.open=true;const sm=document.createElement('summary');sm.append(document.createTextNode('Kit prêt à l’emploi · réellement généré pour ce brouillon'));d.append(sm);
    const intro=document.createElement('p');intro.className='truth-notice';intro.textContent='Le Kit n’est pas un exemple générique : il reprend le cycle, les rubriques, l’effectif, les coûts/frais et les choix de ce brouillon. Il distingue ce qui est nécessaire au fonctionnement, recommandé et librement configurable.';d.append(intro);
    const metrics=document.createElement('div');metrics.className='metrics small';for(const [l,v] of [['Volume collectif simulé',kit.monetaryVolume.toLocaleString('fr-FR')+' XAF'],['Frais de gestion simulés',kit.managerFees.toLocaleString('fr-FR')+' XAF'],['Coûts externes estimés',(kit.estimatedExternal+kit.fixedCosts).toLocaleString('fr-FR')+' XAF'],['Marge de gestion indicative',kit.estimatedMargin.toLocaleString('fr-FR')+' XAF']]){const a=document.createElement('article');a.className='metric';a.append(Object.assign(document.createElement('span'),{textContent:l}),Object.assign(document.createElement('strong'),{textContent:v}));metrics.append(a);}d.append(metrics);
    const model=document.createElement('section');model.className='item';model.append(Object.assign(document.createElement('h3'),{textContent:'Modèle recommandé — à valider'}));textLine(model,'Proposition',kit.recommendedModel);textLine(model,'Montant indicatif de référence',kit.indicativeAmount?kit.indicativeAmount.toLocaleString('fr-FR')+' XAF':'À définir selon chaque rubrique');textLine(model,'Ordre / tirage',kit.orderPolicy);textLine(model,'Politique de retard',kit.latePolicy.text);d.append(model);
    const sim=document.createElement('details');sim.open=true;sim.append(Object.assign(document.createElement('summary'),{textContent:'Simulation de préparation · prudent / central / optimiste'}));const sg=document.createElement('div');sg.className='three-col';for(const x of [kit.simulation.prudent,kit.simulation.central,kit.simulation.optimistic]){const a=document.createElement('article');a.className='item';a.append(Object.assign(document.createElement('strong'),{textContent:x.label}));textLine(a,'Honoraires/frais gestion simulés',x.revenue.toLocaleString('fr-FR')+' XAF');textLine(a,'Coûts simulés',x.cost.toLocaleString('fr-FR')+' XAF');textLine(a,'Marge indicative',x.indicativeMargin.toLocaleString('fr-FR')+' XAF');sg.append(a);}sim.append(sg,Object.assign(document.createElement('p'),{className:'hint',textContent:kit.simulation.warning}));d.append(sim);
    const fee=document.createElement('details');fee.append(Object.assign(document.createElement('summary'),{textContent:'Exemple de frais et séparation des montants'}));textLine(fee,'Frais de gestion moyens par paiement simulé',kit.feeExample.perPayment.toLocaleString('fr-FR')+' XAF');textLine(fee,'Coûts externes + fixes estimés',kit.feeExample.estimatedExternal.toLocaleString('fr-FR')+' XAF');textLine(fee,'Honoraires/frais de gestion simulés',kit.feeExample.managerFees.toLocaleString('fr-FR')+' XAF');textLine(fee,'Marge indicative',kit.feeExample.indicativeMargin.toLocaleString('fr-FR')+' XAF');fee.append(Object.assign(document.createElement('p'),{className:'truth-notice',textContent:kit.feeExample.explanation}));d.append(fee);
    const advice=document.createElement('details');advice.open=true;advice.append(Object.assign(document.createElement('summary'),{textContent:'Conseils de démarrage et plan d’action'}));const au=document.createElement('ol');for(const x of kit.advice)au.append(Object.assign(document.createElement('li'),{textContent:x}));advice.append(au);d.append(advice);
    const actions=document.createElement('div');actions.className='actions';
    const print=document.createElement('button');print.type='button';print.className='primary';print.textContent='Imprimer / Enregistrer le Kit en PDF';print.onclick=()=>printStarterKit(kit);
    const copyInvite=document.createElement('button');copyInvite.type='button';copyInvite.className='secondary';copyInvite.textContent='Copier l’invitation';copyInvite.onclick=()=>navigator.clipboard?.writeText(kit.invitation).then(()=>toast('Invitation copiée.')).catch(()=>toast(kit.invitation));
    const copyPv=document.createElement('button');copyPv.type='button';copyPv.className='secondary';copyPv.textContent='Copier le modèle de PV';copyPv.onclick=()=>navigator.clipboard?.writeText(kit.minutes).then(()=>toast('Modèle de PV copié.')).catch(()=>toast(kit.minutes));
    actions.append(print,copyInvite,copyPv);d.append(actions);
    const grid=document.createElement('div');grid.className='two-col';
    const check=document.createElement('section');check.append(Object.assign(document.createElement('h3'),{textContent:'Checklist de lancement'}));
    const key='eco.starter-kit.'+JSON.stringify([app.currentTenant(),app.currentActor(),kit.groupName]);let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
    kit.checklist.forEach((x,i)=>{const label=document.createElement('label');label.className='inline-check';const box=document.createElement('input');box.type='checkbox';box.checked=Boolean(saved[i]);box.onchange=()=>{saved[i]=box.checked;try{localStorage.setItem(key,JSON.stringify(saved));}catch{}};const span=document.createElement('span');span.textContent='['+x[0]+'] '+x[1];label.append(box,span);check.append(label);});
    const risk=document.createElement('section');risk.append(Object.assign(document.createElement('h3'),{textContent:'Risques / décisions manquantes'}));const ul=document.createElement('ul');for(const x of kit.risks.length?kit.risks:['Aucun point bloquant détecté par le Kit. Relisez néanmoins le RI et la simulation avant création.'])ul.append(Object.assign(document.createElement('li'),{textContent:x}));risk.append(ul);grid.append(check,risk);d.append(grid);
    const rules=document.createElement('details');rules.open=true;rules.append(Object.assign(document.createElement('summary'),{textContent:'Règlement type adaptable'}));const ol=document.createElement('ol');kit.rules.forEach(x=>ol.append(Object.assign(document.createElement('li'),{textContent:x})));rules.append(ol);d.append(rules);
    const rub=document.createElement('details');rub.open=true;rub.append(Object.assign(document.createElement('summary'),{textContent:'Rubriques, montants et cycle'}));const table=document.createElement('table');table.className='meeting-matrix';table.innerHTML='<thead><tr><th>Rubrique</th><th>Mode</th><th>Participation</th><th>Montant</th><th>Volume cycle</th><th>Frais gestion</th></tr></thead>';const tb=document.createElement('tbody');kit.rubricRows.forEach(r=>{const tr=document.createElement('tr');[r.name,r.mode,r.participation,r.amount?r.amount.toLocaleString('fr-FR')+' XAF':'—',r.nominalCycle.toLocaleString('fr-FR')+' XAF',r.fees.toLocaleString('fr-FR')+' XAF'].forEach(v=>tr.append(Object.assign(document.createElement('td'),{textContent:String(v)})));tb.append(tr);});const t=document.createElement('tr');t.className='table-total-row';['TOTAL','','','',kit.monetaryVolume.toLocaleString('fr-FR')+' XAF',kit.managerFees.toLocaleString('fr-FR')+' XAF'].forEach((v,i)=>t.append(Object.assign(document.createElement(i===0?'th':'td'),{textContent:v})));tb.append(t);table.append(tb);rub.append(table);d.append(rub);
    const calendar=document.createElement('details');calendar.append(Object.assign(document.createElement('summary'),{textContent:'Calendrier de démarrage'}));const list=document.createElement('ol');for(const x of kit.calendar)list.append(Object.assign(document.createElement('li'),{textContent:x.label+' · '+x.date}));calendar.append(list);d.append(calendar);
    const paper=document.createElement('details');paper.open=true;paper.append(Object.assign(document.createElement('summary'),{textContent:'Paper Bridge · pack papier/hybride/numérique'}));const pu=document.createElement('ul');['Feuille mensuelle / feuille de séance membres × rubriques','Fiches individuelles','Émargement','Registres Président / Secrétaire / Trésorier / Commissaire aux comptes selon le RI','Prêts / remboursements / intérêts','Assistances / secours','Cartes ou fiches membres','PV et dossier des preuves'].forEach(x=>pu.append(Object.assign(document.createElement('li'),{textContent:x})));paper.append(pu);d.append(paper);
    const guides=document.createElement('div');guides.className='two-col';const meeting=document.createElement('article');meeting.className='item';meeting.innerHTML='<h3>Guide première réunion</h3><ol><li>Vérifier membres et rôles.</li><li>Confirmer les rubriques et participants.</li><li>Relire frais, calendrier, retards, prêts et corrections.</li><li>Saisir dans la feuille canonique et contrôler les totaux.</li><li>Rapprocher caisse, Ledger et preuves.</li><li>Émettre le PV et diffuser le résumé.</li></ol>';const treasury=document.createElement('article');treasury.className='item';treasury.innerHTML='<h3>Guide trésorerie</h3><ol><li>Séparer cotisation, frais externes, honoraires et marge.</li><li>Compter la caisse avant/après séance.</li><li>Conserver la preuve de chaque sortie.</li><li>Corriger par remplacement exact, pas par addition.</li><li>Séparer argent privé du gestionnaire et argent collectif.</li></ol>';guides.append(meeting,treasury);d.append(guides);
    const templates=document.createElement('details');templates.append(Object.assign(document.createElement('summary'),{textContent:'Message d’invitation et modèle de PV'}));const inv=document.createElement('textarea');inv.rows=5;inv.readOnly=true;inv.value=kit.invitation;const pv=document.createElement('textarea');pv.rows=10;pv.readOnly=true;pv.value=kit.minutes;templates.append(inv,pv);d.append(templates);
    root.append(d);
  };

  const renderPreview=()=>{
    const root=byId('launchPreview');if(!root)return;root.replaceChildren();const profile=readProfile();
    const card=document.createElement('article');card.className='item';
    textLine(card,'Origine',profile.origin.mode);
    textLine(card,'Groupe',value('projectName'));
    textLine(card,'Famille',value('groupKind'));
    if(value('groupKind')==='rotating_tontine')textLine(card,'Variante de tontine',({MONEY:'Argent',IN_KIND:'En nature',HYBRID:'Hybride argent + nature'})[String(profile.tontineVariant??'MONEY')]||String(profile.tontineVariant??'MONEY'));
    textLine(card,'Gouvernance',value('governanceModel'));
    textLine(card,'Création historique',profile.origin.historicalCreatedAt||'Nouveau groupe / non renseignée');
    textLine(card,'Exercice',profile.cycle.label||profile.origin.currentExerciseLabel||'À préciser');
    textLine(card,'Calendrier',[profile.cycle.cadence,profile.cycle.meetingDay,profile.cycle.expectedSessions?profile.cycle.expectedSessions+' séance(s) prévues':''].filter(Boolean).join(' · ')||'À préciser');
    textLine(card,'Membres prévus',String(profile.members.expectedMembers??'—'));
    textLine(card,'Constitution des membres',profile.members.rosterMode||'Progressive');
    const historical=profile.origin.mode==='IMPORT_EXISTING'||Boolean(profile.origin.historicalCreatedAt);
    textLine(card,'Adhésion après création',historical?'Lien/code sécurisé → rapprochement avec la fiche membre historique':'Lien/code sécurisé → adhésion directe possible sans seconde action du responsable');
    const rubrics=getRubrics();
    textLine(card,'Rubriques principales',rubrics.map(r=>r.name).join(', ')||'Aucune');
    const rubricBox=document.createElement('div');rubricBox.className='stack';
    for(const r of rubrics){
      const line=document.createElement('article');line.className='item';const p=r.activityPlan;
      textLine(line,r.name,[p?.kind,p?.participationMode,p?.nominalAmount?.amount!==undefined?p.nominalAmount.amount+' '+(p.nominalAmount.currency||'XAF'):'',p?.sessions?p.sessions+' séance(s)':''].filter(Boolean).join(' · '));
      rubricBox.append(line);
    }
    if(rubrics.length)card.append(rubricBox);
    textLine(card,'Petites rubriques « Autres »','Inscription (temporaire au démarrage) · Timbre de prêt · Amende · personnalisables ; plusieurs possibles pour un membre pendant la même séance');
    textLine(card,'Communication',(profile.communication.channels??[]).join(', '));
    textLine(card,'Accessibilité',[profile.accessibility.ultraSimple?'Ultra Simple':'',profile.accessibility.oralAssistant?'Oral':'',profile.accessibility.lowBandwidthPriority?'2G':'',profile.accessibility.oldDevicePriority?'Ancien appareil':''].filter(Boolean).join(', ')||'Standard');
    textLine(card,'Profil bêta','BETA_OPEN : apprentissage collectif non sensible, recommandations, communautés/partenaires et préférence first-party actifs pour tous les comptes pendant la bêta');
    textLine(card,'Live Ledger','Durable Object / synchronisation Live disponibles pour tous en bêta ; fallback offline conservé');
    textLine(card,'Argent réel','DÉSACTIVÉ — aucune opération Mobile Money réelle n’est autorisée par cette création');
    const warning=document.createElement('p');warning.className='truth-notice';warning.textContent='Aucune proposition de l’assistant ne crée une transaction financière. Après création, les règles restent versionnées et modifiables selon les droits du groupe. Les données sensibles restent exclues des apprentissages collectifs et commerciaux.';card.append(warning);root.append(card);
    lastStarterKit=buildStarterKit(profile,rubrics);renderStarterKit(root,lastStarterKit);
    const confirmed=checked('previewConfirmed');byId('createGroupBtn').disabled=!confirmed;
  };

  const rubricFromSuggestion=s=>{
    const r=s.rubric??{};const kind=r.kind??'OTHER',isTontine=kind==='TONTINE';
    const members=Number(value('expectedMembers')||1)||1;
    return{
      key:crypto.randomUUID(),name:r.name??s.title,kind,
      nominalAmount:{currency:'XAF',amount:Number(r.nominalAmount??0)},amountBasis:isTontine?'PER_SHARE':'PER_MEMBER',
      participationMode:r.participationMode??'RULE_BASED',contributionMode:r.contributionMode??'MONEY',
      contributionLabel:r.contributionLabel,contributionUnit:r.contributionUnit,contributionQuantity:r.contributionQuantity,
      contextNote:[r.contextNote,s.evidence?'Source RI : '+s.evidence:''].filter(Boolean).join('\n').slice(0,1000),
      memberCount:members,shareCount:isTontine?members:undefined,potCount:isTontine?1:undefined,
      sessions:Number(value('cycleExpectedSessions')||12)||12,duration:{value:Number(value('cycleExpectedSessions')||12)||12,unit:'SESSIONS'},
      managementFeePerPayment:0,estimatedExternalCostRate:0,fixedCostPerSession:0,participants:undefined,
      policyDraft:r.policyDraft?structuredClone(r.policyDraft):undefined
    };
  };

  const renderSuggestions=(data)=>{
    const root=byId('launchAssistantSuggestions');root.replaceChildren();
    if(data.fingerprint)fingerprints.add(data.fingerprint);
    for(const fp of data.fingerprints??[])fingerprints.add(fp);
    const suggestions=data.suggestions??[],cards=[];
    const openNext=index=>{
      for(let i=index+1;i<cards.length;i++){
        const next=cards[i];if(next?.dataset.rubric==='true'&&next.dataset.review!=='validated'&&next.dataset.review!=='deferred'){
          const btn=next.querySelector('[data-configure-suggestion]');btn?.click();next.scrollIntoView({behavior:'smooth',block:'center'});return;
        }
      }
      toast('Toutes les rubriques détectées ont été parcourues. Vous pouvez relire le récapitulatif ou continuer.');
    };
    suggestions.forEach((s,index)=>{
      const a=document.createElement('article');a.className='item suggestion-review-card';a.dataset.rubric=String(Boolean(s.rubric));a.dataset.review='pending';
      const h=document.createElement('strong');h.textContent=s.title+' · '+Math.round(Number(s.confidence??0)*100)+'%';
      const state=document.createElement('span');state.className='pill';state.textContent=s.rubric?'À vérifier':s.category;
      const p=document.createElement('p');p.textContent=s.explanation??'';const ev=document.createElement('p');ev.className='hint';ev.textContent=s.evidence?'Source : '+s.evidence:'';
      a.append(h,state,p,ev);
      if(s.rubric){
        const config=document.createElement('div');config.className='suggestion-inline-config';config.hidden=true;a.append(config);
        const b=document.createElement('button');b.type='button';b.className='primary';b.dataset.configureSuggestion='1';
        b.textContent=s.rubric.kind==='ASSISTANCE'?'Examiner l’Assistance — détails validables plus tard':'Configurer ici';
        let editor;
        b.onclick=()=>{
          for(const other of root.querySelectorAll('.suggestion-inline-config'))if(other!==config)other.hidden=true;
          config.hidden=false;
          if(!editor){
            let plan=rubricFromSuggestion(s);
            if(plan.policyDraft?.assistance&&!plan.policyDraft.assistance.sourceFingerprint){
              const fp=[...fingerprints].slice(-1)[0];if(fp)plan.policyDraft.assistance.sourceFingerprint=fp;
            }
            const editorRoot=document.createElement('div');config.append(editorRoot);
            editor=createRubricEditor(editorRoot,{plan,onChange:()=>{}});
            if(plan.kind==='ASSISTANCE'){
              const note=document.createElement('p');note.className='truth-notice';note.textContent='Les modalités longues détectées dans le RI sont conservées comme brouillon. Vous pourrez les valider événement par événement dans le menu Assistance après création du groupe.';config.prepend(note);
            }
            const actions=document.createElement('div');actions.className='actions';
            const validate=document.createElement('button');validate.type='button';validate.className='primary';validate.textContent='Valider cette rubrique et passer à la suivante';
            validate.onclick=()=>{
              try{
                const [validated]=readRubricEditors([editor]);addRubric({plan:validated,skipFocus:true});
                a.dataset.review='validated';state.textContent='Validée';state.className='pill online';config.hidden=true;b.disabled=true;b.textContent='Rubrique validée';
                toast(validated.name+' ajoutée sans déplacement en bas de page.');openNext(index);
              }catch(error){showError(error);}
            };
            const defer=document.createElement('button');defer.type='button';defer.className='link-btn';defer.textContent=s.rubric.kind==='ASSISTANCE'?'Reporter les détails, conserver le brouillon':'Traiter plus tard';
            defer.onclick=()=>{
              try{
                if(s.rubric.kind==='ASSISTANCE'){
                  const [validated]=readRubricEditors([editor]);addRubric({plan:validated,skipFocus:true});
                  a.dataset.review='validated';state.textContent='Brouillon Assistance conservé';b.disabled=true;b.textContent='Brouillon conservé';
                }else{a.dataset.review='deferred';state.textContent='À traiter plus tard';}
                config.hidden=true;openNext(index);
              }catch(error){showError(error);}
            };
            actions.append(validate,defer);config.append(actions);
          }
          config.scrollIntoView({behavior:'smooth',block:'nearest'});
        };
        a.append(b);
      }
      cards.push(a);root.append(a);
    });
    if(!suggestions.length){const p=document.createElement('p');p.className='hint';p.textContent='Aucune règle assez claire n’a été détectée. Décrivez-la oralement ou ajoutez la rubrique manuellement.';root.append(p);}
  };

  const renderSelectedFiles=async()=>{
    const input=byId('launchGovernanceFiles'),root=byId('launchGovernanceFileList'),status=byId('launchFileStatus');
    if(!input||!root||!status)return;root.replaceChildren();const files=[...(input.files??[])];
    if(!files.length){status.textContent='Aucun document sélectionné.';return;}
    const imageFiles=files.filter(f=>f.type.startsWith('image/')||/\.(?:jpe?g|png|webp|bmp|gif)$/i.test(f.name));
    status.textContent=imageFiles.length===1?'Une seule photo sélectionnée : si le RI ou la liste de rubriques comporte plusieurs pages, ajoutez les autres images avant analyse.':' '+files.length+' fichier(s) prêt(s) pour analyse.';
    for(const file of files){
      const row=document.createElement('article');row.className='item';const strong=document.createElement('strong');strong.textContent=file.name;
      const meta=document.createElement('p');meta.className='hint';meta.textContent=(file.type||'type inconnu')+' · '+Math.max(1,Math.round(file.size/1024)).toLocaleString('fr-FR')+' Ko';
      row.append(strong,meta);root.append(row);
      if(imageFiles.includes(file)&&'createImageBitmap'in window)try{
        const bitmap=await createImageBitmap(file);const q=document.createElement('span');q.className='pill';q.textContent=bitmap.width+'×'+bitmap.height+(Math.min(bitmap.width,bitmap.height)<900?' · résolution à vérifier':' · lisibilité probable');row.append(q);bitmap.close?.();
      }catch{}
    }
  };
  const analyzeFiles=async()=>{try{
    const input=byId('launchGovernanceFiles'),status=byId('launchFileStatus'),files=[...(input?.files??[])];
    if(!files.length)throw Error('Sélectionnez au moins un document ou plusieurs photos lisibles.');
    status.textContent='Téléversement sécurisé vers R2 et extraction du contenu en cours…';
    const data=await app.analyzeGroupDocumentFiles(files);
    for(const fp of data.fingerprints??[])fingerprints.add(fp);
    if(data.combinedText&&data.combinedText.length<=120000&&!value('launchAssistantText'))byId('launchAssistantText').value=data.combinedText;
    const friendly=(data.warnings??[]).map(w=>w.startsWith('PHOTO_SET_SINGLE_IMAGE')?'Une seule photo a été reçue : vérifiez qu’aucune page du RI ou de la liste de rubriques ne manque.':w.startsWith('LEGACY_DOC')?'Ancien Word .doc archivé : préférez .docx ou PDF pour une extraction automatique complète.':w.startsWith('DOCUMENT_CONVERSION_FAILED')?'Un fichier n’a pas pu être lu automatiquement ; l’original reste archivé.':w);
    status.textContent='Analyse terminée : '+(data.files?.length??files.length)+' fichier(s), '+(data.suggestions?.length??0)+' proposition(s).'+(friendly.length?' '+friendly.join(' '):'');
    renderSuggestions(data);invalidate();toast('Document analysé. Validez maintenant les rubriques une par une, sur place.');
  }catch(e){showError(e);if(byId('launchFileStatus'))byId('launchFileStatus').textContent='Analyse non terminée.';}};
  const clearFiles=()=>{const input=byId('launchGovernanceFiles');if(input)input.value='';byId('launchGovernanceFileList')?.replaceChildren();if(byId('launchFileStatus'))byId('launchFileStatus').textContent='Fichiers retirés du brouillon local.';};

  const analyze=async()=>{try{const text=value('launchAssistantText');if(!text)throw Error('Ajoutez le texte du règlement ou une description.');renderSuggestions(await app.analyzeGroupDocument(text));}catch(e){showError(e);}};
  const interpret=async()=>{try{
    const text=value('launchAssistantText');if(!text)throw Error('Décrivez le groupe avant de lancer l’assistant.');
    const {draft}=await app.interpretGroupLaunch(text);const root=byId('launchAssistantSuggestions');root.replaceChildren();
    const a=document.createElement('article');a.className='item';const p=document.createElement('p');p.textContent='Brouillon compris : '+JSON.stringify(draft).replace(/[{}"]/g,' ');a.append(p);
    const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='Appliquer seulement ces champs au brouillon';
    b.onclick=()=>{
      if(draft.origin?.mode)byId('launchOrigin').value=draft.origin.mode;
      if(draft.family)byId('groupKind').value=draft.family;
      if(draft.members?.expectedMembers)byId('expectedMembers').value=String(draft.members.expectedMembers);
      if(draft.cycle?.cadence)byId('cycleCadence').value=draft.cycle.cadence;
      if(draft.accessibility?.ultraSimple)byId('ultraSimpleMode').checked=true;
      if(draft.accessibility?.oralAssistant)byId('oralAssistant').checked=true;
      if(draft.accessibility?.lowBandwidthPriority)byId('lowBandwidthPriority').checked=true;
      if(draft.accessibility?.oldDevicePriority)byId('oldDevicePriority').checked=true;
      syncOrigin();invalidate();toast('Brouillon appliqué. Relisez chaque étape avant de continuer.');
    };a.append(b);root.append(a);
  }catch(e){showError(e);}};

  let launchVoiceRecognition=null,launchVoiceActive=false;
  const startVoice=()=>{
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const status=byId('voiceStatus'),button=byId('startLaunchVoice');
    if(!SpeechRecognition){status.textContent='Reconnaissance vocale non disponible sur cet appareil. Utilisez le champ texte : aucune fonction essentielle n’en dépend.';return;}
    if(launchVoiceActive){launchVoiceActive=false;try{launchVoiceRecognition?.stop?.();}catch{}button.textContent='🎙️ Dicter sans limite courte';status.textContent='Dictée arrêtée. Vous pouvez relire puis reprendre exactement où vous étiez.';return;}
    const recognition=new SpeechRecognition();launchVoiceRecognition=recognition;launchVoiceActive=true;recognition.lang=value('projectLocale')==='en'?'en-US':'fr-FR';recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
    recognition.onstart=()=>{button.textContent='⏹ Arrêter la dictée';status.textContent='Écoute continue en cours… Parlez normalement, faites des pauses : le micro reste actif.';};
    recognition.onerror=e=>{const code=String(e.error??'erreur');if(code==='not-allowed'||code==='service-not-allowed'){launchVoiceActive=false;button.textContent='🎙️ Dicter sans limite courte';}status.textContent='Voix : '+code+'. Le texte déjà capturé est conservé.';};
    recognition.onresult=e=>{const box=byId('launchAssistantText');let finals='';let interim='';for(let i=e.resultIndex??0;i<(e.results?.length??0);i++){const txt=e.results[i]?.[0]?.transcript??'';if(e.results[i]?.isFinal)finals+=txt+' ';else interim+=txt;}if(finals.trim()){box.value=(box.value&& !/\s$/.test(box.value)?box.value+' ':box.value)+finals.trim()+' ';box.dispatchEvent(new Event('input',{bubbles:true}));}status.textContent='Écoute continue… '+(interim?'En cours : « '+interim.trim()+' »':'Texte conservé ; continuez à parler.');};
    recognition.onend=()=>{if(launchVoiceActive){setTimeout(()=>{if(!launchVoiceActive)return;try{recognition.start();}catch{}},250);}else{button.textContent='🎙️ Dicter sans limite courte';status.textContent='Dictée arrêtée. Le texte capturé reste disponible.';}};
    try{recognition.start();}catch(error){launchVoiceActive=false;button.textContent='🎙️ Dicter sans limite courte';status.textContent='Impossible de démarrer le micro : '+String(error);}
  };

  byId('launchPrevBtn')?.addEventListener('click',()=>showStep(step-1));
  byId('launchNextBtn')?.addEventListener('click',()=>showStep(step+1));
  byId('launchOrigin')?.addEventListener('change',syncOrigin);
  byId('analyzeLaunchDocument')?.addEventListener('click',()=>void analyze());
  byId('launchGovernanceFiles')?.addEventListener('change',()=>void renderSelectedFiles());
  byId('analyzeLaunchFiles')?.addEventListener('click',()=>void analyzeFiles());
  byId('clearLaunchFiles')?.addEventListener('click',clearFiles);
  byId('interpretLaunchText')?.addEventListener('click',()=>void interpret());
  byId('startLaunchVoice')?.addEventListener('click',startVoice);
  // Eco IA has its own screen; Launch Studio remains the owner of group drafts.
  byId('previewConfirmed')?.addEventListener('change',renderPreview);
  for(const p of panels)p.addEventListener('input',()=>{invalidate();if(step===10)renderPreview();});
  refreshGroups();syncOrigin();showStep(1);
  guide=mountLaunchGuide({app,getStep:()=>step,setStep:showStep,getEditors,restoreEditors:rows=>{restoreEditors(rows);fingerprints.clear();lastStarterKit=null;window.__ecoLastProjectReady=false;invalidate();},resumeCreation,kitSnapshot:()=>lastStarterKit,persistKit:persistStarterKit,notify:toast});
  return{readProfile,refreshGroups,showStep,renderPreview,persistStarterKit,refreshContext:(forceClear=false)=>{launchVoiceActive=false;try{launchVoiceRecognition?.stop?.();}catch{}guide.refresh(true,forceClear);},setLocale:()=>guide.refresh(),pendingCreation:guide.pendingCreation,rememberCreation:guide.rememberCreation,completeCreation:guide.completeCreation,markKitSaved:guide.markKitSaved,starterKitSnapshot:()=>lastStarterKit?structuredClone(lastStarterKit):null,afterSimulation:()=>{window.__ecoLastProjectReady=true;renderPreview();guide.refresh(false);},invalidateSimulation:()=>{window.__ecoLastProjectReady=false;if(byId('createGroupBtn'))byId('createGroupBtn').disabled=true;}};
}

