# Eco-System — audit et finalisation des 28 lots / 92 propositions

Statut : **audité, automatiquement qualifié et déployé dans ses limites documentées**. Source v41 `6d3264bd7f345d808fb8cbfcc618d99c274d3891` ; **1061/1061 natifs, 82/82 Chromium et 20/20 WebKit**, zéro échec et zéro ignoré. [40235349803 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349803) ; [40235349738 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349738). `FIELD_ACCEPTED=NOT_ACCEPTED` ; aucun résultat terrain ou économique n’est déduit de ces preuves.

La vision Association/Tontine First fournie par le fondateur ordonne les priorités : groupes organisés comme socle, prospérité et bien-être du membre/gestionnaire comme finalité, communautés et services économiques comme prolongements. Elle conserve les boutiques/cockpits privés des gestionnaires, leur réseau de fournisseurs, la séparation des fonds et les parcours de valeur entre épargne, tontines, activités et projets. Foras, Business Studio, Jobs, Academy, Data Room, Care, Market, NOW, Harvest et Launch Boost complètent ce cœur. Une ambition stratégique n’autorise ni écriture financière automatique ni affirmation de revenu garanti.

Le programme audité comporte **28 améliorations A, 20 innovations I, 24 outils T et 20 modèles M**. Les 48 A/I sont des capacités produit avec critères propres. T/M sont des références de réalisation : les installer toutes serait une refonte contraire à la réutilisation des owners. T16 Playwright est réutilisé ; T19 PDF.js et T20 Tesseract.js sont intégrés localement à la demande. Les 41 autres références restent examinées et non importées.

## Contrôles et corrections de cette reprise

- État et lignée : SHA local, branche et historique conservés ; comparaison de la source avec v40 ; HEAD distant vérifié avant toute publication. Aucun reset, force-push ou fusion de main.
- Les **92 identifiants et tous leurs critères** ont été comparés littéralement aux deux sources de rédaction fournies (`contenu.py`, `outils_modeles.py`), par lecture AST sans exécution. Empreinte de l’ensemble normalisé : `4a53ada863e5d2338873b29e7254253d178c680876fec360a1dc967dc0a58c52`.
- La chaîne locale de départ passe **1058/1058** et tous ses gardes. Les succès historiques CI de v40 ont été relus sur GitHub ; ils restent distingués de la qualification du correctif.
- Défaut reproduit : `lint:proposals` acceptait une référence de preuve inexistante. Il ouvre désormais les fichiers, refuse absence/vide/JSON invalide/chemin sortant et exige un reçu de qualification de la source vérifiée. Trois régressions permanentes ajoutées ; garde également relié à la livraison.
- Défaut reproduit WebKit : chargement tardif des paramètres déplaçant le contrôle de **297 px entre appui et relâchement**, sans commande reçue. Négatif déterministe conservé. Le panneau de reprise passe après l’en-tête et avant les panneaux variables ; les résultats asynchrones sont placés après ses commandes.
- Le contrôle mobile a ensuite montré un défilement animé/focus plaçant le contrôle sous l’en-tête. Les seuls paramètres reprennent le défilement direct/marges déjà utilisés par Documents ; les feuilles financières conservent leur comportement.
- Statuts T16/T19/T20 et limites dépassées A11/A22/A27/I05 réconciliés en conservant leurs textes historiques. Aucun critère supprimé, aucun lot réimplémenté ni nouvelle dépendance installée.

## Matrice des 28 lots

Les chemins ci-dessous mènent aux owners/interfaces et aux suites exécutables. Un nom de test est une piste de contrôle ; seuls les reçus d’exécution du SHA final prouvent son succès. Les suites transversales vérifient aussi Live, offline/reload, confrontation, droits et invariants financiers.

### Lot 01 — Navigation, contexte et modes

**Propositions :** A01, I12. **Raccord propriétaire :** `apps/web/src/shell-navigation.js`.

Routes autorisées, reprise locale et brouillon préservé ; les préférences ne modifient pas les calculs.

**Régressions :** `tests/shell-navigation-20261020.test.mjs`, `tests/browser/navigation-lot01-20261020.spec.mjs`.

### Lot 02 — Cockpit personnel et continuité

**Propositions :** A02, I01. **Raccord propriétaire :** `apps/web/src/cockpit-priorities-ui.js`.

Projections des owners, contexte compte/groupe, source manquante explicite et priorités modifiables.

**Régressions :** `tests/cockpit-priorities-lot02-20261020.test.mjs`, `tests/browser/cockpit-priorities-lot02-20261020.spec.mjs`.

### Lot 03 — Kit et création en dix étapes

**Propositions :** A03. **Raccord propriétaire :** `apps/web/src/launch-draft.js`.

Brouillon volontaire borné au compte/projet, reprise sans seconde création ; aucune fusion automatique d’identités.

**Régressions :** `tests/launch-draft-lot03-20261022.test.mjs`, `tests/groups-governance-trust-20261022.test.mjs`, `tests/browser/launch-kit-lot03-20261022.spec.mjs`, `tests/browser/groups-governance-trust-20261022.spec.mjs`.

### Lot 04 — Décisions et gouvernance

**Propositions :** A04. **Raccord propriétaire :** `packages/governance-vote/src/index.ts`.

Quorum, vote, mandat et journal sous les autorités existantes ; adoption sans décaissement automatique.

**Régressions :** `tests/groups-governance-trust-20261022.test.mjs`, `tests/browser/groups-governance-trust-20261022.spec.mjs`.

### Lot 05 — Séance multi-gestionnaires et répétition

**Propositions :** A05, I02. **Raccord propriétaire :** `apps/web/src/session-rehearsal.js`.

Saisie, présence/confrontation et répétition synthétique ; aucune saisie réelle par la démonstration.

**Régressions :** `tests/session-rehearsal-20261020.test.mjs`, `tests/engine-rehearsal-incident-20261024.test.mjs`, `tests/browser/session-rehearsal-lot05-20261020.spec.mjs`, `tests/browser/engine-rehearsal-incident-20261024.spec.mjs`.

### Lot 06 — Solde explicable

**Propositions :** A06. **Raccord propriétaire :** `apps/web/src/financial-explanations-ui.js`.

Mouvements, rapprochement et provenance du solde canonique ; aucune seconde comptabilité.

**Régressions :** `tests/financial-explanations-20261022.test.mjs`, `tests/browser/financial-explanations-20261022.spec.mjs`.

### Lot 07 — Prêts détaillés et simulation

**Propositions :** A07, I11. **Raccord propriétaire :** `apps/web/src/financial-explanations-ui.js`.

Capital/intérêts et six politiques, simulations explicites ; ni accord ni remboursement par le simulateur.

**Régressions :** `tests/financial-explanations-20261022.test.mjs`, `tests/browser/financial-explanations-20261022.spec.mjs`.

### Lot 08 — Reçu de rendement

**Propositions :** A08. **Raccord propriétaire :** `packages/savings-yield/src/proof.ts`.

Entrées/règle et arrondis conservant l’enveloppe ; données historiques absentes signalées.

**Régressions :** `tests/financial-explanations-20261022.test.mjs`, `tests/browser/financial-explanations-20261022.spec.mjs`.

### Lot 09 — Calendrier tontine et solidarité

**Propositions :** A09, I13. **Raccord propriétaire :** `apps/web/src/financial-explanations-ui.js`.

Tours et projections suivant la règle adoptée ; un stress-test ne déplace pas un pot réel.

**Régressions :** `tests/financial-explanations-20261022.test.mjs`, `tests/browser/financial-explanations-20261022.spec.mjs`.

### Lot 10 — Commandes, boutiques et SAV

**Propositions :** A10. **Raccord propriétaire :** `packages/market/src/index.ts`.

Boutiques privées, mandats, fournisseurs, stock, réservation, livraison/retour et référence support. Aucun paiement réel déduit.

**Régressions :** `tests/market-orders-lot10-20261020.test.mjs`, `tests/market-personal-shops-lot10-20261020.test.mjs`, `tests/care-lot25-20261021.test.mjs`, `tests/browser/market-orders-lot10-20261020.spec.mjs`, `tests/browser/personal-shops-lot10-20261020.spec.mjs`, `tests/browser/care-lot25-20261021.spec.mjs`.

### Lot 11 — Business Studio et ressources

**Propositions :** A11, I16. **Raccord propriétaire :** `packages/business-studio/src/resource-assemblies.ts`.

Hypothèses/résultats, coûts inconnus, commandes nettes des retours ; calendrier canonique, capacité et accord séparé des propriétaires.

**Régressions :** `tests/business-value-network-20261022.test.mjs`, `tests/consolidated-completion-20261025.test.mjs`, `tests/browser/business-value-network-20261022.spec.mjs`, `tests/browser/consolidated-completion-20261025.spec.mjs`.

