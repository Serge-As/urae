/**
 * Eco IA offline core (deterministic, no model, no data transmission).
 * This component advises and routes; it NEVER executes financial/business actions.
 * The platform's existing services own authorizations, writes and reconciliation.
 */
const normalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const has=(text,pattern)=>pattern.test(normalize(text));
const tr=(en,fr,english)=>english?en:fr;
const route=(view,anchor)=>({view,...(anchor?{anchor}:{})});
const advice=(intent,locale,fr,en,stepsFr,stepsEn,destination,notesFr=[],notesEn=[])=>{
 const english=locale==='en';
 return {
  intent,heading:tr(en.title,fr.title,english),explanation:tr(en.body,fr.body,english),
  steps:english?stepsEn:stepsFr,
  warnings:english?notesEn:notesFr,
  destination,offlineCapable:true,requiresHumanConfirmation:true,
  canWriteLedger:false,canCreateGroup:false,canPublish:false,usesExternalModel:false,
  evidenceStatus:'GENERAL_GUIDANCE_NOT_VERIFIED_CASE',
 };
};
const B={
 safety:{
  fr:{title:'Analyser avant de payer',body:'Eco repère des signaux de risque dans le texte fourni ; cela ne prouve ni une fraude ni la sécurité de l’offre.'},
  en:{title:'Assess before paying',body:'Eco identifies warning signs in the supplied text; this neither proves fraud nor that the offer is safe.'},
  frSteps:['Demander le nom légal, les responsables, les conditions et l’origine réelle des revenus.','Vérifier les autorisations pertinentes auprès des autorités compétentes.','Comparer les promesses aux preuves indépendantes, sans verser d’argent sous pression.','Utiliser le laboratoire financier pour simuler les flux et conserver les justificatifs.'],
  enSteps:['Request the legal identity, officers, terms and verifiable source of revenue.','Check applicable licenses with the competent authorities.','Compare claims against independent evidence; never pay under pressure.','Simulate cash flows in the financial lab and retain supporting documents.'],
  target:route('ecosystem','financialLabPanel'),
 },
 register:{
  fr:{title:'Importer un registre papier avec vérification',body:'Photographier ou filmer le registre ne signifie pas que ses chiffres sont déjà reconnus. Le groupe et chaque montant devront être contrôlés avant tout enregistrement.'},
  en:{title:'Review a paper register before importing',body:'Capturing a ledger does not mean the handwriting has been recognized. Review the group setup and every amount before recording anything.'},
  frSteps:['Photographier chaque page entière, puis les zones floues séparément.','Identifier noms, colonnes, rubriques et séances sans confondre les écritures.','Reconstituer les rubriques dans le Launch Studio et conserver l’image source.','Comparer les montants cellule par cellule et confirmer les opérations dans les deux feuilles.'],
  enSteps:['Capture whole pages and re-photograph unclear areas.','Identify names, columns, categories and meetings without guessing.','Prepare categories in Launch Studio and retain source evidence.','Compare cell amounts to the paper and confirm through the existing sheets.'],
  target:route('launch','launchAssistantPanel'),
  warningsFr:['La reconnaissance automatique des écritures manuscrites et l’import des cellules filmées ne sont pas encore prouvés.'],
  warningsEn:['Automatic handwriting recognition and importing filmed cells have not yet been validated.'],
 },
 finance:{
  fr:{title:'Saisir avec contrôle',body:'La voix ou le texte prépare un brouillon. La valeur finale passe toujours par le contrôle de la cellule, la validation humaine et le moteur financier canonique.'},
  en:{title:'Enter amounts safely',body:'Speech or text prepares a draft. The final value goes through cell review, human confirmation and the canonical financial service.'},
  frSteps:['Choisir le groupe, la séance, le membre et la rubrique.','Cliquer sur le micro de la cellule ou ouvrir la dictée des deux feuilles.','Relire et corriger le montant : remplacer n’est pas additionner.','Valider ✓ ou Entrée puis vérifier l’état hors ligne et la synchronisation.'],
  enSteps:['Choose group, meeting, member and category.','Tap the cell microphone or open two-sheet dictation.','Review and correct the amount: replacement is not addition.','Confirm via ✓ or Enter, then inspect offline and sync status.'],
  target:route('operations','twoSheetWorkspace'),
 },
 group:{
  fr:{title:'Créer ou gérer un groupe',body:'Eco peut orienter l’utilisateur dans les étapes de création ; aucune règle, membre ou montant n’est adopté à sa place.'},
  en:{title:'Create or manage a group',body:'Eco can guide the creation steps; it does not approve rules, members or amounts on the user’s behalf.'},
  frSteps:['Choisir association ou tontine rotative et décrire l’objectif.','Créer les membres, séances et rubriques propres au groupe.','Conserver les tontines distinctes et les participations facultatives.','Contrôler les règles, prévisualiser puis confirmer.'],
  enSteps:['Choose association or rotating savings group and describe its purpose.','Set up members, meetings and group-specific categories.','Keep multiple rotating funds and optional participation separate.','Review rules, preview and confirm.'],
  target:route('launch','launchAssistantPanel'),
 },
 opportunity:{
  fr:{title:'Construire une opportunité concrète',body:'Eco aide à formuler une idée et à l’amener vers les services existants ; les clients, profits et disponibilités doivent être vérifiés.'},
  en:{title:'Develop a practical opportunity',body:'Eco helps turn an idea into a service proposal; customers, profits and availability still require verification.'},
  frSteps:['Décrire votre compétence, votre produit ou un besoin réel, sans publier de données privées.','Identifier une offre gratuite, une coopération ou une proposition commerciale.','Calculer coûts, marges possibles et risques, sans bénéfice garanti.','Préparer l’annonce puis la publier volontairement dans les services appropriés.'],
  enSteps:['Describe your skills, product or a real need without revealing private data.','Consider a free offer, collaboration or commercial proposal.','Estimate costs, margins and risks without guaranteed returns.','Draft an announcement and publish it deliberately in the relevant service.'],
  target:route('ecosystem','externalProgramsPanel'),
 },
 partners:{
  fr:{title:'Accompagner partenaires et fournisseurs',body:'Eco facilite la présentation des services et la réponse aux besoins, sans donner accès aux finances privées des groupes.'},
  en:{title:'Support partners and suppliers',body:'Eco helps present services and respond to needs without exposing groups’ private finances.'},
  frSteps:['Présenter identité professionnelle, offre, zone d’intervention et conditions.','Préparer un devis ou une annonce claire et vérifiable.','Recevoir les demandes autorisées, vérifier disponibilité et prix.','Conserver la validation humaine des engagements et contrats.'],
  enSteps:['Provide professional identity, services, area and terms.','Draft a clear, verifiable quotation or listing.','Handle permitted inquiries and verify pricing and availability.','Keep human approval for offers and contracts.'],
  target:route('ecosystem','externalProgramsPanel'),
 },
 communities:{
  fr:{title:'Participer aux foras, hubs et communautés',body:'Eco aide à préparer, relire ou traduire des interventions. Il ne publie aucun message ni ne modère automatiquement une personne.'},
  en:{title:'Participate in forums, hubs and communities',body:'Eco helps draft, read back or translate posts. It never posts or disciplines people automatically.'},
  frSteps:['Choisir le forum, le hub ou la communauté visée.','Dicter ou rédiger la contribution puis demander sa relecture.','Vérifier le ton, les faits et les données personnelles.','Publier volontairement selon les droits et règles du forum.'],
  enSteps:['Choose the relevant forum, hub or community.','Dictate or write a contribution, then review it aloud.','Check tone, claims and personal information.','Publish deliberately under the forum’s permissions and rules.'],
  target:route('ecosystem','interestCommunityPanel'),
 },
 cockpit:{
  fr:{title:'Utiliser votre cockpit',body:'Le cockpit rassemble les services et les informations autorisées ; Eco vous guide vers l’action adaptée sans inventer votre situation.'},
  en:{title:'Use your dashboard',body:'The dashboard gathers authorized services and information; Eco guides you without inventing your situation.'},
  frSteps:['Ouvrir le cockpit de votre rôle.','Consulter les alertes et tâches réelles affichées.','Demander des explications sur le service concerné.','Agir dans le module source après confirmation.'],
  enSteps:['Open the dashboard appropriate to your role.','Review the actual displayed alerts and tasks.','Ask for guidance on the relevant service.','Perform the action through its source module after confirmation.'],
  target:route('dashboard'),
 },
 documents:{
  fr:{title:'Préparer statuts, RI et comptes rendus',body:'Eco peut guider la rédaction à partir des règles fournies ; tout document proposé exige relecture et adoption selon les règles du groupe.'},
  en:{title:'Prepare bylaws, internal rules and minutes',body:'Eco can guide drafting from supplied rules; proposed documents require review and approval under the group’s governance.'},
  frSteps:['Recueillir le nom du groupe, sa nature et ses règles réelles.','Séparer les faits, usages et propositions non encore adoptées.','Rédiger un brouillon, puis demander une relecture.','Faire valider le document par les organes compétents.'],
  enSteps:['Gather the group name, purpose and actual rules.','Separate facts, practice and proposals not yet adopted.','Prepare a draft and review it carefully.','Obtain approval from the appropriate decision makers.'],
  target:route('documents'),
 },
};
const risky=/(ponzi|pyramide|pyramid|arnaqu|escroqu|scam|fraud|placement|investis|investment|investir|rendement|returns?|profit garanti|guaranteed profit|gain garanti|taux garanti|recrut|recruit|double ton argent|double your money)/;
const registro=/(registre|cahier|ledger|notebook|photograph|photo|filmer|film|scan|ocr)/;
const vocal=/(micro|dicte|dicter|voice|vocal|parle|parler|audio|speak|speech)/;
const business=/(opportunit|business|entrepren|client|commercial|vendre|vente|sell|buy|achat groupe|group buy|offre|projet|service lucratif|marketplace|market)/;
const partners=/(partenaire|fournisseur|supplier|provider|ong|partner|vendor|devis|quotation)/;
const social=/(fora|forum|foras|communaute|community|hub|discussion|message vocal|group chat)/;
const group=/(association|tontine|groupe|group|creation|creer|create|constitution)/;
const finance=/(cotisation|versement|epargne|secours|remboursement|pret|depense|collation|ration|saisie|amount|savings|loan|finance|contribution|payment|montant)/;
const document=/(reglement|statuts|statut|ri\b|proc[eè]s|minute|bylaw|document|convocation|pv\b)/;
const cockpit=/(cockpit|dashboard|accueil|home|notification|alerte)/;
const isRiskRequest=s=>risky.test(s) || (/(invest|capital|placement|rendement|return|profit)/.test(s) && /[0-9]+\s*%/.test(s));

