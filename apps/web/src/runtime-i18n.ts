import {messages} from './i18n.js';

export type RuntimeLocale = 'fr'|'en';

const EXTRA_FR_EN: Record<string,string> = {
  'Connexion':'Sign in','Créer un compte':'Create account','Votre nom d’affichage':'Your display name',
  'Identifiant':'Username','Mot de passe':'Password','Me connecter':'Sign in',
  'Lettres, chiffres, point, tiret ou underscore.':'Letters, digits, dot, dash or underscore.',
  '12 caractères minimum.':'12 characters minimum.',
  'Un compte personnel pour accéder uniquement aux groupes qui vous autorisent. Les données de l’ancienne démonstration nécessitent un rapprochement contrôlé.':'One personal account to access only groups that authorize you. Legacy demo data requires controlled reconciliation.',
  'Vos groupes, vos comptes, vos décisions.':'Your groups, your accounts, your decisions.',
  'Plateforme Tontines · Associations · Communautés':'Tontines · Associations · Communities platform',
  'Déconnexion':'Sign out','Installer':'Install','Actualiser':'Refresh','Groupe actif':'Active group',
  'Aucun groupe actif':'No active group','Rechercher une fonction, un groupe, un service…':'Search a feature, group or service…',
  'Mon espace':'My space','Accueil':'Home','À faire':'To do','Groupes':'Groups','Découvrir':'Discover',
  'Créer / intégrer':'Create / join','Réunion':'Meeting','Finances':'Finance','Écosystème':'Ecosystem',
  'Communauté & économie':'Community & economy','Tous les services':'All services','Plateforme':'Platform',
  'Sécurité & réglages':'Security & settings',
  'Votre espace de gestion, version locale':'Your management space, local version',
  'Comptes personnels, groupes, séances, cotisations et relevés. Les services en préparation sont identifiés dans le catalogue.':'Personal accounts, groups, meetings, contributions and statements. Services still being completed are identified in the catalog.',
  'Une plateforme. Plusieurs groupes. Une seule vérité métier.':'One platform. Multiple groups. One business truth.',
  'Gérer une tontine ou une association sans perdre sa réalité.':'Manage a tontine or association without losing its real-world rules.',
  'Créez votre groupe, préparez les séances, décrivez ses règles et suivez les encaissements enregistrés. Retrouvez les cotisations et leurs éventuelles annulations dans chaque relevé.':'Create your group, prepare meetings, describe its rules and track recorded collections. Contributions and any reversals remain visible in each statement.',
  'Mode financier réel':'Real-money mode','DÉSACTIVÉ':'DISABLED',
  'Tests fonctionnels et données de démonstration uniquement.':'Functional tests and demonstration data only.',
  'Votre contexte courant.':'Your current context.','Gérer':'Manage','Obligations, cas et actions.':'Obligations, cases and actions.',
  'Tout voir':'View all','Accès rapide':'Quick access','Retrouvez vos principales activités.':'Find your main activities.',
  'Découvrir & adhérer':'Discover & join','Groupes publics et demandes d’adhésion':'Public groups and membership requests',
  'Créer / intégrer un groupe':'Create / join a group','Projet, simulation et ouverture du groupe':'Project, simulation and group launch',
  'Réunion & feuille mensuelle':'Meeting & monthly sheet','Cartes smartphone ou matrice membres × rubriques':'Smartphone cards or member × rubric matrix',
  'Finances & solidarité':'Finance & solidarity','Cotisations, caisse et relevés individuels':'Contributions, cashbox and individual statements',
  'Communauté':'Community','Forums, Hubs professionnels, votes, événements':'Forums, professional hubs, votes and events',
  'Marché & fournisseurs':'Market & suppliers','Marketplace, achats groupés, Business Studio':'Marketplace, group buying and Business Studio',
  'Sponsoring et campagnes respectueuses':'Respectful sponsorship and campaigns',
  'Academy · IA · Paper · Rapports':'Academy · AI · Paper · Reports','Accompagnement, documents, exports, intégrations':'Guidance, documents, exports and integrations',
  'Le membre cherche un groupe ; le groupe recherche des candidats consentants. L’adhésion reste gouvernée.':'A member searches for a group; a group searches for consenting candidates. Membership remains governed.',
  'Rechercher des groupes':'Search groups','Nom, objet ou mot-clé':'Name, purpose or keyword','Localité':'Location',
  'Recrutement ouvert seulement':'Open recruitment only','Rechercher':'Search','Rendre le groupe découvrable':'Make the group discoverable',
  'Aucune liste de membres, téléphone privé ou solde financier n’est publié.':'No member list, private phone number or financial balance is published.',
  'Visibilité':'Visibility','Adhésion':'Membership','Mots-clés mission':'Mission keywords','Recherche de nouveaux membres':'Looking for new members',
  'Publier / mettre à jour':'Publish / update','Identité, recrutement et confiance':'Identity, recruitment and trust',
  'Les capacités complémentaires du lot B restent localisables et auditables.':'Additional Lot B capabilities remain discoverable and auditable.',
  'Votre groupe, vos rubriques':'Your group, your rubrics','Créer une association ou une tontine':'Create an association or tontine',
  'Définissez les rubriques de votre association, donnez-leur vos propres noms, puis personnalisez leur fonctionnement.':'Define your association rubrics, give them your own names, then customize how they work.',
  'Le groupe':'The group','Identité et gouvernance':'Identity and governance','Vos rubriques':'Your rubrics','Nature et noms personnalisés':'Type and custom names',
  'Le fonctionnement':'How it works','Montants, membres, parts et tours':'Amounts, members, shares and rounds','Vérification':'Verification','Simulation puis création':'Simulation then creation',
  'Projet de groupe':'Group project','Nom du groupe':'Group name','Famille':'Family','Gouvernance':'Governance',
  'Les rubriques de votre association':'Your association rubrics','Ajoutez uniquement les rubriques qui existent chez vous. Chacune aura son nom, ses participants et ses paramètres.':'Add only the rubrics that exist in your group. Each has its own name, participants and settings.',
  '+ Ajouter une rubrique':'+ Add a rubric','Simuler':'Simulate','Créer le groupe à partir de cette simulation':'Create group from this simulation',
  'Mes groupes':'My groups','Sélectionnez le contexte actif.':'Select the active context.',
  'Modèles, transformation et kits':'Models, transformation and kits','Tout ce qui complète la création du groupe.':'Everything that completes group creation.',
  'Séance · Membres · Règles vivantes':'Meeting · Members · Living rules',
  'La clôture est un checkpoint. Une opération tardive reste possible si la politique du groupe l’autorise et si les validations requises sont réunies.':'Closing is a checkpoint. A late operation remains possible when group policy allows it and required approvals are met.',
  'Sélectionnez ou créez d’abord un groupe.':'Select or create a group first.',
  'Votre feuille de séance':'Your meeting sheet','Deux vues du même moteur : cartes pour téléphone, matrice type feuille mensuelle pour tablette/desktop.':'Two views of the same engine: phone cards and a monthly-sheet style matrix for tablet/desktop.',
  'Cartes':'Cards','Matrice':'Matrix','Touchez une cellule pour préparer la saisie d’une cotisation dans le service canonique ; la matrice n’écrit jamais directement dans le ledger.':'Tap a cell to prepare a contribution in the canonical service; the matrix never writes directly to the ledger.',
  'Membres':'Members','Ajouter':'Add','Séances':'Meetings','Ouvrir':'Open',
  'Règles vivantes':'Living rules','Écrit ≠ pratique ≠ règle opérationnelle. L’application cherche à comprendre le groupe avant d’imposer.':'Written rule ≠ observed practice ≠ operational rule. The application seeks to understand the group before imposing anything.',
  'Après clôture':'After closing','Mode':'Mode','Autorisé sous conditions':'Allowed under conditions','Ouvert avec traçabilité':'Open with traceability','Interdit par ce groupe':'Forbidden by this group',
  'Nombre minimal d’accords':'Minimum approvals','Délai maximal en heures (vide = aucun)':'Maximum delay in hours (blank = none)','Enregistrer la politique':'Save policy',
  'Décrire une rubrique':'Describe a rubric','Nom':'Name','Ce qui est écrit':'What is written','Ce qui est réellement pratiqué':'What is actually practiced',
  'Écart écrit/pratique':'Written/practice gap','À vérifier':'To verify','Conforme':'Aligned','Différent':'Different','Mixte':'Mixed',
  'Cible':'Target','Montant fixe / membre':'Fixed amount / member','Total fixe obligatoire':'Mandatory fixed total','Montant ouvert':'Open amount','Personnalisé':'Custom',
  'Montant / membre':'Amount / member','Total cible':'Target total','Manquant':'Shortfall','Couvert par solidarité':'Covered by solidarity',
  'Le bénéficiaire reçoit le collecté':'Beneficiary receives collected amount','Solidarité sous conditions':'Conditional solidarity','Règle personnalisée':'Custom rule',
  'Décaissement':'Disbursement','Cible fixe si couverte':'Fixed target if covered','Montant collecté':'Collected amount',
  'Obligatoire même pour les absents':'Mandatory even for absentees','Décaissement total immédiat':'Immediate full disbursement','Enregistrer la rubrique':'Save rubric',
  'Tontine opérationnelle':'Operational tontine','Cycle, parts, programmation des pots et décaissement restent distincts et traçables.':'Cycle, shares, pot scheduling and disbursement remain distinct and traceable.',
  'Vérifier le groupe':'Check group','Créer un cycle':'Create cycle','Rubrique':'Rubric','Nom du cycle':'Cycle name','Nombre de tours':'Number of rounds',
  'Pots servis par tour':'Pots served per round','Montant indicatif du pot':'Indicative pot amount','Créer le cycle':'Create cycle',
  'Ajouter une part / un nom':'Add a share / name','Cycle':'Cycle','Membre':'Member','Nom de la part':'Share name','Ajouter la part':'Add share',
  'Proposer un planning':'Propose schedule','Appliquer le planning proposé':'Apply proposed schedule','Part programmée':'Scheduled share','Montant du pot':'Pot amount','Séance':'Meeting','Sans séance':'No meeting','Servir le pot':'Serve pot',
  'Présence, PV, bénéficiaires et publication':'Attendance, minutes, beneficiaries and publication',
  'Le cockpit de réunion s’étend sans casser le ledger ni les règles du groupe.':'The meeting cockpit expands without breaking the ledger or group rules.',
  'Cotisation espèces':'Cash contribution','Rapprochement de caisse':'Cashbox reconciliation','Prévisualiser une rubrique fixe / solidaire':'Preview a fixed / solidarity rubric',
  'Collecté membres':'Collected from members','Solidarité':'Solidarity','Calculer':'Calculate','Ledger':'Ledger','Vérité financière canonique.':'Canonical financial truth.',
  'Prêts, obligations et décisions':'Loans, obligations and decisions','Les simulations, approbations, décaissements et remboursements sont séparés.':'Simulation, approval, disbursement and repayment are separate.',
  'Nouveau prêt':'New loan','Emprunteur':'Borrower','Capital':'Principal','Échéances':'Installments','Taux annuel %':'Annual rate %','Frais totaux':'Total fees',
  'Méthode':'Method','Capital restant dû':'Declining balance','Taux fixe sur capital initial':'Flat rate on original principal','Simuler et créer la demande':'Simulate and create request',
  'Échéancier simulé':'Simulated schedule','Créer une échéance':'Create obligation','Libellé':'Label','Date limite':'Due date','Montant':'Amount','Créer l’obligation':'Create obligation',
  'Décision gouvernée':'Governed decision','Titre':'Title','Objet':'Subject','Validations indépendantes requises':'Independent approvals required','Préparer la décision':'Prepare decision',
  'Prêts, épargne, tontines et assistance':'Loans, savings, tontines and assistance','Les flux spécialisés restent séparés, puis se réconcilient dans le ledger canonique.':'Specialized flows remain separate, then reconcile in the canonical ledger.',
  'Communauté, économie, croissance et accompagnement':'Community, economy, growth and guidance',
  'Les grands services du Cahier sont désormais organisés par domaine au lieu d’être noyés dans une simple liste.':'Major Cahier services are now organized by domain instead of being buried in a simple list.',
  'Communauté & Hubs professionnels':'Community & professional hubs','Forums, événements, votes, réputation, gestionnaires et partenaires.':'Forums, events, votes, reputation, managers and partners.',
  'Marché, fournisseurs & Business Studio':'Market, suppliers & Business Studio','Achats groupés, appels d’offres, marketplace et activités économiques.':'Group buying, tenders, marketplace and economic activities.',
  'AdManager & sponsoring':'AdManager & sponsorship','Campagnes, créations, placements, ciblage respectueux, modération et analytics.':'Campaigns, creatives, placements, privacy-safe targeting, moderation and analytics.',
  'Academy · ONG · IA · Safety · Paper Bridge':'Academy · NGOs · AI · Safety · Paper Bridge','Accompagnement des gestionnaires, connaissance, documents, anti-arnaque et pont papier ↔ numérique.':'Manager guidance, knowledge, documents, anti-scam and paper ↔ digital bridge.',
  'Rapports, recherche, calendrier et intégrations':'Reports, search, calendar and integrations','Exports, dashboards, notifications et connecteurs.':'Exports, dashboards, notifications and connectors.',
  'Catalogue complet':'Full catalog','capacités connues. Une fonction non visible dans un résumé n’est jamais considérée supprimée.':'known capabilities. A feature omitted from a summary is never considered deleted.',
  'Tous les services du Cahier, sans fausse complétude':'All Cahier services, without false completeness',
  'Un moteur spécialisé reste spécialisé. Une capacité en maturation utilise un dossier persistant D1 jusqu’à son moteur final, sans dupliquer Ledger, Membership, authentification ou paiement.':'A specialized engine stays specialized. A maturing capability uses a persistent D1 record until its final engine exists, without duplicating Ledger, Membership, authentication or payment.',
  'Laboratoire fonctionnel 1.2':'1.2 functional lab','Les innovations sont des workflows versionnés, jamais de simples notes. Les actions à risque restent gouvernées.':'Innovations are versioned workflows, never simple notes. Risky actions remain governed.',
  'Workflow':'Workflow','Résumé':'Summary','Données avancées JSON':'Advanced JSON data','Créer le workflow':'Create workflow','État et transitions':'State and transitions',
  'Nouveau dossier':'New record','Service':'Service','Statut':'Status','Actif':'Active','Brouillon':'Draft','Terminé':'Done','Archivé':'Archived',
  'Enregistrer le dossier':'Save record','Dossiers':'Records','Persistants sur D1 pour le tenant actif.':'Persistent in D1 for the active tenant.',
  'Inbox · Support · Offline':'Inbox · Support · Offline','Une interdiction raisonnable doit proposer une voie d’autorisation, de recours ou de régularisation lorsque c’est possible.':'A reasonable restriction should provide an authorization, appeal or regularization path when possible.',
  'Boîte universelle':'Universal inbox','Support / litige / recours':'Support / dispute / appeal','Ouvrir un dossier':'Open case','File offline':'Offline queue',
  'Ajouter une note de test':'Add a test note','Synchroniser':'Synchronize',
  'Réglages · Sécurité · Compatibilité':'Settings · Security · Compatibility','Préparer le pilote sans activer l’argent réel.':'Prepare the pilot without enabling real money.',
  'Préférences':'Preferences','Langue':'Language','Français':'French','Mode Ultra Simple':'Ultra Simple mode',
  'État de sécurité':'Security status','Compatibilité appareil':'Device compatibility','Services canoniques':'Canonical services',
  'Hardening, sauvegarde et reprise':'Hardening, backup and recovery','Auth, MFA, qualité des données, Time Machine, BIR+, restauration D1, observabilité et appareils anciens.':'Authentication, MFA, data quality, Time Machine, BIR+, D1 restore, observability and legacy devices.',
  'Règle de sécurité actuelle':'Current security rule','Les interfaces Mobile Money et facturation restent sandbox tant qu’une autorisation distincte et les qualifications de sécurité/terrain n’ont pas été données.':'Mobile Money and billing interfaces remain sandboxed until separate authorization and security/field qualification are complete.',
  'Version locale':'Local version'
};