### Lot 12 — Besoins, ressources et achats concertés

**Propositions :** A12, I04. **Raccord propriétaire :** `apps/web/src/productive-business-ui.js`.

Contraintes indispensables et consentement ; mise en relation sans achat ou engagement automatique.

**Régressions :** `tests/business-value-network-20261022.test.mjs`, `tests/browser/business-value-network-20261022.spec.mjs`.

### Lot 13 — Eco NOW, Harvest et anti-gaspillage

**Propositions :** A13, I06. **Raccord propriétaire :** `apps/web/src/temporal-commerce-ui.js`.

Disponibilité datée, refus serveur après expiration, stock canonique, retrait et conditions ; ni carte nationale ni transport garanti.

**Régressions :** `tests/temporal-commerce-pilots-20261022.test.mjs`, `tests/browser/temporal-commerce-pilots-20261022.spec.mjs`.

### Lot 14 — Foras productifs et solutions

**Propositions :** A14, I20. **Raccord propriétaire :** `packages/community/src/index.ts`.

Échanges, sources relues, consentement à la réutilisation et adaptation locale indépendante ; aucun message privé exposé par défaut.

**Régressions :** `tests/productive-community-20261022.test.mjs`, `tests/productive-continuity-20261024.test.mjs`, `tests/browser/productive-community-20261022.spec.mjs`, `tests/browser/productive-continuity-20261024.spec.mjs`.

### Lot 15 — Carnets et découverte consentie

**Propositions :** A15. **Raccord propriétaire :** `apps/web/src/public-notebook-ui.js`.

Audiences privée/groupe/contacts/public choisi, même projection aperçu/public et retrait canonique ; copies téléchargées non rappelables.

**Régressions :** `tests/productive-community-20261022.test.mjs`, `tests/consolidated-completion-20261025.test.mjs`, `tests/browser/productive-community-20261022.spec.mjs`, `tests/browser/consolidated-completion-20261025.spec.mjs`.

### Lot 16 — Academy et preuve de compétence

**Propositions :** A16, I17. **Raccord propriétaire :** `apps/web/src/productive-community-ui.js`.

Apprendre/pratiquer, preuve et validation distincte de l’auteur ; badge révocable, aucun gain financier automatique.

**Régressions :** `tests/productive-community-20261022.test.mjs`, `tests/review-recovery-20261023.test.mjs`, `tests/browser/productive-community-20261022.spec.mjs`, `tests/browser/review-recovery-20261023.spec.mjs`.

### Lot 17 — Eco Jobs et première mission

**Propositions :** A17. **Raccord propriétaire :** `packages/business-studio/src/jobs.ts`.

Candidatures autorisées, créneaux exclusifs, offre close refusée, export calendrier et rappel Inbox choisis ; aucun emploi garanti.

**Régressions :** `tests/productive-community-20261022.test.mjs`, `tests/productive-continuity-20261024.test.mjs`, `tests/consolidated-completion-20261025.test.mjs`, `tests/browser/productive-community-20261022.spec.mjs`, `tests/browser/productive-continuity-20261024.spec.mjs`, `tests/browser/consolidated-completion-20261025.spec.mjs`.

### Lot 18 — Data Room et vérifications

**Propositions :** A18, I15. **Raccord propriétaire :** `packages/trust/src/verification.ts`.

Questions/preuves contradictoires, accès expiré/révoqué et export borné au destinataire ; absence de preuve distinguée d’un avis.

**Régressions :** `tests/productive-community-20261022.test.mjs`, `tests/review-recovery-20261023.test.mjs`, `tests/browser/productive-community-20261022.spec.mjs`, `tests/browser/review-recovery-20261023.spec.mjs`.

### Lot 19 — Launch Boost et parcours productifs

**Propositions :** A19, I05. **Raccord propriétaire :** `packages/business-studio/src/launch-programmes.ts`.

Plans privés et programmes collectifs volontaires, invitations indépendantes, conditions révisées/consenties, progrès déclaré et résultat relu séparés.

**Régressions :** `tests/productive-community-20261022.test.mjs`, `tests/productive-continuity-20261024.test.mjs`, `tests/consolidated-completion-20261025.test.mjs`, `tests/browser/productive-community-20261022.spec.mjs`, `tests/browser/productive-continuity-20261024.spec.mjs`, `tests/browser/consolidated-completion-20261025.spec.mjs`.

### Lot 20 — AdManager et observatoire des prix

**Propositions :** A20, I08. **Raccord propriétaire :** `packages/ad-manager/src/index.ts`.

Campagnes gouvernées et prix déclarés/qualifiés ; ni ciblage par dette/soldes privés ni promesse de demande solvable.

**Régressions :** `tests/review-recovery-20261023.test.mjs`, `tests/browser/review-recovery-20261023.spec.mjs`.

### Lot 21 — Passeport de confiance et carte révocable

**Propositions :** A21, I07. **Raccord propriétaire :** `packages/trust/src/index.ts`.

Affirmations et preuves distinguées, autorisation fraîche et révocation ; aucune réputation universelle ou identité certifiée inventée.

**Régressions :** `tests/groups-governance-trust-20261022.test.mjs`, `tests/review-recovery-20261023.test.mjs`, `tests/browser/groups-governance-trust-20261022.spec.mjs`, `tests/browser/review-recovery-20261023.spec.mjs`.

### Lot 22 — Labo anti-arnaques

**Propositions :** A22. **Raccord propriétaire :** `packages/trust/src/lab-review.ts`.

Questions versionnées, inconnues explicites, simulation déterministe et signalement privé/modéré ; aucun verdict juridique automatique.

**Régressions :** `tests/review-recovery-20261023.test.mjs`, `tests/browser/review-recovery-20261023.spec.mjs`.

### Lot 23 — Assistant et négociation

**Propositions :** A23, I14. **Raccord propriétaire :** `apps/web/src/assistant-actions.js`.

Actions locales FR/EN, préparation contrôlée et négociation guidée ; autorisation et effet métier restent distincts.

**Régressions :** `tests/assistant-tools-lot23-20261020.test.mjs`, `tests/browser/assistant-tools-lot23-20261020.spec.mjs`.

### Lot 24 — Inbox et attentes

**Propositions :** A24, I19. **Raccord propriétaire :** `apps/web/src/notification-center-ui.js`.

Notifications entre groupes autorisés, lecture privée des cibles et rappels choisis ; tentative d’ouverture différente du résultat métier.

**Régressions :** `tests/notification-inbox-lot24-20261021.test.mjs`, `tests/productive-continuity-20261024.test.mjs`, `tests/browser/notification-inbox-lot24-20261021.spec.mjs`, `tests/browser/productive-continuity-20261024.spec.mjs`.

### Lot 25 — Eco Care, SAV et prévention

**Propositions :** A25, I18. **Raccord propriétaire :** `packages/platform-kernel/src/case-care.ts`.

Dossier privé, transitions/reçus/version, recours, relance volontaire et prévention sans réparation ou indemnité automatique.

**Régressions :** `tests/care-lot25-20261021.test.mjs`, `tests/browser/care-lot25-20261021.spec.mjs`.

### Lot 26 — Documents et extraction relue

**Propositions :** A26. **Raccord propriétaire :** `apps/web/src/local-document-preparation.js`.

PDF.js/Tesseract.js locaux à la demande, annulation/reprise/FR-EN ; aucune proposition numérique appliquée sans confirmation humaine.

**Régressions :** `tests/review-recovery-20261023.test.mjs`, `tests/consolidated-completion-20261025.test.mjs`, `tests/browser/review-recovery-20261023.spec.mjs`, `tests/browser/consolidated-completion-20261025.spec.mjs`.

### Lot 27 — Qualité, reprise et incident rejouable

**Propositions :** A27, I10. **Raccord propriétaire :** `apps/web/src/data-quality-ui.js`.

Diagnostic en lecture, sauvegarde partielle nommée, restauration sur copie ; LOST_ACK/LIVE_OUTAGE synthétiques. Correctif des clics de reprise en v41.

**Régressions :** `tests/review-recovery-20261023.test.mjs`, `tests/engine-rehearsal-incident-20261024.test.mjs`, `tests/browser/review-recovery-20261023.spec.mjs`, `tests/browser/engine-rehearsal-incident-20261024.spec.mjs`.

### Lot 28 — Budget de requêtes et miroir des effets

**Propositions :** A28, I03, I09. **Raccord propriétaire :** `packages/application/src/request-budget.ts`.

Mesures requêtes/écritures et comparaison d’effets financiers inchangés ; déduplication secondaire sans polling toutes les secondes.

**Régressions :** `tests/request-budget-lot28-20261020.test.mjs`, `tests/browser/request-budget-lot28-20261020.spec.mjs`.

## Limites de validation et reprise

