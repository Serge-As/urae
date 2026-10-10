# ECO — Reprise du développement après transfert (10 octobre 2026)

**Code original unique :** [Serge-As/urae](https://github.com/Serge-As/urae) (privé). **CI publique auxiliaire :** [Serge-As/utrae](https://github.com/Serge-As/utrae). Aucun nouveau frontend ou backend. Aucun retrait des rubriques, Discover, prêts, intérêts, groupes, cockpits, PWA, Outbox, DO, Worker ou D1 pour économiser la CI. Ne pas toucher à Delor85.

## Branche de travail
La branche de référence applicative récemment vérifiée est `evidence/cloud-qualification-20261009-a7c3336`. La branche par défaut `main` est essentiellement documentaire et ne doit pas devenir la base de livraison par erreur. Toute PR de fonctionnalités doit cibler une branche applicative confirmée.

## Répartition de calcul
**URAE privé / 2 000 minutes GitHub Free si disponibles sur Serge-As :** fraction ciblée de tests et audits sensibles, notamment atomisation du ledger, rôles, prêts, intérêts, groupes et données offline. Vérifier la facturation réelle du compte; ne pas supposer un solde positif après transfert. L'épuisement des minutes GitHub-hosted n'empêche pas l'exécution des tests locaux ni d'un runner privé auto-hébergé.

**UTRAE public / runners standards sans allocation mensuelle de minutes :** volume important de tests indépendants avec sources explicitement approuvées, mocks et fixtures fictifs; jamais de checkout du privé, PAT, secrets, source maps ou artefacts privés. Le code financier complet doit rester privé, y compris les règles rubriques/Discover. Une CI UTRAE verte ne qualifie pas ECO.

**Cloudflare Builds / objectif de 3 000 minutes/mois du plan Free si applicable :** compilations et déploiements sélectifs du produit actuel, staging isolé D1/R2, pas de reconfiguration ou migration prod automatiquement. Ne pas confondre Builds avec appels Workers/D1.

**Windows local/runner privé :** suite complète du code réel sans minutes GitHub-hosted. Compteurs de coût répartis par exécution, pas selon pourcentage de lignes de code. Préserver toutes les fonctionnalités; optimiser les déclenchements et la fréquence des validations non critiques, pas la sécurité.

## Première procédure exécutable

Sur Windows/Git Bash, utiliser le clone PRIVÉ propre (vérifier `git status` avant de changer de branche) :

```bash
cd /c/Users/Admin/Desktop/tontine-platform
git status
git remote -v
git remote set-url origin https://github.com/Serge-As/urae.git
git fetch origin --prune
# Après avoir confirmé un dossier sans modifications locales non sauvegardées :
git switch evidence/cloud-qualification-20261009-a7c3336
node --version   # Node >=24
npm ci --ignore-scripts
npm run typecheck
npm run lint:architecture
npm test
npm run ci       # suite complète de validation du code existant
```

**Runner Windows dans GitHub (OPTIONNEL pour économiser les minutes) :** [Settings → Actions → Runners](https://github.com/Serge-As/urae/settings/actions/runners), enregistrer un Windows x64 **réservé au dépôt privé** et maîtrisé (non administrateur si possible). Le workflow `.github/workflows/eco-private-windows-manual.yml` attend précisément les labels `self-hosted`, `Windows`, `X64`, démarre uniquement par `workflow_dispatch`, accepte `quick` ou `full`, et n'effectue aucun déploiement. Le fichier de workflow doit également être présent sur la branche par défaut pour apparaître dans l'interface Actions; ne pas choisir la branche `main` pour tester l'application (elle est documentaire). Ne jamais rattacher ce runner au dépôt UTRAE public ou à des PR non fiables.

## Qualification mobile
Le serveur de développement actuel écoute seulement `127.0.0.1` et contrôle l'en-tête Host. Ne pas ouvrir le port au LAN sans adapter la sécurité. Recette ECO réelle : tunnel HTTPS authentifié ou Cloudflare **staging isolé** avec jeu de données fictif et test de la PWA, permissions, deux téléphones, WebSocket, offline/outbox, groupes, rubriques, Discover, prêt, intérêts et idempotence. Aucune opération d'argent réel tant que release HOLD et contrôles critiques non validés.

## Fusion et livraison
Chaque PR privée doit mentionner SHA, commandes exécutées, résultats PASS/FAIL réels, impacts sur D1/PWA/IndexedDB `tontine-platform` et stratégie de retour arrière. Ne jamais contourner la validation financière en prétendant que les tests publics indépendants prouvent la sécurité du produit complet. Pas de déploiement ni migration D1/R2 automatiques dans cette préparation.

Références : [transfert et coûts #78](https://github.com/Serge-As/urae/issues/78), [reprise #77](https://github.com/Serge-As/urae/issues/77), [périmètre sensible #75](https://github.com/Serge-As/urae/issues/75).