export function assessEcoInvestmentClaim(raw,locale='fr'){
 const s=normalize(raw),en=locale==='en',flags=[];
 if(/(ponzi|pyramide|pyramid)/.test(s))flags.push(en?'Ponzi/pyramid structure mentioned':'Structure de Ponzi/pyramide évoquée');
 if(/(recrut|recruit|parrain|referral|filleul)/.test(s)&&/(gain|profit|rendement|return|invest|commission|placement)/.test(s))flags.push(en?'Recruitment linked to returns':'Rémunération liée au recrutement');
 if(/(garanti|guaranteed|sans risque|risk.free|certain)/.test(s)&&/(gain|profit|return|rendement|invest|placement)/.test(s))flags.push(en?'Guaranteed return claim':'Promesse de rendement garanti');
 if(/(urgent|immediat|today|maintenant|vite|quickly|rapidement)/.test(s)&&/(payer|verser|invest|place|pay)/.test(s))flags.push(en?'Pressure to pay quickly':'Pression pour payer rapidement');
 const rates=[...s.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)].map(m=>Number(m[1].replace(',','.')));
 if(rates.some(x=>x>=20))flags.push(en?'Very high rate quoted; verify the time period':'Taux élevé annoncé ; vérifier la période');
 return {status:flags.length?'WARNING_SIGNS':'INSUFFICIENT_EVIDENCE',flags,notALegalVerdict:true,verifiedLicenses:false,requiresIndependentChecks:true};
}