- Les 48 capacités fonctionnelles conservent leurs limites détaillées dans le registre. Leur livraison automatique ne clôt ni la vision de long terme ni tous les développements futurs.
- Les vrais comptes, appareils Android anciens/iOS physiques, groupes et séances réels restent à accepter : `FIELD_ACCEPTED=NOT_ACCEPTED`. WebKit et une vue mobile ne valent pas cette recette.
- Paiements/argent réel désactivés. Les marges, placements, revenus, contrats, fournisseurs, transport et consentements externes ne deviennent pas acquis du fait d’une interface ou d’un test synthétique.
- Sauvegarde de livraison **D1_AND_EXACT_SOURCE_ONLY** : export D1 en lecture seule, restauration sur copie vierge et intégrité, archive privée R2 relue, source exacte récupérable. Objets/pièces R2, données/outbox d’appareil et états des prestataires restent exclus ; aucune restauration de production.
- Rollback applicatif : préparer un nouveau commit descendant de la branche courante qui remet les fichiers applicatifs antérieurs nécessaires, avec identité/cache cohérents ; qualifier et livrer par le même workflow. Le garde de monotonie interdit de forcer l’ancienne tête. Aucune restauration ou réécriture D1 pour ce correctif de présentation. Ne jamais purger les données/outbox d’un appareil sans les protéger.
- Le dépôt URAE est public selon le choix déjà confirmé du fondateur ; aucune visibilité modifiée durant cet audit. Aucun secret, export de lignes D1 ou donnée de recette réelle n’est publié.
- Consommation exacte de crédits non mesurable. Les fichiers probants du même SHA sont réutilisés ; les nouveaux échecs sont conservés et diagnostiqués.

## Inventaire des 92 propositions et critères conservés

Le registre JSON conserve l’ensemble des plans et liens de preuve. Cette annexe permet de retrouver chaque critère d’origine ; les références T/M indiquent une évaluation/intégration possible, sans obligation d’adopter l’outil.

### A01 — Une navigation qui connaît le contexte et garde la séance intacte · lot 01

Lot propriétaire : 01. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Accès direct, actualisation et Retour aboutissent au même objet et respectent les droits.
- Menu, dialogue et mascotte ne recouvrent aucun bouton de validation à 360, 768 et 1366 pixels ; le zoom à 200 % reste utilisable.
- Un brouillon, son montant et le focus survivent à une ouverture de menu ; les trois modes sont perceptiblement distincts.

**Portée / limite :** Automated delivery evidence, not field acceptance or completion of all future refinements.

### A02 — Un cockpit de décisions, de reprise et d’opportunités utiles · lot 02

Lot propriétaire : 02. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un indicateur financier égale sa source canonique ; aucun solde n’est recalculé indépendamment dans le cockpit.
- Après changement de compte, aucun favori privé ni historique du précédent utilisateur n’apparaît.
- Une source absente laisse les autres cartes utilisables et indique précisément ce qui manque.

**Portée / limite :** Automated delivery evidence, not field acceptance or completion of all future refinements.

### A03 — Un Kit qui vérifie la compréhension avant de créer le groupe · lot 03

Lot propriétaire : 03. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une interruption à chaque étape reprend les choix et la version sans créer deux groupes.
- Deux personnes portant le même nom ou partageant un téléphone ne sont jamais fusionnées automatiquement.
- Le règlement final correspond aux choix confirmés ; une invitation expirée ne donne pas accès au groupe.

**Portée / limite :** 10 steps/fictional canonical simulation/scoped optional draft and same-project Kit recovery. No raw identity files or atomic cross-tab lock. Field acceptance pending.

### A04 — Un journal des décisions relié à leurs effets · lot 04

Lot propriétaire : 04. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un vote répété, une délégation expirée et un quorum absent donnent les résultats prévus.
- L’adoption d’une décision ne décaisse pas automatiquement une somme.
- Le retrait d’un mandat ferme les futurs accès et conserve l’historique légitime.

**Portée / limite :** Adopted closed decision tasks, current assignee, immutable reports/review with evidence. No automatic finance, mandate, federation or succession effects.

### A05 — Une feuille de séance complète, lisible et fiable sur deux appareils · lot 05

Lot propriétaire : 05. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Sur plusieurs largeurs et nombres de rubriques, leur union est complète, sans doublon ni rubrique inaccessible ; les totaux généraux couvrent toutes les parties.
- Deux navigateurs, coupure et reconnexion : pas de perte, pas de double effet, conflit visible et présence qui expire.
- Pointer B, tabuler vers B, puis saisir rapidement produit une synthèse A unique et conserve exactement la première valeur de B.

**Portée / limite :** Automated delivery evidence, not field acceptance or completion of all future refinements.

### A06 — Un solde que l’on peut expliquer et rapprocher · lot 06

Lot propriétaire : 06. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- La somme des mouvements confirmés et des ajustements autorisés explique le total à la précision monétaire définie.
- Rejouer une commande ne crée qu’un effet ; une annulation conserve la référence originale.
- La même période donne les mêmes montants sur la fiche membre, la séance et l’export.

**Portée / limite :** Authorized canonical read projections and hypothetical calculations; no financial commands. XAF,100movements/page,20recent closures,1000declared deposits,120coefficients,24loan periods,120tontine rounds. Missing historical inputs not invented. Independent browser rerun outcome tracked separately from successful full delivery.

### A07 — Un prêt expliqué échéance par échéance et composante par composante · lot 07

Lot propriétaire : 07. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Cas de paiement partiel, anticipé, date ancienne autorisée et remboursement répété : dette et Ledger concordent.
- Une règle modifiée entre aperçu et validation impose une nouvelle confirmation ou une erreur compréhensible.
- Le garant ne peut consulter les autres dettes privées du membre.

**Portée / limite :** Authorized canonical read projections and hypothetical calculations; no financial commands. XAF,100movements/page,20recent closures,1000declared deposits,120coefficients,24loan periods,120tontine rounds. Missing historical inputs not invented. Independent browser rerun outcome tracked separately from successful full delivery.

### A08 — Un reçu détaillé de répartition des rendements · lot 08

Lot propriétaire : 08. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- La somme des parts et du reliquat égale exactement le montant distribuable.
- Ordre différent des lectures, même jeu d’entrées et même version produisent le même résultat.
- Une reprise après interruption ne distribue pas deux fois ; une correction conserve le premier calcul.

**Portée / limite :** Authorized canonical read projections and hypothetical calculations; no financial commands. XAF,100movements/page,20recent closures,1000declared deposits,120coefficients,24loan periods,120tontine rounds. Missing historical inputs not invented. Independent browser rerun outcome tracked separately from successful full delivery.

### A09 — Un calendrier de tontine et de solidarité compréhensible · lot 09

Lot propriétaire : 09. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Les vues membre et gestionnaire correspondent au tour canonique et au règlement adopté.
- Un décalage proposé ne modifie aucune attribution tant qu’il n’est pas autorisé.
- Une pièce sensible n’apparaît ni dans le calendrier partagé ni dans une notification publique.

**Portée / limite :** Authorized canonical read projections and hypothetical calculations; no financial commands. XAF,100movements/page,20recent closures,1000declared deposits,120coefficients,24loan periods,120tontine rounds. Missing historical inputs not invented. Independent browser rerun outcome tracked separately from successful full delivery.

### A10 — Un dossier de commande qui va jusqu’au retour et au service après-vente · lot 10

Lot propriétaire : 10. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Deux acheteurs demandant le dernier article ne reçoivent pas chacun une réservation confirmée.
- Une livraison partielle, un retour et un double clic maintiennent les quantités et montants cohérents.
- Une offre retirée cesse d’être commandable depuis Marketplace, NOW et une ancienne notification.

**Portée / limite :** Canonical group quotes/order/returns and personal shops/mandates/buyer receipt/support reference qualified. Future personal quote/procurement variants are not newly delivered. Transversal SAV L25; no real payment/reimbursement inferred.

### A11 — Un Business Studio qui confronte l’idée aux résultats · lot 11

Lot propriétaire : 11. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un coût inconnu reste inconnu ; il n’est pas remplacé par zéro dans un bénéfice présenté comme acquis.
- Le passage d’idée à offre ne publie ni coordonnées ni prix sans confirmation.
- Un retour de marchandise est intégré au bilan à partir de la commande canonique.

**Portée / limite :** Private versioned hypotheses and observations, canonical deliveries net of returns, unknown versus declared costs and voluntary sanitized publication preserved. I16 now adds optional canonical Market resource calendars in v39: independent owner acceptance, capacity and half-open intervals, recoverable versioned retry. No certified accounting, atomic multi-owner purchase, inferred payment or automatic publication.

### A12 — Un rapprochement entre besoins et ressources qui explique ses raisons · lot 12

