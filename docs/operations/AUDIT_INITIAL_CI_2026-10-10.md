# URAE — audit initial CI sans exposition de code privé
Date : 10 octobre 2026 — revue documentaire, non qualification du produit.

## Périmètre vérifié
- Dépôt privé actuel : Serge-As/urae. Dépôt public auxiliaire : Serge-As/utrae.
- Branche applicative examinée : evidence/cloud-qualification-20261009-a7c3336. La branche main du dépôt privé est essentiellement documentaire.
- Répertoire .github/workflows de cette branche : 66 fichiers YAML listés.
- Exemples examinés : eco-15212-pr-qualification.yml, eco-q01-q28-qualification.yml, qualify-1.5.2.10-offline-conflicts-loans.yml, eco-confrontation-forensics-20261008.yml, deploy-1.5.2.10-offline-conflicts-loans.yml, backup-birplus-complete-app.yml.
- UTRAE main dispose d'un workflow public-smoke.yml et d'un test public-scope.test.mjs à liste blanche pour les fichiers suivis.
- Ce relevé d'inventaire ne vaut pas mesure de facturation GitHub, exhaustivité des déclenchements, ni permission de désactiver un workflow.

## Évidence de chevauchement à mesurer
1. eco-15212-pr-qualification.yml lance npm run ci et des tests Chromium/WebKit.
2. eco-q01-q28-qualification.yml exécute également npm run ci et des tests navigateurs sur la même branche cible et des chemins larges.
3. qualify-1.5.2.10-offline-conflicts-loans.yml lance npm run ci et Chromium/WebKit au push de plusieurs branches de travail.
4. Le workflow de livraison 1.5.2.15 relance des contrôles gouvernés et Node avant le déploiement. Ceci peut être nécessaire pour certifier le SHA de livraison; aucune suppression n'est approuvée par cet audit.
5. eco-confrontation-forensics-20261008.yml lance une preuve causale ciblée et un npm run ci. L'exigence de preuve avant/après doit être conservée.
6. Les workflows historiques et de sauvegarde sont nombreux, mais plusieurs sont manuels ou ciblés sur d'anciens marqueurs. Compter 66 fichiers ne signifie pas 66 jobs déclenchés par commit.
7. Les runs privés récents observés se terminent en quelques secondes avec conclusion failure. Avant de les qualifier d'erreur produit ou d'épuisement réel, examiner leurs jobs et la facturation sur le compte Serge-As.

## Plan de réduction de charge sans réduction de couverture
- Collecter pour 30 jours les runs par workflow, SHA, durée facturée Linux/Windows/macOS, événement, branche, tentatives, reruns, statut des jobs et justification des déploiements.
- Produire un tableau comparant les exécutions redondantes au **même SHA**. S'assurer qu'un workflow n'est pas requis pour un artefact, une branche, un environnement ou un gate distinct.
- Sur les branches non finales, n'annuler que les runs réellement obsolètes et non conservatoires; ne jamais annuler une qualification de livraison ou une sauvegarde critique.
- Appliquer paths/paths-ignore ou des filtres équivalents uniquement après analyse des dépendances indirectes (scripts, lockfile, workflow, cahier, gouvernance). Les changements de règles et de moteurs financiers restent couverts.
- Factoriser installations et builds seulement si le même arbre source et le même environnement sont testés; préserver les exigences de WebKit, Playwright, offline, Live et ledger.
- Le SHA candidat doit être qualifié intégralement par le gate gouverné avant merge/livraison. Aucun badge vert synthétique de UTRAE ne remplace un gate privé.
- Les builds Cloudflare sont distincts des minutes GitHub et des quotas d'exécution Workers/D1. Utiliser uniquement un accès privé et un staging isolé; aucune migration/déploiement implicite.
- Cible 100 minutes GitHub privé par jour pour étendre la couverture mensuelle théorique à 20 jours; cette cible est expérimentale, pas un plafond imposé aux tests obligatoires.

## Checklist avant PR technique d'optimisation
1. Inventaire exhaustif horodaté et coûts mesurés des workflows.
2. Cartographie de dépendances entre déclencheurs et gates.
3. Preuves de duplication sur SHA identique, absence d'effet métier supprimé.
4. Diff technique minimal, prototype sur branche privée, comparaison AVANT/APRÈS des mêmes tests et métriques.
5. Aucun secret, code métier, screenshot, résultat de test privé ou artefact envoyé au dépôt public UTRAE.
6. Aucune modification des marqueurs HOLD, realMoneyEnabled=false, FIELD_ACCEPTED=NOT_ACCEPTED.
7. Conservation de la production attestée 1.5.2.14-live-sync et de la PR #72 draft, sans livraison 1.5.2.15 avant qualification complète.
8. Documenter rollback et SHA exact, rattacher les preuves à la source et non au simple nom du workflow.

## Décision de ce lot
Cette PR documentaire actualise les règles de confidentialité et la propriété GitHub. Elle ne supprime/édite aucun workflow existant, ne modifie aucun module applicatif, ne déclenche aucun déploiement et ne publie aucun fichier dans UTRAE.
