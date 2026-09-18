# MEMORY RECALL — MASTER 2.3.4 CLOSURE

Date: 2026-09-17
Branch: `next/1.4.0-master-2.3.4-closure-20260917`
Parent production checkpoint: `1817ad7d3c7dd8e2497244a6735e712a3a414253` (Eco-System 1.3.4)

## Objective

Close the gap between the product actually exposed by Eco-System and the full constitutional business baseline 2.3.4. The founder explicitly rejected the prior claim that the application was complete and requested a renewed confrontation of all previously supplied material with the deployed application.

## Authorities reread before code

1. `AGENTS.md` and current project truth files.
2. `ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.4_2026-09-05.md` from the founder's preserved File Library.
3. `FEATURE_REGISTRY.yaml`.
4. `packages/module-registry/src/index.ts` and `service-capabilities.ts`.
5. Current web shell and specialized UI modules.
6. Current API/application/domain packages and tests.
7. 3.0.0/3.1.0/3.2.0 documents only as additive later decisions; they do not erase an unimplemented 2.3.4 requirement.

## Recovered constitutional invariants

- Two fundamental group families only: rotating tontine and association.
- A rotating tontine supports multiple shares/names, multiple cycles, configurable beneficiaries, entrants in course with explicit jurisprudence, and money or in-kind operation.
- An association may contain zero, one or many rotating tontines and independent rubrics such as Collation, Secours, savings, school savings, loans, assistance, projects, charges and receipts.
- Rotating tontine -> association is an evolution of the same group identity, not a destructive recreation.
- Group creation is a ten-step cockpit, not a small form. It covers origin, family, governance, exercise/sessions, members, rotating/association rubric configuration, feasibility, communication, accessibility and complete preview.
- Membership lifecycle includes old/new members, invitations, import/history/seniority, waitlist, trial, suspension, reintegration, roles, multiple shares and rubric-specific participation.
- A rubric is a governed operating object with amount policy, frequency, obligation, member/share scope, deadline, payment method, penalty, interest, colour/order/cycle/state/visibility/calendar/ledger/carry-over semantics.
- Meeting Command Center must expose both mobile/card and matrix views over the same canonical business engine. A matrix cell creates a governed business intention; it is not a spreadsheet value detached from ledger/audit.
- Canonical ledger, idempotency, immutable evidence, tenant isolation, honest offline and UNKNOWN != SUCCEEDED are non-negotiable.
- Service Solidarity: each service has one named responsibility/owner, known dependencies, explicit forbidden responsibilities, failure behaviour and contract tests.
- PWA, low bandwidth/2G, FR/EN, seniors and low digital literacy are first-class product constraints.
- The historical Excel/VBA corpus is evidence of business semantics, not a mandate to reproduce Excel limitations.
- Features are not complete because their names appear in a catalogue. `VALIDATED`, `IMPLEMENTED`, `TESTED`, `DEPLOYED`, `PRODUCTION` remain distinct.

## Audit finding that triggered this closure

The 1.3.4 product contains substantial working engines, but the previous "Complete App" qualification was too weak as a completeness criterion. `tests/complete-app.test.mjs` verifies that more than 100 capability IDs exist, that the shell contains expected labels, and that the universal workspace persists a record. It does not prove that each capability is operational end-to-end.

At the same checkpoint, the module catalogue and Feature Registry still mark many Master 2.3.4 capabilities `STRUCTURAL_V1`, `PLANNED_DOMAIN` or otherwise incomplete. The public shell also retained stale 1.3.2/1.3.3/3.0.0 release labels despite a 1.3.4 deployment. Therefore the product may be deployed and test-green while still not being Master-complete.

## Acquired code that must not regress

The closure must preserve all 1.3.4 acquisitions: authenticated D1 flows; group creation and several independent tontines; canonical ledger and idempotency; meetings; member statements/control/reserves; savings-yield engines; loans and repayments; Secours and miscellaneous rubrics; two-sheet voice entry; member dossier; document ingestion; R2; forum/realtime; interest communities; group shop and market; AdManager/House Ads; Group Doctor; Meeting Autopilot; Founder Control; identity proof matching; Discovery/Membership foundations; PWA/offline; FR/EN; Premium Live; BIR+; `realMoneyEnabled=false`.

## Closure rule

No release may be labelled `MASTER_COMPLETE` while an in-scope Master 2.3.4 capability is only structural/planned or lacks the minimum contract appropriate to its risk. External-provider capabilities (real Mobile Money, SMS/WhatsApp/Telegram provider delivery, regulated wallet/escrow) must be labelled `EXTERNAL_GATED`, never faked as complete.

