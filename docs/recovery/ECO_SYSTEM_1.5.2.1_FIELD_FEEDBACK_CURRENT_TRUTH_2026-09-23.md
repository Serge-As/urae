# Eco-System 1.5.2.1 — Field Feedback Current Truth — 2026-09-23

## 1. ÉTAT DU PROJET APRÈS ÉTAPE

### Version
`1.5.2.1-field-finance-debt-ux`

### Branche
`release/1.5.2-unified-ux-blueprint-20260923`

### Commit production
`109078c84374dddf5f64d8d836a2a726fd4a92ea`

### État GitHub
- PR hotfix **#15** fusionnée.
- Qualification hotfix : **35870359776 SUCCESS**.
- Qualification après merge : **35870603766 SUCCESS**.
- Gate release après configuration déploiement : **35870652283 SUCCESS**.
- Workflow production complet : **35870745271 SUCCESS**.
- Documents de vérité 1.5.2.1 ajoutés après déploiement sur la même branche ; ils ne changent pas le code production.

### État Cloudflare
- Worker : `eco-system`.
- URL : `https://eco-system.sergemimf.workers.dev/`.
- Worker Version ID : `ca489d19-f8ae-4baa-b3d7-3ff99df67d0c`.
- Runtime : `1.5.2.1-field-finance-debt-ux`.
- Build ID : `eco-system-1.5.2.1-20260923`.
- PWA cache : `eco-system-v1521-field-finance-debt-ux-20260923`.
- Catalogue : **158 capacités**.
- D1 : `eco-system-db` réutilisée.
- Migrations : **No migrations to apply**.
- R2 : `eco-system-backups`, `artifactStorageMode=R2`.
- `realMoneyEnabled=false`.

### Sauvegarde / récupération
- Pré-déploiement D1 : artifact **10754976768**.
- Post-déploiement D1 : artifact **10755136726**.
- Export post restauré dans SQLite ; `PRAGMA integrity_check=ok`.
- SHA256 générés par le workflow.
- Aucun remplacement de D1/R2.

### Problèmes terrain à l'origine du hotfix
1. Saisie dans feuille de séance / fiche individuelle visible mais non prise en compte.
2. Roue souris bloquée au-dessus du tableau.
3. Prêt traité visuellement/métier comme une valeur positive alors qu'il doit décaisser la caisse.
4. Dette totale ne montrait pas correctement capital + intérêts et l'attribution à la séance suivante.
5. Cadre minimal des pages insuffisamment harmonisé.
6. Confirmation de restauration Corbeille trop persistante.
7. Alertes Accueil non scalables.
8. Mode Visuel phare trop proche des deux autres modes.
9. Page Membres : boutons écrasés verticalement.
10. `\n` littéral visible au-dessus du shell dans certaines vues.

## 2. Corrections réellement implémentées

### 2.1 Tableaux financiers canoniques
Le renderer unique reste dans `apps/web/src/main.js`.
Le bouton ✓ utilise désormais `ConnectedApplication.recordFinancialSheetEntry(...)` pour une première saisie et respecte la nature de la rubrique :
- CONTRIBUTION → contribution canonique ;
- OUTFLOW → dépense de séance canonique ;
- LOAN → création / approbation / décaissement du prêt ;
- REPAYMENT → remboursement du prêt actif.

Une correction d'une valeur déjà existante dans une rubrique spécialisée n'est pas transformée en pseudo-contribution : elle est redirigée vers le dossier spécialisé afin de préserver Ledger, dette et preuves.

### 2.2 Prêt et dette
- Prêt = sortie de caisse.
- Dette prêt = capital restant + intérêts dus.
- Dette totale membre = dette prêt + autres obligations.
- Accueil gestionnaire, Accueil membre, Séances et fiche détaillée affichent cette décomposition.

### 2.3 Intérêt de la séance suivante
À la clôture de la séance N :
- l'intérêt est calculé une seule fois sur le capital restant ;
- il est ajouté à `unpaidInterest` ;
- son `sourceClosedMeetingId` est N ;
- son `interestAppliesToMeetingId` est N+1 si N+1 existe, sinon `Séance suivante` ;
- il devient visible immédiatement après clôture de N ;
- il n'est pas ré-accru au remboursement de N+1 ;
- aucun intérêt sur intérêt n'est créé.