Object.assign(EXTRA_FR_EN,{
  "Première utilisation hors ligne :": "First offline use:",
  "« Créer un compte » fonctionne désormais sans session Internet préalable sur un appareil où Eco-System est déjà installé. Le compte reste local et sera rapproché du serveur seulement lorsque vous déciderez de le finaliser avec Internet.": "“Create account” now works without a prior Internet session on a device where Eco-System is already installed. The account remains local and will be reconciled with the server only when you choose to finalize it online.",
  "Le mot de passe du compte local n’est pas stocké en clair. Vos groupes et saisies restent sur l’appareil et les intentions de synchronisation conservent leur auteur d’origine.": "The local account password is not stored in plain text. Your groups and entries remain on the device, and synchronization intents keep their original author.",
  "Finaliser le compte local": "Finalize local account",
  "← Retour": "← Back",
  "Finances du groupe": "Group finances",
  "Ouvrir la dictée financière": "Open financial dictation",
  "Aucune notification urgente.": "No urgent notification.",
  "Association / Tontine": "Association / Tontine",
  "Accueil du groupe": "Group home",
  "Ouvrir les Séances": "Open Meetings",
  "Réunion du jour, feuille de séance, présence, bénéficiaires, caisse, dettes et historique": "Today’s meeting, meeting sheet, attendance, beneficiaries, cashbox, debts and history",
  "Le membre cherche un groupe ; le groupe recherche des candidats consentants. L'adhésion reste gouvernée.": "A member searches for a group; the group searches for consenting candidates. Membership remains governed.",
  "Aucune liste de membres, téléphone privé ou solde financier n'est publié.": "No member list, private phone number or financial balance is published.",
  "Rejoindre ou appairer un membre": "Join or pair a member",
  "Un lien ou code sécurisé suffit. Les groupes historiques conservent l’identité financière du membre et demandent un rapprochement avec sa fiche existante.": "A secure link or code is enough. Historical groups keep the member’s financial identity and require reconciliation with the existing record.",
  "Je rejoins un groupe": "I am joining a group",
  "Inviter les membres du groupe actif": "Invite members of the active group",
  "Automatique selon l’origine du groupe": "Automatic based on group origin",
  "Créer le lien / code": "Create link / code",
  "Le membre m’envoie son code": "The member sends me their code",
  "Membre historique": "Historical member",
  "Code du membre": "Member code",
  "Appairer ce compte": "Pair this account",
  "Créer, intégrer ou transformer un groupe": "Create, integrate or transform a group",
  "Eco-System accompagne le groupe depuis son origine réelle jusqu’à la prévisualisation finale. Une tontine existante peut évoluer en association sans perdre son identité ni son histoire.": "Eco-System guides the group from its real-world origin to the final preview. An existing tontine can evolve into an association without losing its identity or history.",
  "Association · tontine rotative": "Association · rotating tontine",
  "Scénarios et coûts par rubrique": "Scenarios and costs by rubric",
  "Nouveau groupe": "New group",
  "Association / tontine qui existe déjà hors Eco-System": "Association / tontine already existing outside Eco-System",
  "Transformer une tontine déjà enregistrée dans Eco-System": "Transform a tontine already registered in Eco-System",
  "Groupe à faire évoluer": "Group to evolve",
  "Association": "Association",
  "Variante de tontine": "Tontine variant",
  "Une tontine en nature ou hybride reste une configuration de la famille « Tontine rotative ». Une association peut contenir zéro, une ou plusieurs tontines comme rubriques.": "An in-kind or hybrid tontine remains a configuration of the “Rotating tontine” family. An association may contain zero, one or several tontines as rubrics.",
  "Propriété, représentation, gestion opérationnelle, vote et pouvoir financier restent séparés. Les droits sensibles continuent à dépendre des rôles et mandats.": "Ownership, representation, operational management, voting and financial authority remain separate. Sensitive rights continue to depend on roles and mandates.",
  "Jour / règle de réunion": "Meeting day / rule",
  "Ajouter / inviter progressivement": "Add / invite progressively",
  "Rapprocher les membres d’un groupe historique": "Reconcile members of a historical group",
  "La participation aux rubriques est définie séparément : un membre peut ne participer à aucune tontine, à une seule, à plusieurs ou à toutes.": "Participation is defined separately for each rubric: a member may participate in no tontine, one, several or all of them.",
  "Chaque nature peut être utilisée plusieurs fois et recevoir le nom choisi par le groupe. « Tontine » peut donc devenir Tontine 1 000 F, 10 000 F, Savons, Huiles, Draps, etc.": "Each type can be used several times and given the name chosen by the group. “Tontine” can therefore become Tontine 1,000 F, 10,000 F, Soap, Oil, Sheets, etc.",
  "Configurez une rubrique ici, validez-la, puis l’assistant vous conduit à la suivante sans aller-retour en bas de page.": "Configure a rubric here, confirm it, then the assistant takes you directly to the next one without scrolling back and forth.",
  "+ Ajouter une tontine distincte": "+ Add a separate tontine",
  "Il n’existe pas de cotisation nominale unique imposée. La simulation consolide les rubriques, mais conserve leur logique indépendante.": "There is no imposed single nominal contribution. The simulation consolidates rubrics while preserving their independent logic.",
  "Langue principale": "Primary language",
  "Créer / intégrer / transformer le groupe": "Create / integrate / transform the group",
  "Suivant →": "Next →",
  "Sélectionnez le contexte actif ou choisissez un groupe source à transformer.": "Select the active context or choose a source group to transform.",
  "Pilotage transversal du groupe": "Cross-functional group management",
  "Sélectionnez ou créez d'abord un groupe.": "Select or create a group first.",
  "Ce sont les deux feuilles de saisie. Cliquez une cellule pour ouvrir un petit éditeur au-dessus de la case, sans quitter le tableau.": "These are the two entry sheets. Click a cell to open a small editor above it without leaving the table.",
  "Les montants antérieurs restent visibles. Une cellule ouverte conserve le contexte séance × membre × rubrique et accepte de grands montants.": "Previous amounts remain visible. An open cell keeps the meeting × member × rubric context and accepts large amounts.",
  "Actualiser la fiche": "Refresh the sheet",
  "Chaque ligne est une séance et chaque colonne une rubrique. Les responsables saisissent directement par cellule ; un simple membre ne voit que sa propre fiche.": "Each row is a meeting and each column a rubric. Managers enter data directly by cell; an ordinary member sees only their own sheet.",
  "Ouvrez, choisissez ou clôturez une séance. Cliquez sur « Réunion du… » pour voir finances, temporalité, présence, dettes/obligations, bénéficiaires et preuves.": "Open, choose or close a meeting. Click “Meeting on…” to view finances, timing, attendance, debts/obligations, beneficiaries and evidence.",
  "Ouvrir / programmer": "Open / schedule",
  "Inscription, Timbre de prêt, Amendes et toute autre sous-rubrique sont configurés ici.": "Registration, Loan stamp, Fines and any other sub-rubric are configured here.",
  "Leurs montants réels se saisissent uniquement dans « Votre feuille de séance » ou « Vos fiches individuelles ».": "Their actual amounts are entered only in “Your meeting sheet” or “Your individual sheets”.",
  "Ajouter une petite rubrique personnalisée": "Add a small custom rubric",
  "Toujours disponible": "Always available",
  "Selon la séance": "Depending on the meeting",
  "Créer dans « Autres »": "Create in “Other”",
  "Écrit ≠ pratique ≠ règle opérationnelle. L'application cherche à comprendre le groupe avant d'imposer.": "Written rule ≠ practice ≠ operational rule. The app seeks to understand the group before imposing anything.",
  "Ajouter / décrire une rubrique": "Add / describe a rubric",
  "Prêt": "Loan",
  "Raccourcis : ils préparent une rubrique principale dans le groupe actif. « Autres » reste réservé aux petites sous-rubriques comme Inscription, Timbre et Amendes.": "Shortcuts prepare a main rubric in the active group. “Other” remains reserved for small sub-rubrics such as Registration, Stamp and Fines.",
  "Réunion préparée hors connexion": "Meeting prepared offline",
  "Télécharge uniquement le contexte minimal du groupe sur cet appareil. Les saisies financières offline restent des intentions jusqu’à confirmation serveur.": "Downloads only the group’s minimum context to this device. Offline financial entries remain intents until server confirmation.",
  "Préparer ce groupe hors ligne": "Prepare this group offline",
  "Actualiser les paquets locaux": "Refresh local packages",
  "Ouvrir le menu Tontines": "Open the Tontines menu",
  "Association / Tontine · unité opérationnelle": "Association / Tontine · operational unit",
  "Préparez et gérez une réunion précise : finances de séance, feuille membres × rubriques, présence, bénéficiaires, preuves, dettes, classement, précédente / actuelle / suivante et historique.": "Prepare and manage a specific meeting: meeting finances, member × rubric sheet, attendance, beneficiaries, evidence, debts, ordering, previous / current / next and history.",
  "Choisir ou préparer une séance": "Choose or prepare a meeting",
  "Le titre visible reste « Réunion du… ». Le titre interne est secondaire.": "The visible title remains “Meeting on…”. The internal title is secondary.",
  "Nouvelle séance": "New meeting",
  "Ouvrir la fiche détaillée": "Open detailed sheet",
  "Feuille de séance": "Meeting sheet",
  "Récap & caisse": "Recap & cashbox",
  "Gestion du groupe": "Group management",
  "Ajouter un membre, gérer son statut et ses rôles, puis ouvrir son Dossier Membre sans passer par la séance.": "Add a member, manage their status and roles, then open their Member File without going through a meeting.",
  "Ajouter membre": "Add member",
  "Membre à gérer": "Member to manage",
  "Modifier membre": "Edit member",
  "Supprimer / corbeille": "Delete / trash"
});

