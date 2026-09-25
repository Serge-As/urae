# ECO-SYSTEM — PROJECT STATE

Date : 2026-09-13

## Ligne active
- Produit : `1.0.0-complete-app`
- Interface : **Master Cockpit — Cahier Maître 2.3.4 + validations Living Rules**
- Release PWA forcée : `master-cockpit-20260913-r2`
- Branche : `next/1.0.0-complete-app`
- URL : `https://eco-system.sergemimf.workers.dev/`
- URL anti-cache/reprise directe : `https://eco-system.sergemimf.workers.dev/?release=master-cockpit-20260913-r2`
- Worker : `eco-system`
- D1 : exclusivement `eco-system-db`
- `realMoneyEnabled=false`.
- `main` non fusionné.

## Incident terrain traité
Le fondateur voyait encore une ancienne interface malgré la présence du Master Cockpit dans la branche produit. La divergence était entre la source actuelle et un client/PWA ancien encore servi depuis son cache/service worker.

## Correction R2
- cache : `master-cockpit-20260913-r2` ;
- navigation network-first avec reload ;
- `skipWaiting()` + `clients.claim()` ;
- purge des anciens caches ;
- manifest installable R2 ;
- `release.json` public ;
- build et tests dédiés au remplacement de l'ancienne PWA.

## Qualification distante R2
- déploiement run `34739971297` : **SUCCESS** ;
- Recovery CI run `34739973185` : **SUCCESS** ;
- `npm run ci` : **53/53 PASS** ;
- Architecture Fitness : PASS ; Shared Governance : 23 ; Service Solidarity : 11 ;
- D1 : `eco-system-db` uniquement ; migrations additives ; **No migrations to apply** ;
- Worker Version ID : `ad5ee04e-3882-4f24-bc45-ebb56545e29a` ;
- root Master Cockpit + Cahier 2.3.4 : PASS ;
- health : PASS ; catalogue : 139 capacités PASS ; `realMoneyEnabled=false`.

## Périmètre honnête
Le Master Cockpit expose création/intégration/transformation, Meeting Command Center, Living Rules, finance/ledger, Discovery/Membership, communauté/gouvernance, marketplace/fournisseurs, AdManager, Academy/ONG/IA/Paper Bridge, rapports/intégrations, Inbox/offline et sécurité. Les `STRUCTURAL_V1` restent identifiés comme tels et ne sont pas présentés comme moteurs spécialisés terminés.

## Documentation de reprise
- `docs/recovery/ECO_SYSTEM_PROCEDURE_SAUVEGARDE_REPRISE_COMPLETE_APP_2026-09-13.md`
- `docs/handoff/ECO_SYSTEM_PROMPT_NOUVEAU_CHAT_CODEX_2026-09-13.md`
- `docs/memory/PROJECT_TRUTH_LEDGER_R2_ADDENDUM_2026-09-13.json`

## BIR+ R2 vérifié
- run `34740177562` SUCCESS ; artifact `10312268250` ;
- head `e2c79af771b8888741b73acf421e145045746303` ;
- ZIP SHA-256 `779910d6471d5c979c9b3dea1856319fc010027c390f7fecf71a758f86bd26e4` ;
- source SHA-256 `255268e3a6c613261acfd6d2541b6e14bb33a91f28f2e79ae79b8dc4721e3a01` ;
- vérification : ZIP digest exact, `sha256sum --check` OK, tar.xz lisible, 205 entrées.

## Garde-fous
Ne pas recréer D1/Secrets ; pas de force-push `main` ; pas de migration destructive ; pas de PII brute ; pas d'argent réel sans autorisation ; conserver tous les checkpoints.

## Point de reprise
Master Cockpit R2 est la référence visible. Continuer à spécialiser les capacités structurelles sans dupliquer les services canoniques ni casser Living Rules.