Implementation cycle for this branch:

`RECALL -> MAP OWNER/DEPENDENCIES -> CIR -> IMPLEMENT -> CONTRACT/REGRESSION TEST -> VERIFY -> UPDATE TRUTH -> DEPLOY WITH BIR+`.

Applied in guarded CI on 164f07456842856ffaa751cfe87fbe5fbac8a37a at 2026-09-17T20:54:38Z.

## Tranche 2 — gouvernance, notifications, invitations, calendrier, carnet membre
Applied from checkpoint c82d50a519d4a99b173c996c31ecfb5af49c0ddb at 2026-09-17T22:01:41Z. Dedicated contracts and UI are now under qualification; external provider delivery remains explicitly gated.


## Tranche 4 — correction de cohérence métier imposée par la vérité terrain (2026-09-18)

Le fondateur a signalé une régression fonctionnelle réelle malgré une CI verte. Cette tranche corrige la définition de la vérité opérationnelle avant toute nouvelle extension.

### Invariants non négociables relus dans le Cahier 2.3.4, les consignes récentes et les classeurs historiques
- **Toutes les rubriques actives du groupe** doivent apparaître sur les deux feuilles de saisie : « Votre feuille de séance » et « Vos fiches individuelles ». Une rubrique créée puis absente de ces deux surfaces est un défaut.
- Les trois rubriques Amendes / Inscription / Timbre de prêt sont des exemples/sous-rubriques « Autres », jamais un remplacement du catalogue réel du groupe.
- **Les deux feuilles sont les seules surfaces normales de saisie financière membre**. Les menus spécialisés servent à configurer, simuler, analyser et piloter ; ils ne doivent pas créer un troisième tunnel de saisie ordinaire.
- Une même écriture validée sur l’une des deux feuilles doit apparaître sur l’autre car elles lisent la même source canonique.
- Les rubriques Prêt, Remboursement, Remboursement intérêts, Prêt spécial et Remboursement spécial appartiennent à la matrice membres × rubriques, conformément aux feuilles Excel historiques.
- Un simple membre actif doit retrouver son groupe, sa propre fiche individuelle, ses soldes/rubriques et ses simulations autorisées depuis son compte. Il ne reçoit pas les droits Bureau sur les autres membres ou la répartition collective.
- Le simulateur de prêt doit présenter au moins six périodes/lignes et montrer distinctement capital, intérêt nouveau, paiement, capital remboursé, intérêt remboursé, capital restant, intérêts dus, dette totale et prochaine assiette taxable.
- Les menus spécialisés (Tontines, Prêts + Intérêts, Épargne + Intérêts, Assistances, Autres rubriques, Classements, Membres & habilitations, Eco IA) sont contextuels : une rubrique créée rend son domaine accessible ; l’absence d’une rubrique ne doit pas encombrer une tontine simple.
- Une CI verte ne suffit plus à déclarer ce parcours correct : il faut un test de non-régression « 20 rubriques -> 20 rubriques dans les deux feuilles » et un test « membre simple -> propre fiche financière visible ».

### Erreur corrigée
La tranche précédente a confondu **configuration de rubrique** et **surface de saisie financière** et a laissé subsister des tunnels historiques séparés (notamment « Autres » et le formulaire Finance). La correction doit unifier l’UX autour des deux feuilles sans créer de second Ledger ni perdre les moteurs spécialisés.


## Tranche 5 — clarification fondateur Prêts + Intérêts et nombre de rubriques (2026-09-18)

### Invariants métier
- Le nombre de rubriques n’est **jamais fixé à 20**. Le test à 20 n’était qu’un scénario de non-régression reproduisant le test terrain du fondateur. Un groupe peut avoir 1, 20, 40 rubriques ou une autre quantité dans la limite technique de sécurité ; la quantité est une décision du groupe.
- Le capital restant dû d’un prêt continue à générer l’intérêt de chaque nouvelle séance/période mensuelle jusqu’à apurement total du capital.
- Un remboursement partiel du capital réduit immédiatement l’assiette taxable ; le mois suivant, l’intérêt se calcule sur le capital restant.
- Les intérêts impayés sont reportés séparément. Ils ne deviennent pas du capital et ne produisent pas d’intérêt sur intérêt.
- Si le capital est totalement apuré mais qu’il reste des intérêts, le mois suivant n’ajoute aucun nouvel intérêt ; seule la dette d’intérêts demeure à régler.
- Le gestionnaire choisit et valide au niveau de la rubrique Prêt l’un des deux systèmes officiels de répartition d’un paiement : **CAPITAL_FIRST** ou **INTEREST_FIRST**. Il doit pouvoir simuler les deux avant validation.
- Lorsque la politique du groupe l’exige, un nouveau prêt est interdit tant que capital et intérêts du prêt précédent ne sont pas intégralement apurés.