Lot propriétaire : 12. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une condition indispensable absente ne devient pas satisfaite grâce à un bon score global.
- Un retrait de consentement supprime les futures recommandations et invalide les références exposées.
- Un besoin sans réponse propose de corriger les critères, sans inventer des fournisseurs.

**Portée / limite :** Existing hard-constraint matching reused for current aggregate needs, with unknown costs and explicit expiration. No duplicated inventory or automatic procurement/order commitment; I06 Harvest not included.

### A13 — Des offres NOW réellement fraîches et une logistique de proximité · lot 13

Lot propriétaire : 13. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une offre expirée est refusée côté serveur même si l’ancien écran reste ouvert.
- Deux réservations concurrentes respectent le stock canonique.
- Une panne de carte ou de géolocalisation n’empêche pas la consultation ni le retrait convenu.

**Portée / limite :** Canonical dated group/shop availability and reservation, closed pickup and explicit local terms;100 recent items. No certified location, national map or transport.

### A14 — Des Foras qui transforment les échanges en connaissances et en actions · lot 14

Lot propriétaire : 14. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une publication privée n’entre pas dans l’index public ni dans le résumé d’un autre groupe.
- La suppression ou correction d’une source signale que la fiche solution doit être revue.
- La modération conserve motif et recours ; une action externe exige sa propre validation.

**Portée / limite :** Published and automatically qualified at 7eb2d1e499e3f0176da553999d68ca9c16bd8489; FIELD_ACCEPTED=NOT_ACCEPTED. Original method sharing requires validated readable sources and author consent. Target adaptations require local conditions/results and independent review; source revocation invalidates derived visibility. No raw messages or automatic group rules.

### A15 — Des Carnets utiles pour être découvert sans tout exposer · lot 15

Lot propriétaire : 15. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- La prévisualisation publique égale les données réellement accessibles sans compte.
- Une compétence non vérifiée n’obtient pas le même libellé qu’une preuve contrôlée.
- Une modification de visibilité retire les données des résultats et caches concernés.

**Portée / limite :** Published and automatically qualified at 4439791823cddc857ad898bfed8e702017b9f1d1; FIELD_ACCEPTED=NOT_ACCEPTED. Explicit PUBLIC field consent and chosen alias, same projection for preview and anonymous page, fresh canonical withdrawal. Private/group/chosen-contact audiences preserved. Bounded directory rereads at most 50 current pointers per request, at most20 results; no public personal contacts or universal full-text index. Already downloaded copies cannot be remotely recalled.

### A16 — Un parcours apprendre, pratiquer, prouver et contribuer · lot 16

Lot propriétaire : 16. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un badge renvoie à sa preuve et peut être révoqué avec motif.
- La même personne ne s’autoattribue pas une validation nécessitant un tiers.
- Une contribution ne déclenche ni dette ni cashback sans le moteur et la règle correspondants.

**Portée / limite :** Published v35 source dd1e7388; automatic qualification only, field acceptance pending. Initial bounded implementation under same canonical owners. Later complementary deliveries v38/v39 add consented notebook audiences, reviewed cross-group solution adaptation, chosen source-checked reminders and individually consented collective programmes. See CONSOLIDATED_ACCEPTANCE_2026-10-25.md for current limits; no automatic business outcome or guaranteed external delivery.

### A17 — Eco Jobs avec candidatures suivies et critères transparents · lot 17

Lot propriétaire : 17. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Deux personnes ne reçoivent pas simultanément le même créneau exclusif confirmé.
- Un recruteur ne consulte que les candidatures qui lui sont autorisées.
- Une offre close ne reçoit pas de candidature confirmée depuis une page périmée.

**Portée / limite :** Published and automatically qualified at 4439791823cddc857ad898bfed8e702017b9f1d1; FIELD_ACCEPTED=NOT_ACCEPTED. Existing exclusive interviews and authorized applications preserved. Voluntary private calendar snapshot plus a chosen internal Inbox reminder, freshly authorized. No guaranteed external transport, employment contract, payment or automatic calendar sync.

### A18 — Une Data Room organisée par questions de vérification · lot 18

Lot propriétaire : 18. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un accès expiré ou retiré interdit une nouvelle lecture serveur et ne révèle pas le nom d’un document confidentiel.
- Deux versions contradictoires restent identifiables et n’obtiennent pas automatiquement un statut vérifié.
- Le paquet exporté contient uniquement les pièces autorisées pour le destinataire.

**Portée / limite :** Published v35 source dd1e7388; automatic qualification only, field acceptance pending. Initial bounded implementation under same canonical owners. Later complementary deliveries v38/v39 add consented notebook audiences, reviewed cross-group solution adaptation, chosen source-checked reminders and individually consented collective programmes. See CONSOLIDATED_ACCEPTANCE_2026-10-25.md for current limits; no automatic business outcome or guaranteed external delivery.

### A19 — Launch Boost organisé en résultats vérifiables · lot 19

Lot propriétaire : 19. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une ressource non confirmée n’apparaît pas comme un financement acquis.
- Un participant peut consulter ses engagements, corriger son dossier et quitter selon les règles prévues.
- Les indicateurs distinguent activité réalisée, résultat vérifié et simple déclaration.

**Portée / limite :** Published and automatically qualified at 4439791823cddc857ad898bfed8e702017b9f1d1; FIELD_ACCEPTED=NOT_ACCEPTED. Private plans preserved; voluntary group programmes add independent invitations, individual consent, versioned reciprocal conditions, optional progress counters, reported versus independently reviewed results, reasoned amendment/exit/closure. No automatic funding, guaranteed turnover or transfer of external commitments.

### A20 — AdManager et intelligence de marché à budget maîtrisé · lot 20

Lot propriétaire : 20. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un rechargement répété ne produit pas plusieurs conversions ; une commande annulée est distinguée.
- Un plafond configuré bloque les nouvelles dépenses si une phase payante est autorisée ultérieurement.
- Un faible échantillon n’est pas présenté comme le prix certain du marché et ne révèle pas un vendeur isolé.

**Portée / limite :** Free moderated internal pilots with CAS caps, live consent, viewport-confirmed views and20 authorized canonical orders; contact is intent, delivered value is not cash. No billing, external advertising or rewards.

### A21 — Un passeport de confiance fondé sur des faits limités · lot 21

Lot propriétaire : 21. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une assertion expirée ou révoquée disparaît des nouvelles vérifications publiques.
- Un document privé reste inaccessible depuis le badge public.
- La réputation ne confère aucun mandat financier ni droit administratif.

**Portée / limite :** Dated limited assertions; current rights, withdrawal and expiry revalidated. Human manager review is not institutional certification. No identity-owner replacement.

### A22 — Un Labo anti-arnaques qui explique et accompagne · lot 22

Lot propriétaire : 22. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une information manquante n’est pas assimilée à une preuve d’escroquerie.
- Une simulation affiche ses hypothèses et donne le même résultat à entrées identiques.
- Un signalement privé ne devient pas public sans le parcours de modération prévu.

**Portée / limite :** Private versioned risk questions, explicit unknown information, deterministic educational scenarios and human-reviewed/moderated reports. No automatic fraud verdict, public accusation, personalized investment advice or financial command. The separate A27 recovery scope and A26 OCR do not certify this assessment; field acceptance pending.

### A23 — Eco IA bilingue, utile même sans modèle payant · lot 23

Lot propriétaire : 23. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Même intention en français et anglais : même cible et mêmes droits.
- Une transcription ambiguë, un changement de membre et un montant incertain imposent une relecture ; rien n’est validé en silence.
- Une instruction malveillante présente dans un document n’élargit pas les outils ni les autorisations de l’assistant.

**Portée / limite :** Automated delivery evidence, not field acceptance or completion of all future refinements.

### A24 — Une Inbox qui distingue envoyé, reçu, lu et traité · lot 24

Lot propriétaire : 24. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Le même événement reçu plusieurs fois n’apparaît qu’une fois ; deux révisions distinctes restent distinguables.
- Marquer lu n’approuve ni ne paie ; une ressource supprimée ou interdite n’est pas accessible via un ancien lien.
- Hors ligne, le statut indique l’attente et ne prétend pas que le destinataire a reçu.

**Portée / limite :** Published and automatically qualified at 4439791823cddc857ad898bfed8e702017b9f1d1; FIELD_ACCEPTED=NOT_ACCEPTED. Stable notification events and read/transport/business states preserved. Chosen reminders are revalidated when Inbox is read; completed/inaccessible sources stop reminding, changed sources require a new choice. No background polling, guaranteed external transport or business completion inferred from a click.

### A25 — Eco Care et SAV avec responsabilité et prochaine étape visibles · lot 25

Lot propriétaire : 25. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un dossier non affecté apparaît dans une file responsable, sans faux délai garanti.
- Un tiers ne consulte pas les pièces privées du litige.
- Une résolution proposée peut être refusée ou rouverte selon les règles, sans effacer l’historique.