const canonical = new Map<string,string>();
for(const [key,fr] of Object.entries(messages.fr)){
  const en=(messages.en as Record<string,string>)[key];
  if(typeof fr==='string'&&typeof en==='string')canonical.set(fr,en);
}
for(const [fr,en] of Object.entries(EXTRA_FR_EN))canonical.set(fr,en);

const textSources = new Map<Text,string>();
const attributeSources = new Map<Element,Map<string,string>>();
const attrs=['placeholder','aria-label','title'];

const normalize=(value:string)=>value.replace(/\u00a0/g,' ').trim();
const translateExact=(source:string,locale:RuntimeLocale)=>{
  if(locale==='fr')return source;
  return canonical.get(normalize(source))??source;
};

export const localeTag=(locale:RuntimeLocale)=>locale==='en'?'en-CM':'fr-CM';

export const captureRuntimeI18n=(root:ParentNode=document)=>{
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node:Node|null;
  while((node=walker.nextNode())){
    const text=node as Text;
    const raw=text.nodeValue??'';
    if(normalize(raw)&&text.parentElement&&!['SCRIPT','STYLE','TEXTAREA'].includes(text.parentElement.tagName))textSources.set(text,raw);
  }
  root.querySelectorAll?.('*').forEach(el=>{
    const saved=new Map<string,string>();
    for(const attr of attrs){const value=el.getAttribute(attr);if(value)saved.set(attr,value);}
    if(saved.size)attributeSources.set(el,saved);
  });
};