export function adviseEcoRequest(raw,{locale='fr'}={}){
 const s=normalize(raw),en=locale==='en';
 if(!s)return {intent:'EMPTY',heading:en?'How can Eco help?':'Comment Eco peut-il vous aider ?',explanation:en?'Describe a task or ask a question.':'Décrivez une tâche ou posez une question.',steps:[],warnings:[],destination:null,offlineCapable:true,requiresHumanConfirmation:false,canWriteLedger:false,canCreateGroup:false,canPublish:false,usesExternalModel:false,evidenceStatus:'GENERAL_GUIDANCE_NOT_VERIFIED_CASE'};
 let kind='UNKNOWN';
 if(isRiskRequest(s))kind='safety';
 else if(registro.test(s)&&/(groupe|tontine|association|tableau|montant|cellule|import|creer|create|group|sheet|amount|column)/.test(s))kind='register';
 else if(document.test(s)&&!/(photos?|scan)/.test(s))kind='documents';
 else if(partners.test(s))kind='partners';
 else if(social.test(s))kind='communities';
 else if(business.test(s))kind='opportunity';
 else if(vocal.test(s)&&finance.test(s))kind='finance';
 else if(group.test(s)&&/(creer|creation|create|configur|inscrire|lancer|ouvrir|gestion|gerer|manage|setup)/.test(s))kind='group';
 else if(finance.test(s))kind='finance';
 else if(cockpit.test(s))kind='cockpit';
 if(kind==='UNKNOWN')return {intent:'UNKNOWN',heading:'',explanation:'',steps:[],warnings:[],destination:null,offlineCapable:true,requiresHumanConfirmation:false,canWriteLedger:false,canCreateGroup:false,canPublish:false,usesExternalModel:false,evidenceStatus:'NO_MATCH'};
 const def=B[kind];
 const a=advice(kind.toUpperCase(),locale,def.fr,def.en,def.frSteps,def.enSteps,def.target,def.warningsFr,def.warningsEn);
 if(kind==='safety'){
  const check=assessEcoInvestmentClaim(raw,locale);
  a.warnings=[...check.flags,...a.warnings];
  a.riskAssessment=check;
 }
 return a;
}