**Portée / limite :** Published and automatically qualified at 4439791823cddc857ad898bfed8e702017b9f1d1; FIELD_ACCEPTED=NOT_ACCEPTED. Existing case rights, assignments, indicative dates, mediation and reopening preserved. Voluntary internal reminders and patterns within the authorized list (100maximum); declared categories and reopening counts do not establish root cause, staffing or guaranteed response. Financial corrections remain canonical.

### A26 — Des documents fiables avec OCR relu et exports vérifiables · lot 26

Lot propriétaire : 26. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une confusion entre 1 000 et 10 000 ne déclenche aucune écriture avant validation.
- Un fichier malformé, volumineux ou contenant du HTML hostile est traité sans exécuter son contenu.
- Export, filtres et totaux concordent avec les données sources ; les lignes masquées par l’écran ne disparaissent pas de l’export complet demandé.

**Portée / limite :** Published and automatically qualified at 4439791823cddc857ad898bfed8e702017b9f1d1; FIELD_ACCEPTED=NOT_ACCEPTED. Optional local image OCR and PDF text/scanned-page preparation; locked free libraries served by Eco on demand, outside the initial precache. Human source/content/numeric review required before library save. Old Word and unreadable/encrypted documents retain manual transcription. Limits10files25MBtotal15MBperfile10PDFpages; no certified OCR, legal verdict or financial write. Backups exclude R2objects/device outboxes/external state.

### A27 — Une reprise prouvée et un contrôle de qualité des données · lot 27

Lot propriétaire : 27. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une restauration vierge retrouve les relations et totaux attendus, pas seulement le nombre de fichiers.
- Une sauvegarde partielle est identifiée comme telle et ne reçoit pas un statut complet.
- Un compte retiré ne récupère pas ses droits après restauration sans la règle prévue.

**Portée / limite :** Read-only Ledger diagnosis and explicit quality workflows; delivery backup scope D1_AND_EXACT_SOURCE_ONLY with blank-copy integrity and foreign-key checks. R2 attachments, device-local/outbox and external state remain excluded. I10 adds strictly synthetic LOST_ACK/LIVE_OUTAGE canonical replay, not universal reproduction of arbitrary customer incidents. No automatic repair, production restore or financial write; field acceptance pending.

### A28 — Un budget de requêtes et une barrière de non-régression mesurable · lot 28

Lot propriétaire : 28. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Le gain de requêtes est reproductible et ne provient pas de validations abandonnées ou de présence supprimée.
- Les scénarios acquis de bout en bout passent, avec conflits, coupure et reprise sur deux appareils.
- L’accord porte sur le périmètre et le commit examinés ; une modification ultérieure significative invalide les preuves concernées.

**Portée / limite :** Automated delivery evidence, not field acceptance or completion of all future refinements.

### I01 — Le passeport de continuité personnelle · propriétaire L02

Lot propriétaire : 02. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Supprimer une ressource ou retirer un mandat invalide sa reprise ; changer de compte ne révèle aucun souvenir précédent.

**Portée / limite :** Bounded implementation published and automatically qualified at 93ed895af495425d7963dc4dbd8b9cf4dc7f123d; field acceptance pending. Local reference retention, selective forget and per-account device pause; no cross-device/full-object memory.

### I02 — La répétition générale d’une séance · propriétaire L05

Lot propriétaire : 05. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Aucune route de la répétition ne peut écrire dans les données réelles ; les résultats attendus restent vérifiés par les tests des moteurs.

**Portée / limite :** Published and automatically qualified at a07f96edcc49b6132d00e292edf222d47034b12e; FIELD_ACCEPTED=NOT_ACCEPTED. Actual canonical loans, ledger, sheet outbox and GroupLiveHub; two injected faults, six loan policies, durable fictional browser queue, Memory/SQLite qualification. Not exhaustive for all engine states or every failure; intermediate server FAILED snapshot is restored separately from browser initial/final persistence.

### I03 — Le budget de requêtes par parcours · propriétaire L28

Lot propriétaire : 28. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Même résultat métier avant/après, requêtes mesurées par catégorie et aucun acquittement perdu.

**Portée / limite :** Explicit application HTTP budget; not D1/WebSocket/provider billing. Acquired v35 automatically qualified; field acceptance pending.

### I04 — Les besoins mutualisés avec consentement · propriétaire L12

Lot propriétaire : 12. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Retrait d’un participant, unités incompatibles et double confirmation ne faussent ni quantité ni engagements.

**Portée / limite :** Group-only current-member aggregates from explicit own contributions, compatible units, immutable first confirmation, absorbing withdrawal including after leaving, closure/expiration.100 recent pools, three batched repository reads for ten pools; not constant row cost.

### I05 — Le parcours productif personnel sur une période choisie · propriétaire L19

Lot propriétaire : 19. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Aucune mission indisponible n’est annoncée comme prête ; reporter un objectif ne modifie pas les engagements métier.

**Portée / limite :** Private productive plans, voluntary future-milestone calendar exports after fresh access checks and A19 individually consented collective programmes are delivered. Reporting, evidence and independently reviewed results remain separate. No guaranteed income, automatic funding, external outreach or transfer of another participant commitment.

### I06 — La chaîne anti-gaspillage Harvest · propriétaire L13

Lot propriétaire : 13. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Le même surplus n’est pas promis deux fois ; une transformation ne crée pas artificiellement une quantité impossible.

**Portée / limite :** Atomic same-unit kg/g loss/transformation with source/output evidence and no automatic output publication. No recipe conversion, certified quality or agricultural yield estimate.

### I07 — La carte de preuve partageable et révocable · propriétaire L21

Lot propriétaire : 21. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une carte révoquée devient invalide en ligne ; une copie hors ligne n’est jamais présentée comme vérifiée à l’instant.

**Portée / limite :** Subject-chosen summary and revocable random-secret card, effective minimum expiry. Requires Eco account/online; lost secret cannot be recovered; private evidence is not disclosed.

### I08 — Le prix expliqué, avec ses limites · propriétaire L20

Lot propriétaire : 20. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une variation d’unité ou un faible échantillon ne produit pas un faux prix de référence.

**Portée / limite :** Minimum5 distinct current-tenant public personal sellers with equal declared category/quality/unit/locality/currency; median per seller then median across sellers. Asking prices only, no individual prices or identities.

### I09 — Eco Mirror : comparer les effets avant de remplacer un acquis · propriétaire L28

Lot propriétaire : 28. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une différence volontaire est documentée et autorisée ; une différence inexpliquée bloque le changement concerné.

**Portée / limite :** Worker/SQLite financial effect mirror for the qualified scenarios, not universal replay. Acquired v35 automatically qualified; field acceptance pending.

### I10 — Le dossier d’incident reproductible sans données privées · propriétaire L27

Lot propriétaire : 27. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Le dossier reproduit le défaut attendu et une inspection ne trouve ni secret, ni pièce privée, ni identifiant personnel réel.

**Portée / limite :** Published and automatically qualified at a07f96edcc49b6132d00e292edf222d47034b12e; FIELD_ACCEPTED=NOT_ACCEPTED. Strict normalized synthetic recipes for LOST_ACK and LIVE_OUTAGE, fresh canonical replay and untrusted prior observations. No arbitrary personal trace/secret capture, universal incident reproduction or acceptance of real customer data.

### I11 — Le laboratoire « que se passe-t-il si… » · propriétaire L07

Lot propriétaire : 07. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Aucune simulation ne crée d’écriture ; une modification de règle rend l’ancien aperçu caduc.

**Portée / limite :** Authorized canonical read projections and hypothetical calculations; no financial commands. XAF,100movements/page,20recent closures,1000declared deposits,120coefficients,24loan periods,120tontine rounds. Missing historical inputs not invented. Independent browser rerun outcome tracked separately from successful full delivery.

### I12 — La parité entre modes compact, sénior et assisté · propriétaire L01

Lot propriétaire : 01. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Aucun mode ne supprime une action indispensable ni ne change le montant ou le droit associé.

**Portée / limite :** Shared modes and preserved acquired actions/drafts in qualified browser scenarios, not universal coverage of future screens. Acquired v35 automatically qualified; field acceptance pending.

### I13 — Le scénario de résistance d’une tontine · propriétaire L09

Lot propriétaire : 09. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Retirer le scénario rétablit exactement la projection de référence ; les données réelles restent inchangées.

**Portée / limite :** Authorized canonical read projections and hypothetical calculations; no financial commands. XAF,100movements/page,20recent closures,1000declared deposits,120coefficients,24loan periods,120tontine rounds. Missing historical inputs not invented. Independent browser rerun outcome tracked separately from successful full delivery.