### Exemple fondateur à verrouiller
Capital initial 50 000 XAF, taux 5 % par mois, paiements : mois 1 = 0, mois 2 = 30 000, mois 3 = 20 000.
- CAPITAL_FIRST : fin mois 1 = 50 000 capital + 2 500 intérêts ; mois 2 ajoute 2 500 intérêts puis rembourse 30 000 de capital -> 20 000 capital + 5 000 intérêts ; mois 3 ajoute 1 000 intérêts puis rembourse les 20 000 de capital -> capital 0, intérêts dus 6 000. Le mois 4 n’ajoute aucun intérêt ; paiement de 6 000 libère la dette.
- INTEREST_FIRST : fin mois 1 = 50 000 capital + 2 500 intérêts ; mois 2 ajoute 2 500 intérêts, le paiement 30 000 solde les 5 000 intérêts et amortit 25 000 de capital -> capital 25 000 ; mois 3 ajoute 1 250 intérêts, le paiement 20 000 solde 1 250 intérêts et amortit 18 750 de capital -> capital restant 6 250 ; mois 4 génère 5 % de 6 250, soit 312,5 théoriques, arrondis selon l’unité XAF de l’application, puis le paiement final libère la dette.

### Matrice de suivi
Colonnes = séances/mois ; lignes = Capital initial/début de période, Capital remboursé, Capital restant dû, Intérêt exigible, Intérêt payé, Intérêt restant dû, Paiement, Dette totale, Intérêt projeté prochain mois, Total dû prochaine séance. Pied = totaux et solde final.


## Tranche 6 — critiques terrain ciblées UI / deux feuilles / Tontines / Membres / Back-office (2026-09-18)

Le fondateur demande une correction **strictement ciblée** : ne pas modifier les parties non concernées.

### Deux feuilles
- « Votre feuille de séance » et « Vos fiches individuelles » doivent être visibles et accessibles comme de vraies surfaces de travail, pas comme des boutons qui renvoient vers un autre panneau.
- Les responsables doivent pouvoir saisir/modifier directement dans une cellule de tableau, ou via un petit pop-up ancré sur la cellule qui laisse le tableau visible.
- Le pop-up doit accepter de grands montants (millions/milliards) et conserver le contexte membre × rubrique × séance.
- La feuille de séance doit permettre de voir les données antérieures tout en saisissant la séance courante.
- La fiche individuelle doit permettre la même saisie canonique, avec les séances en lignes et les rubriques en colonnes.

### Prêts
- La matrice Prêt doit être manipulable plus simplement : le gestionnaire peut modifier les valeurs de simulation (capital initial, paiements mensuels, système) directement dans le tableau ou via un petit éditeur contextuel.
- Les deux systèmes CAPITAL_FIRST / INTEREST_FIRST restent inchangés ; ne pas toucher au moteur financier hors UX concernée.

### Tontines
- Toute rubrique de type TONTINE créée pendant le lancement doit apparaître automatiquement dans le menu Tontines.
- Ce menu doit aussi permettre de créer/configurer une nouvelle rubrique Tontine sans repasser par la création du groupe.
- « Rubrique Tontine » = sélection de la tontine concernée.
- « Nom du cycle » doit être reformulé pour être compréhensible (nom de l’exercice/cycle de cette tontine, avec valeur proposée automatiquement).
- « Montant indicatif du pot » devient « Montant total du pot » et se calcule automatiquement à partir du montant par part × nombre de parts/participants concernés lorsque ces données existent.
- Les sélecteurs Cycle et Membre doivent être effectivement alimentés.
- Le classement des bénéficiaires doit se faire dans le menu Tontines et alimenter le menu Classements/calendrier.

### Membres / Back-office
- « Membres & habilitations » doit être une vraie vue dédiée et ne plus simplement ouvrir « Réunion ».
- Le Dossier Membre doit être déplacé de Séance vers « Membres & habilitations ».
- Ajouter un vrai menu « Back-office » pour les dépenses/recap/opérations administratives déjà existantes ; ne pas dupliquer les moteurs.
- Éviter le doublon « Timbre » / « Timbre de prêt » : « Timbre de prêt » est l’intitulé métier ; ne pas créer un deuxième starter « Timbre ».

### Présentation
- « Plus de détail » du Carnet membre doit éviter les dumps techniques/bruts et privilégier des libellés métier lisibles.
