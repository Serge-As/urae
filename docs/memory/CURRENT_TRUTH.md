# ECO-SYSTEM — CURRENT TRUTH

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
Le fondateur voyait encore une ancienne interface malgré la présence du Master Cockpit dans la branche produit. La divergence était entre **source déployable actuelle** et **client/PWA ancien encore servi depuis son cache/service worker**, et non une absence du Master Cockpit dans le dépôt.

Correction R2 :
- nouveau namespace de cache `master-cockpit-20260913-r2` ;
- navigation PWA network-first avec `cache: reload` ;
- `skipWaiting()` + `clients.claim()` ;
- purge des anciens caches à l'activation ;
- manifest installable pointant sur la release R2 ;
- `release.json` public comme sentinelle de version ;
- build copie explicitement la sentinelle et le nouveau service worker ;
- test de non-régression dédié au remplacement de l'ancienne PWA.

## Qualification distante R2
- commit de déclenchement : `2cb42fcc793daa9e5d421bac508b62bfdc806424`
- workflow : `Eco-System 1.0 Complete App — Cloudflare`
- run : `34739971297` — **SUCCESS**
- Recovery CI parallèle : run `34739973185` — **SUCCESS**
- `npm run ci` : **53/53 PASS**
- TypeScript strict : PASS
- Architecture Fitness : PASS
- Shared Governance : **23 guardrails PASS**
- Service Solidarity : **11 services canoniques PASS**
- Constitution / Truth / Memory / Source Coverage : PASS
- build PWA : PASS
- D1 : `eco-system-db` réutilisée, aucune base de remplacement
- migrations distantes : additives uniquement, **No migrations to apply**
- binding : `env.DB (eco-system-db)`
- assets R2 publiés : `/release.json`, `/manifest.webmanifest`, `/sw.js`
- Worker Version ID : `ad5ee04e-3882-4f24-bc45-ebb56545e29a`
- racine distante : **Master Cockpit + Cahier Maître 2.3.4 PASS**
- `/health` : `1.0.0-complete-app` PASS
- `/api/v1/product/capabilities` : **139 capacités PASS**
- `realMoneyEnabled=false` : PASS

## Périmètre honnête
Le Master Cockpit rend visibles les domaines validés : création/intégration/transformation, Meeting Command Center, Living Rules, finance/ledger, Discovery/Membership, communauté/gouvernance, marketplace/fournisseurs, AdManager, Academy/ONG/IA/Paper Bridge, rapports/intégrations, Inbox/offline et sécurité. Les moteurs déjà canoniques restent réutilisés. Une capacité `STRUCTURAL_V1` reste signalée comme structurelle/workspace ; sa visibilité n'est jamais présentée comme preuve d'un moteur finalisé.

## Doctrine
Règle écrite, pratique observée et politique opérationnelle validée restent distinctes. Les exceptions sont gouvernées. La clôture est un checkpoint versionné. Attendu, encaissé, manque/dette, solidarité et décaissement restent des flux distincts. L'offline financier reste une intention jusqu'à confirmation serveur.

## Documentation de reprise
- Procédure : `docs/recovery/ECO_SYSTEM_PROCEDURE_SAUVEGARDE_REPRISE_COMPLETE_APP_2026-09-13.md`
- Prompt nouveau chat/Codex : `docs/handoff/ECO_SYSTEM_PROMPT_NOUVEAU_CHAT_CODEX_2026-09-13.md`
- Truth Ledger R2 additif : `docs/memory/PROJECT_TRUTH_LEDGER_R2_ADDENDUM_2026-09-13.json`

## BIR+ Master Cockpit R2 — VÉRIFIÉ
- workflow : `Eco-System 1.0 — BIR+ Verified Source Backup`
- run : `34740177562` — **SUCCESS**
- artifact ID : `10312268250`
- head archivé : `e2c79af771b8888741b73acf421e145045746303`
- SHA-256 ZIP : `779910d6471d5c979c9b3dea1856319fc010027c390f7fecf71a758f86bd26e4`
- SHA-256 archive source : `255268e3a6c613261acfd6d2541b6e14bb33a91f28f2e79ae79b8dc4721e3a01`
- vérification indépendante : digest ZIP = digest GitHub ; `sha256sum --check` OK ; archive tar.xz lisible ; **205 entrées** ; présence contrôlée de `apps/web/index.html`, `apps/web/sw.js`, `apps/web/release.json`, Current Truth, Truth Ledger, procédure de sauvegarde et prompt de reprise.
- fichier téléchargé : `ECO_SYSTEM_MASTER_COCKPIT_R2_BIR_PLUS_2026-09-13.zip`.

## Garde-fous
Ne pas recréer `eco-system-db` ni les Secrets. Pas de force-push `main`. Pas de migration destructive. Pas de PII fondatrice brute. Pas d'argent réel sans autorisation distincte. Ne pas supprimer les checkpoints Recovery/Alpha/0.6/1.0.

## Point de reprise
La référence visible est désormais **Master Cockpit R2**. Toute évolution part de cette ligne, conserve l'honnêteté des statuts et produit un nouveau BIR+ après qualification.