### I14 — L’assistant de négociation qui prépare sans agir à la place · propriétaire L23

Lot propriétaire : 23. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Aucun message ni engagement n’est envoyé à l’ouverture du modèle ; une donnée absente reste un champ à compléter.

**Portée / limite :** FR/EN negotiation draft preparation only; no autonomous sending, acceptance or commitment. Acquired v35 automatically qualified; field acceptance pending.

### I15 — La carte des questions, preuves et contradictions · propriétaire L18

Lot propriétaire : 18. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Un document volumineux ne ferme pas toutes les questions ; un signal automatique ne constitue pas une preuve de fraude.

**Portée / limite :** Published v35 source dd1e7388; automatic qualification only, field acceptance pending. Initial bounded implementation under same canonical owners. Later complementary deliveries v38/v39 add consented notebook audiences, reviewed cross-group solution adaptation, chosen source-checked reminders and individually consented collective programmes. See CONSOLIDATED_ACCEPTANCE_2026-10-25.md for current limits; no automatic business outcome or guaranteed external delivery.

### I16 — L’assemblage de moyens disponibles · propriétaire L11

Lot propriétaire : 11. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- La même machine n’est pas réservée sur deux créneaux incompatibles ; une ressource non acceptée reste provisoire.

**Portée / limite :** Published and automatically qualified at 4439791823cddc857ad898bfed8e702017b9f1d1; FIELD_ACCEPTED=NOT_ACCEPTED. Four-resource private plans, independent owner agreement and unique canonical order assignment preserved. Optional reusable-resource calendar is owned by Market: half-open intervals, capacity/CAS, stable retry, recoverable parent-write interruption and explicit cancellation. Archived plans do not release reservations; no atomic multi-owner purchase, inferred payment, automatic renewal or refund.

### I17 — La première mission accompagnée · propriétaire L16

Lot propriétaire : 16. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Le mentor ne peut valider sans voir le livrable ; le refus de publication ne supprime pas l’accès au service.

**Portée / limite :** Published v35 source dd1e7388; automatic qualification only, field acceptance pending. Initial bounded implementation under same canonical owners. Later complementary deliveries v38/v39 add consented notebook audiences, reviewed cross-group solution adaptation, chosen source-checked reminders and individually consented collective programmes. See CONSOLIDATED_ACCEPTANCE_2026-10-25.md for current limits; no automatic business outcome or guaranteed external delivery.

### I18 — Le SAV préventif par accord sur les attentes · propriétaire L25

Lot propriétaire : 25. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une nouvelle condition n’est pas ajoutée rétroactivement à une commande acceptée.

**Portée / limite :** Same-source qualification/delivery and33 public hashes passed. Group two-party prevention agreement is a standalone reference; no universal checkout insertion, guaranteed staffing, automatic reminder, recurring-causes analytics, binary evidence host, implicit financial correction or constant-cost server pagination. FIELD_ACCEPTED=NOT_ACCEPTED.

### I19 — Qui attend quoi, de qui et depuis quand ? · propriétaire L24

Lot propriétaire : 24. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une action déjà traitée ne continue pas de relancer ; aucun rôle ne voit une pièce privée par la frise.

**Portée / limite :** Same-source Linux qualification/delivery and31 hashes pass; Windows failures retained. No guaranteed external transport, automatic business completion, new polling or server pagination claim. Unknown waiting party remains explicit. Transversal SAV is L25; FIELD_ACCEPTED=NOT_ACCEPTED.

### I20 — La bibliothèque de solutions éprouvées dans leur contexte · propriétaire L14

Lot propriétaire : 14. Statut : `DELIVERED_WITH_DOCUMENTED_LIMITS`.

- Une fiche sans preuve porte le statut « proposition » ; une source retirée déclenche une révision de sa diffusion.

**Portée / limite :** Published and automatically qualified at 7eb2d1e499e3f0176da553999d68ca9c16bd8489; FIELD_ACCEPTED=NOT_ACCEPTED. A source solution remains independently reviewed in its original context. Cross-group adaptations preserve their own method, conditions and result; each needs local review and remains dependent on the original author grant and readable sources. No raw messages or automatic rule changes.

### T01 — Lit

Lot propriétaire : 01. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Comparer taille chargée, temps d’affichage, focus et conservation des brouillons avant/après.

**Portée / limite :** Un composant réinitialisé peut perdre son état. Ne pas réécrire toute l’application pour adopter une bibliothèque.

Source de la référence : https://github.com/lit/lit

### T02 — TanStack Table

Lot propriétaire : 05. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Comparer toutes les rubriques, totaux, tris et exports à la même source, puis tester clavier et lecteurs d’écran.

**Portée / limite :** La bibliothèque ne résout pas à elle seule la synchronisation, les partitions complètes ni l’accessibilité du rendu.

Source de la référence : https://github.com/TanStack/table

### T03 — TanStack Virtual

Lot propriétaire : 05. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Défiler pendant une édition, revenir, changer de filtre et exporter : aucune valeur perdue ni ligne oubliée.

**Portée / limite :** La virtualisation n’est pas une partition métier. Elle peut compliquer recherche navigateur, lecture assistée et impression ; prévoir une vue complète adaptée.

Source de la référence : https://github.com/TanStack/virtual

### T04 — Lucide

Lot propriétaire : 01. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Contraste, nom accessible, rendu à plusieurs tailles et absence de changement de signification entre écrans.

**Portée / limite :** Une icône seule ne suffit pas à expliquer « annuler avec trace », « approuver » ou « enregistrer ». Respecter les notices des éléments dérivés.

Source de la référence : https://github.com/lucide-icons/lucide

### T05 — Floating UI

Lot propriétaire : 01. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Tester bord d’écran, défilement, zoom, clavier et ouverture au-dessus d’une cellule en cours de saisie.

**Portée / limite :** Le placement ne garantit ni un dialogue accessible ni une bonne gestion des droits. Éviter les panneaux qui recouvrent les validations.

Source de la référence : https://github.com/floating-ui/floating-ui

### T06 — DOMPurify

Lot propriétaire : 14. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Tester liens malveillants, attributs d’événement, SVG hostile et modifications du contenu après nettoyage.

**Portée / limite :** Ne remplace ni les droits ni toute la sécurité applicative. Le DOM du navigateur ne doit pas être supposé présent dans un Worker ; éviter une intégration serveur non qualifiée.

Source de la référence : https://github.com/cure53/DOMPurify

### T07 — axe-core

Lot propriétaire : 01. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Associer le rapport à un essai manuel clavier, zoom et lecteur d’écran sur les actions essentielles.

**Portée / limite :** Un rapport sans erreur ne prouve pas toute l’accessibilité. La licence et ses obligations doivent être conservées pour les fichiers distribués concernés.

Source de la référence : https://github.com/dequelabs/axe-core

### T08 — Dexie.js

Lot propriétaire : 03. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Reprise après fermeture, migration interrompue, espace insuffisant et changement de compte.

**Portée / limite :** Ne pas remplacer l’outbox financière existante sous prétexte d’unifier le stockage. Le navigateur peut évincer des données ; expliquer ce qui n’est pas encore synchronisé.

Source de la référence : https://github.com/dexie/Dexie.js

### T09 — Yjs

Lot propriétaire : 04. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Éditer hors ligne des paragraphes distincts, reconnecter et vérifier convergence, suppression autorisée et accès retiré.

**Portée / limite :** Réserver aux textes et brouillons. Ne pas fusionner avec Yjs des montants, dettes ou validations. Un transport réseau de production consomme des ressources, même avec bibliothèque gratuite.

Source de la référence : https://github.com/yjs/yjs

### T10 — XState

Lot propriétaire : 04. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Vérifier transitions interdites, double clic, événement retardé et reprise après actualisation.

**Portée / limite :** Ce n’est pas une base de données ni une autorisation de remplacer tous les workflows acquis. Les outils payants de l’éditeur ne sont pas requis.

Source de la référence : https://github.com/statelyai/xstate

### T11 — Zod

Lot propriétaire : 03. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Champs absents, types incohérents, champs inattendus et versions anciennes produisent une réponse maîtrisée.

**Portée / limite :** Un schéma valide la forme ; il ne prouve pas le mandat, le stock disponible ou la solvabilité. Éviter deux schémas métier contradictoires.

Source de la référence : https://github.com/colinhacks/zod

### T12 — MiniSearch

Lot propriétaire : 02. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Requêtes accentuées, fautes courantes, résultats absents et changement de groupe ; vérifier que les données privées n’arrivent jamais dans un index global public.

**Portée / limite :** Un moteur de recherche n’est pas une réponse générative. Des documents sensibles déjà téléchargés doivent suivre une politique de stockage local explicite.

Source de la référence : https://github.com/lucaong/minisearch

### T13 — FlexSearch