export const applyRuntimeLocale=(locale:RuntimeLocale)=>{
  document.documentElement.lang=locale;
  for(const [node,raw] of textSources){
    if(!node.isConnected)continue;
    const lead=raw.match(/^\s*/)?.[0]??'',trail=raw.match(/\s*$/)?.[0]??'';
    const source=normalize(raw);
    node.nodeValue=lead+translateExact(source,locale)+trail;
  }
  for(const [el,saved] of attributeSources){
    if(!el.isConnected)continue;
    for(const [attr,source] of saved)el.setAttribute(attr,translateExact(source,locale));
  }
};

export const installRuntimeI18nObserver=(getLocale:()=>RuntimeLocale)=>{
  if(typeof MutationObserver==='undefined'||typeof document==='undefined')return()=>{};
  const observer=new MutationObserver(mutations=>{
    let changed=false;
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===Node.TEXT_NODE){
          const text=node as Text,raw=text.nodeValue??'',parent=text.parentElement;
          if(normalize(raw)&&parent&&!['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)){textSources.set(text,raw);changed=true;}
        }else if(node.nodeType===Node.ELEMENT_NODE){
          captureRuntimeI18n(node as Element);changed=true;
        }
      }
    }
    if(changed)applyRuntimeLocale(getLocale());
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});
  return()=>observer.disconnect();
};

export const runtimeTranslate=(locale:RuntimeLocale,fr:string,en?:string)=>locale==='en'?(en??canonical.get(fr)??fr):fr;
export const runtimeDictionary=()=>Object.fromEntries(canonical);
