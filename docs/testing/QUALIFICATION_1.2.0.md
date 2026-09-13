# Eco-System 1.2 — Qualification vérifiée

Date : 2026-09-13  
Version : `1.2.0-functional-completion`  
Branche : `next/1.2.0-functional-completion-20260913`

## Résultat global

**QUALIFIÉ ET DÉPLOYÉ.**

- CI fonctionnelle finale : run `34766060912` — SUCCESS.
- Déploiement Cloudflare : run `34766061058` — SUCCESS.
- Worker Version ID : `f04625c8-30a9-4722-8de7-76f08f49b1e4`.
- D1 : `eco-system-db`, réutilisée.
- Migrations : additives uniquement ; `No migrations to apply`.
- Smoke : racine, `/health` et catalogue — PASS.
- `/health.version = 1.2.0-functional-completion`.
- Catalogue : 139 capacités.
- `realMoneyEnabled=false`.

## Qualification du lancement multi-tontines

Le lancement n'utilise plus une cotisation nominale unique. Chaque rubrique est autonome et peut définir :
- participation libre, obligatoire ou selon règle;
- argent, nature ou mixte;
- article, unité et quantité;
- ses propres participants;
- montant, parts, pots, tours et durée;
- coûts/frais et note contextuelle.

Cas qualifié :
1. Tontine 1 000 F — participants propres;
2. Tontine 10 000 F — participants propres;
3. Savons — tontine en nature, quantité par part.

Le run `34765998225` a vérifié en session authentifiée :
connexion → création du projet → simulation → conversion → récupération des trois rubriques persistées.

## PWA / cache

- Service Worker enregistré avant vérification de session.
- `updateViaCache:'none'`.
- cache courant : `eco-system-cahier-app-v120-completion-r3-20260913`.
- navigation et modules exécutables network-first.
- anciens caches Eco-System supprimés à l'activation.

Objectif : un navigateur ayant l'ancien cockpit 2.3.4 ne doit plus rester bloqué durablement sur cette version après actualisation.

## Authentification

Les routes métier restent protégées. La nouvelle UI montre l'authentification avant utilisation si aucune session n'existe. Si une session expire pendant une saisie, l'écran de reconnexion est superposé sans remise à zéro volontaire du formulaire courant.

## R2

Le workflow tente R2, mais Cloudflare répond toujours `10042` avec le compte/token GitHub. La production a donc déployé `R2_MODE=D1_FALLBACK`. Le fallback est privé, borné et réservé aux petits artefacts. Il ne remplace ni D1 comme source structurée ni le Ledger canonique.

## Sauvegardes

Pré-déploiement du correctif multi-tontines :
- run `34766026113` — SUCCESS;
- source archivée;
- D1 exportée;
- restauration SQLite réussie;
- `PRAGMA integrity_check = ok`;
- empreintes SHA-256 vérifiées;
- GitHub Artifact produit.

Post-déploiement : workflow BIR+ déclenché après la validation de production.

## Limites qui ne doivent pas être masquées

- R2 direct non certifié tant que le code Cloudflare 10042 persiste.
- `realMoneyEnabled=false`.
- Une capacité de catalogue ou un workflow générique ne suffit pas à certifier un moteur métier sans parcours spécialisé, persistance, contrôle d'accès et tests.
- Les pilotes terrain OCR/voix et certaines validations old-device doivent continuer à être qualifiés séparément avant d'être présentés comme acquis.