Lot propriétaire : 12. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Mesurer sur téléphone modeste, pas seulement sur ordinateur ; tester accents, FR/EN et mise à jour d’index.

**Portée / limite :** Choisir MiniSearch OU FlexSearch selon les résultats ; ne pas installer les deux par principe. Les performances annoncées par un projet ne prouvent pas celles d’Eco.

Source de la référence : https://github.com/nextapps-de/flexsearch

### T14 — CASL

Lot propriétaire : 12. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Matrice compte/groupe/mandat/ressource, révocation et appel direct à l’API ; tout refus serveur reste un refus même si un bouton apparaît.

**Portée / limite :** Cacher un bouton ne protège pas les données. Une bibliothèque ne remplace pas l’authentification et ne doit pas élargir les mandats existants.

Source de la référence : https://github.com/stalniy/casl

### T15 — OpenTelemetry JavaScript

Lot propriétaire : 28. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Mesurer le surcoût, vérifier que l’export peut être désactivé et qu’aucun secret, pièce privée ou montant individuel n’est journalisé.

**Portée / limite :** Un service de monitoring hébergé peut être payant ; il n’est pas requis. Des compteurs existants suffisent si cette bibliothèque ajoute trop de poids.

Source de la référence : https://github.com/open-telemetry/opentelemetry-js

### T16 — Playwright

Lot propriétaire : 05. Statut : `REVIEWED_TOOL_IN_USE`.

- Montrer conflit, première frappe, synthèse au changement de membre, réseau absent puis reprise et séparation des comptes.

**Portée / limite :** Dependency reuse is verified in package.json and executable tests. Browser automation does not certify all old Android/iOS devices or real-account workflows.

Source de la référence : https://github.com/microsoft/playwright

### T17 — fast-check

Lot propriétaire : 05. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une série générée en échec doit être reproductible et réduite à un cas compréhensible.

**Portée / limite :** Tester des résultats métier, pas réécrire le même algorithme comme oracle. Borner le nombre de cas pour protéger le temps de CI.

Source de la référence : https://github.com/dubzzz/fast-check

### T18 — Pact JS

Lot propriétaire : 10. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une modification incompatible échoue côté producteur et consommateur ; vérifier aussi le scénario intégré réel.

**Portée / limite :** Aucun broker payant n’est obligatoire. Pact ne prouve pas seul les règles financières ni l’ordre réel des effets ; les contrats simples du dépôt peuvent suffire.

Source de la référence : https://github.com/pact-foundation/pact-js

### T19 — PDF.js

Lot propriétaire : 16. Statut : `REVIEWED_TOOL_IN_USE`.

- PDF invalide, document volumineux, accès expiré et navigation clavier ; aucune pièce privée dans un cache public.

**Portée / limite :** Ce lecteur n’est ni un générateur complet de PDF ni une protection contre la copie d’un document déjà consulté. Integration confirmed only for A26 within documented size/page/time limits; human review remains mandatory and downloaded engines remain optional.

Source de la référence : https://github.com/mozilla/pdf.js

### T20 — Tesseract.js

Lot propriétaire : 18. Statut : `REVIEWED_TOOL_IN_USE`.

- Mesurer erreurs sur montants et dates, durée et mémoire ; une faible qualité impose une saisie manuelle.

**Portée / limite :** Pas de prise en charge native des PDF par la bibliothèque ; manuscrit et photos floues restent difficiles. Aucun montant reconnu n’entre directement dans le Ledger. Integration confirmed only for A26 within documented size/page/time limits; human review remains mandatory and downloaded engines remain optional.

Source de la référence : https://github.com/naptha/tesseract.js

### T21 — Transformers.js

Lot propriétaire : 23. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Évaluer sur des exemples Eco FR/EN, sur matériel modeste et sans réseau après installation ; conserver une alternative déterministe.

**Portée / limite :** Aucun modèle précis n’est déclaré qualifié dans ce dossier. Pas de remplacement automatique par une API payante, pas de calcul financier confié au modèle.

Source de la référence : https://github.com/huggingface/transformers.js

### T22 — Vosk

Lot propriétaire : 23. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Évaluer accents, bruit, « mille »/« dix mille », changement de membre et refus du micro ; le clavier reste utilisable.

**Portée / limite :** L’API native n’est pas un composant web directement déployable dans Cloudflare Workers. Une intégration navigateur demande un adaptateur séparé qualifié ; ne pas la promettre comme déjà disponible.

Source de la référence : https://github.com/alphacep/vosk-api

### T23 — DuckDB

Lot propriétaire : 06. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Les agrégats concordent avec les exports sources ; données manquantes, doublons et unités incohérentes sont signalés.

**Portée / limite :** Ne pas remplacer D1 ou le Ledger. Un rapport local n’est pas un tableau de bord toujours à jour ; protéger les fichiers exportés et leur durée de conservation.

Source de la référence : https://github.com/duckdb/duckdb

### T24 — Apache ECharts

Lot propriétaire : 02. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Vérifier unités, périodes, données absentes, comparaison au total et navigation sur petit écran.

**Portée / limite :** Un beau graphique ne prouve pas la qualité de la donnée. Éviter 3D, échelles trompeuses et actualisation permanente ; les calculs restent chez leur propriétaire.

Source de la référence : https://github.com/apache/echarts

### M01 — ERPNext : relier les documents opérationnels

Lot propriétaire : 06. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une correction est visible de la commande au reçu et au total concerné.

**Portée / limite :** Inspiration fonctionnelle gratuite ; installer tout l’ERP n’est ni nécessaire ni proposé. Les règles des tontines restent celles d’Eco.

Source de la référence : https://github.com/frappe/erpnext

### M02 — Odoo Community : continuité du dossier commercial

Lot propriétaire : 10. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Changer une commande actualise ses projections sans créer une deuxième vérité de stock.

**Portée / limite :** S’inspirer du fonctionnement documenté, sans supposer gratuites toutes les fonctions Enterprise ni reprendre marques et écrans à l’identique.

Source de la référence : https://github.com/odoo/odoo

### M03 — Discourse : une discussion qui reste retrouvable

Lot propriétaire : 14. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une solution reste retrouvable sans exposer une discussion privée ; un contenu corrigé conserve une trace appropriée.

**Portée / limite :** Les niveaux de confiance communautaire ne doivent jamais donner automatiquement un pouvoir financier dans Eco. Aucun abonnement Discourse requis pour reprendre ces idées.

Source de la référence : https://www.discourse.org/features

### M04 — Zulip : organiser les échanges par sujet

Lot propriétaire : 14. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Deux commandes différentes ne partagent pas accidentellement le même historique privé.

**Portée / limite :** Le sujet sert au classement ; il ne vaut ni commande ni décision. Réalisation possible dans les échanges existants, sans nouvelle messagerie à héberger.

Source de la référence : https://zulip.com/help/introduction-to-topics

### M05 — Open Collective : séparer demande, approbation et paiement

Lot propriétaire : 04. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une approbation ne s’affiche pas comme un décaissement et un paiement refusé ne devient pas réussi.

**Portée / limite :** Ne pas copier une politique de transparence publique pour des données privées de membres. Le modèle d’hébergement ou de frais du service n’est pas nécessaire à l’idée.

Source de la référence : https://documentation.opencollective.com/getting-started/understanding-expenses

### M06 — Open Food Network : relier producteurs et distribution locale

Lot propriétaire : 10. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Quantités confirmées, retrait et disponibilité restent cohérents pour tous les participants.

**Portée / limite :** La coopération locale n’efface ni coûts de transport ni contraintes de conservation. Réutiliser l’idée sans déployer une seconde boutique concurrente.

Source de la référence : https://github.com/openfoodfoundation/openfoodnetwork

### M07 — Medusa : séparer les responsabilités du commerce

Lot propriétaire : 10. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- L’indisponibilité d’un écran de catalogue ne crée ni stock parallèle ni commande fictive.

**Portée / limite :** Le cœur libre inspire la conception ; aucun service cloud Medusa ou module Enterprise n’est nécessaire. Ne pas remplacer le commerce actuel sans motif démontré.

Source de la référence : https://github.com/medusajs/medusa

### M08 — Decidim : rendre la participation traçable

Lot propriétaire : 04. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Le groupe peut expliquer comment une proposition a abouti ou été rejetée ; la procédure applicable est identifiable.

**Portée / limite :** Un dispositif participatif générique ne remplace pas les statuts d’une association. Adapter les mécanismes au cadre adopté, sans installation obligatoire de Decidim.

Source de la référence : https://github.com/decidim/decidim

### M09 — Loomio : décider avec le contexte et les raisons

Lot propriétaire : 04. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Un nouvel arrivant habilité comprend le résultat sans lire des centaines de messages.

**Portée / limite :** Reprendre le principe est gratuit ; ne pas présumer que toutes les offres hébergées du produit le sont. La décision n’exécute pas automatiquement une opération financière.