### 2.4 UX
- Tableaux : `overflow-x:auto`, `overflow-y:visible`, page scroll vertical rétabli.
- Membres : barre de gestion en grille lisible, sans mots cassés lettre par lettre.
- Alertes : Home = 5 prioritaires maximum ; Centre d'alertes = jusqu'aux 100 plus pertinentes affichées, triées.
- Corbeille : élément restauré affiché 72 h comme confirmation puis masqué.
- Visuel : hero/panneaux/métriques/navigation enrichis sans fork métier.
- Shell : retrait du `\n` visible et cache PWA 1.5.2.1 atomique.

## 3. Tests / résultats
Nouveaux tests :
- `tests/field-feedback-1.5.2.1.test.mjs`.
- test de clôture prêt modifié dans `tests/master-2.3.4-tranche3.test.mjs`.

Résultat :
- qualification hotfix complète **SUCCESS** ;
- qualification post-merge **SUCCESS** ;
- qualification production **SUCCESS** ;
- smoke Cloudflare exact commit/version/build/cache/catalogue **SUCCESS** ;
- sauvegarde pré/post + restauration SQLite **SUCCESS**.

## 4. Acquis à préserver
- 10 étapes de création.
- Collation.
- rubriques variables / multi-tontines.
- Living Rules / RI.
- Ledger canonique unique.
- RECAP / séance / carryover.
- correction financière gouvernée, consensus et revue indépendante.
- Prêts / intérêts sans capitalisation automatique des intérêts impayés.
- offline/outbox/session locale.
- Community / Forum / Live.
- Marketplace / Business Studio / Kit / Learning.
- Control Center / supervision.
- D1 + R2 existants.
- `realMoneyEnabled=false`.

## 5. Reste / recette terrain obligatoire
La livraison distante est terminée, mais **FIELD_ACCEPTED reste à faire** sur appareils réels.

Scénario court à retester :
1. feuille de séance : saisir un montant, ✓, vérifier affichage et total ;
2. fiche individuelle : même test ;
3. prêt : décaisser, vérifier baisse de caisse et dette ;
4. clôturer séance N, vérifier l'intérêt immédiatement visible mais marqué pour N+1 ;
5. roue souris au-dessus du tableau ;
6. Membres : modifier/Corbeille sans boutons verticaux ;
7. restaurer un élément et confirmer le message 72 h ;
8. Accueil : 5 alertes max + Centre d'alertes ;
9. comparer Visuel / Senior / Assisté.

## 6. À ne pas modifier sans décision explicite
- ne pas recréer `eco-system-db` ;
- migrations additives seulement ;
- pas de second Ledger ;
- pas de second renderer financier ;
- pas de paiement réel ;
- ne pas déclarer FIELD_ACCEPTED sur la seule base de CI/smoke ;
- ne pas supprimer les parcours historiques pour simplifier une nouvelle UX.

## 7. Point de reprise
1. lire `docs/memory/CURRENT_TRUTH.md` ;
2. lire ce document ;
3. vérifier le HEAD distant de `release/1.5.2-unified-ux-blueprint-20260923` ;
4. vérifier la dernière CI ;
5. comparer la production au commit déployé `109078c84374dddf5f64d8d836a2a726fd4a92ea` ;
6. ne corriger qu'un défaut reproductible après ajout d'un test permanent.

## 8. Régression possible à surveiller
- Service Worker ancien conservé par un navigateur déjà ouvert : forcer une actualisation normale puis laisser la version 1.5.2.1 s'installer ; ne pas contourner avec un cache non versionné.
- groupes anciens dont la rubrique Prêt n'a pas encore de politique/taux : le décaissement doit refuser clairement plutôt qu'inventer un taux.
- membre avec plusieurs prêts actifs : remboursement depuis la feuille doit demander de passer par le dossier Prêts pour choisir le bon prêt.
- correction d'une sortie/prêt déjà comptabilisée : utiliser le dossier spécialisé, ne pas la transformer en contribution.
- future séance non encore créée : l'intérêt post-clôture reste libellé « Séance suivante » jusqu'à attribution.

## 9. Autorisation prochaine action
Aucune mutation supplémentaire de production n'est nécessaire pour clôturer ce hotfix.
La prochaine action normale est **la recette terrain du fondateur**.
Une nouvelle implémentation n'est justifiée qu'après feedback reproductible ou nouvelle décision produit explicite.