Source de la référence : https://www.loomio.com/

### M10 — KoboToolbox : préparer et reprendre une collecte hors ligne

Lot propriétaire : 03. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Fermer, rouvrir et reconnecter ne transforme pas un brouillon en faux succès ni en double opération.

**Portée / limite :** L’idée n’autorise pas à remplacer la synchronisation financière existante par un formulaire générique. Les quotas d’un service hébergé ne sont pas annoncés illimités.

Source de la référence : https://support.kobotoolbox.org/data_through_webforms.html

### M11 — Ushahidi : recueillir, qualifier et situer des signalements

Lot propriétaire : 22. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Un signalement non vérifié ne reçoit pas un libellé de fait établi ; les coordonnées privées restent protégées.

**Portée / limite :** Aucune carte externe payante n’est nécessaire : une liste par zone suffit. Éviter la publication automatique d’accusations nominatives.

Source de la référence : https://github.com/ushahidi/platform

### M12 — Moodle : relier compétences, apprentissage et preuve

Lot propriétaire : 15. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une compétence déclarée, un cours terminé et une pratique validée sont trois états distincts.

**Portée / limite :** Un module suivi ne constitue pas automatiquement une qualification professionnelle. On peut réaliser ce parcours dans Eco sans héberger Moodle.

Source de la référence : https://docs.moodle.org/en/Competencies

### M13 — Open Badges : une preuve portable et décrite

Lot propriétaire : 15. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Le lecteur distingue qui atteste quoi, sur quelle base et à quelle date.

**Portée / limite :** Une signature ne garantit pas la vérité d’une assertion. La consultation du standard et l’inspiration sont gratuites ; une certification officielle éventuelle est un sujet séparé.

Source de la référence : https://www.1edtech.org/standards/open-badges

### M14 — OpenStreetMap : contribuer des faits vérifiables

Lot propriétaire : 13. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une fermeture signalée corrige les nouvelles propositions ; une observation ne vérifie pas toutes les activités du lieu.

**Portée / limite :** Le modèle de contribution est réutilisable ; les tuiles et services géographiques ne sont pas gratuits sans limite. Aucun usage de données OSM n’est imposé par cette proposition.

Source de la référence : https://wiki.openstreetmap.org/wiki/Good_practice

### M15 — Metabase : des tableaux de bord qui mènent à la question suivante

Lot propriétaire : 02. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Un clic sur une carte retrouve les mêmes filtres et le même total ; une source absente est signalée.

**Portée / limite :** Reprendre ces idées avec les composants Eco et ECharts est gratuit. Aucune fonctionnalité Enterprise ou intégration payante de Metabase n’est présumée incluse.

Source de la référence : https://www.metabase.com/docs/latest/dashboards/introduction

### M16 — Plane : une tâche avec responsable et état

Lot propriétaire : 02. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une tâche marquée finie ne remplace pas la preuve que la commande ou la décision référencée a abouti.

**Portée / limite :** S’inspirer de la gestion de travail ne nécessite ni nouvel outil hébergé ni migration de toutes les tâches Eco.

Source de la référence : https://github.com/makeplane/plane

### M17 — Easy!Appointments : réserver un créneau compréhensible

Lot propriétaire : 13. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Concurrence, changement de date et annulation ne produisent pas deux réservations exclusives valides.

**Portée / limite :** Pas besoin d’installer sa pile PHP et base de données dans Eco. Les idées de réservation sont à réaliser dans l’architecture actuelle ; aucun module premium obligatoire.

Source de la référence : https://github.com/alextselegidis/easyappointments

### M18 — Nextcloud : partager un document avec une portée explicite

Lot propriétaire : 18. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Un lien expiré ou révoqué ne donne plus de nouvelle lecture ; une pièce voisine reste inaccessible.

**Portée / limite :** Masquer le bouton Télécharger n’empêche pas toute copie. Reprendre le modèle sur le stockage existant évite un nouveau serveur Nextcloud obligatoire.

Source de la référence : https://docs.nextcloud.com/server/latest/user_manual/en/files/sharing.html

### M19 — Gitea : conditionner l’intégration à des vérifications

Lot propriétaire : 28. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une modification sans dossier d’impact ou avec preuve périmée est détectée ; les possibilités de contournement sont connues.

**Portée / limite :** Les capacités Gitea ne prouvent pas celles du forfait GitHub de chaque compte. Le dossier ne configure aucun compte ; le contrôle local gratuit reste contournable par un administrateur.

Source de la référence : https://docs.gitea.com/1.27/usage/access-control/protected-branches/

### M20 — Zammad : suivre réponse, résolution et escalade

Lot propriétaire : 25. Statut : `REFERENCE_MODEL_NOT_IMPORTED`.

- Une réponse automatique ne clôt pas un problème ; une échéance dépassée devient visible au bon responsable.

**Portée / limite :** Un outil ne remplace pas les personnes disponibles. Les rappels internes et les règles peuvent être réalisés sans abonnement Zammad ni SMS payants.

Source de la référence : https://admin-docs.zammad.org/en/7.0/manage/slas.html


## Reçus de clôture

## Audit finalisé et livraison v41 vérifiée — 25 octobre 2026

Production **1.5.2.41-programme-audit**, source `6d3264bd7f345d808fb8cbfcc618d99c274d3891`, arbre `b2fc714baf776d0de9e36d542d1dd654e8aa5eea`, Worker `b426cd0c-af79-4d7b-9dfc-aed6333ad457`. Livraison et qualification indépendante du même SHA : [40235349803 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349803) ; [40235349738 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349738). **1061/1061 natifs, 82/82 Chromium et 20/20 WebKit**, zéro échec et zéro ignoré. Santé, catalogue de **164 capacités** et 76 empreintes publiques vérifiés lors de la livraison ; **13 fichiers publics relus indépendamment**, dont le correctif `data-quality-ui.js`, CSS et PWA. Pas d’écriture de recette en production.

Les **28 lots, 48 propositions fonctionnelles A/I et 44 références T/M** sont rapprochés des documents d’origine. Les **92 identifiants et critères restent intacts**. Matrice détaillée : `docs/implementation/PROGRAMME_AUDIT_2026-10-25.md` et `.json`. Trois outils sont réellement réutilisés/intégrés dans leur portée (Playwright, PDF.js, Tesseract.js) ; les **41 autres références** restent facultatives et non importées. Aucune ambition stratégique ou promesse de revenu n’est déclarée acquise par ce bilan.

Défauts fermés : référence de preuve inexistante acceptée par le garde ; statuts d’outils/limites historiques contradictoires ; clic de reprise perdu lors d’un déplacement WebKit de **297 px** entre appui et relâchement, puis défilement/focus mobile sous l’en-tête. Test négatif conservé, placement des commandes stabilisé et défilement limité aux paramètres. **Trois régressions natives nouvelles** et **un scénario navigateur permanent dans chaque moteur**, assertions financières conservées. Vérifications locales complémentaires : 21 natifs ciblés et 11 WebKit, dont OCR réel FR/EN, tous réussis. Les échecs initiaux restent dans les artefacts locaux ; aucune relance aveugle du SHA final en CI.

BIR+ avant mutation du Worker : export D1 en lecture seule, restauration sur copie vierge, **50 tables / 48 attendues**, intégrité et clés étrangères valides. Archive privée R2 relue SHA256 `d4425a25da7b48cb8d87a8ce2bb8444962351432d25ef1da01d9b84105ecbfb6`. Portée **D1_AND_EXACT_SOURCE_ONLY** ; pièces R2, données/outbox d’appareil et prestataires exclus. Source exacte récupérable : `Eco-System_1.5.2.41_Source_Verifiee_6d3264bd_2026-10-25.zip`, **962 fichiers Git vérifiés**, SHA256 `db43508bd416a5aa9b862b089350e9e41d30716015858ba55ce984cb121435b4`. Aucune restauration de production ni migration.

Invariants conservés : dix étapes, rubriques et deux feuilles, Ledger/D1 canonique, politiques de prêt, Living Rules, droits, historique, Live et outbox. Aucun reset, force-push, fusion de main, nouveau fournisseur ou redémarrage. `realMoneyEnabled=false`, **`FIELD_ACCEPTED=NOT_ACCEPTED`** : l’acceptation sur vrais groupes, comptes et appareils reste distincte. URAE reste public conformément au choix déjà confirmé du fondateur ; aucune visibilité modifiée.

**ÉTAT DU PROJET APRÈS ÉTAPE** : programme audité, correctifs prouvés, qualifiés et publiés dans leur portée explicite. Aucun reliquat de code identifié dans ce programme borné ; tests terrain et résultats/contrats externes restent à valider. Réutiliser ces preuves du même SHA. Consommation exacte de crédits non mesurable.
