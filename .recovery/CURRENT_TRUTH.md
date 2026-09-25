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
Le fondateur voyait encore une ancienne interface malgré la présence du Master Cockpit dans la branche produit. Cause qualifiée : client/PWA ancien encore servi depuis cache/service worker.

## Correction R2
- cache `master-cockpit-20260913-r2` ; navigation network-first/reload ;
- `skipWaiting()` + `clients.claim()` ; purge anciens caches ;
- manifest installable R2 ; `release.json` public ; build et tests dédiés.

## Qualification distante
- deploy `34739971297` SUCCESS ; Recovery CI `34739973185` SUCCESS ;
- `npm run ci` **53/53 PASS** ; Architecture/Shared Governance/Service Solidarity/Truth/Memory/Constitution/Source Coverage PASS ;
- D1 `eco-system-db` uniquement ; **No migrations to apply** ;
- Worker Version ID `ad5ee04e-3882-4f24-bc45-ebb56545e29a` ;
- root Master Cockpit + Cahier 2.3.4 PASS ; health PASS ; catalogue 139 PASS ; argent réel false.

## Vérité produit
Les domaines du Cahier sont visibles dans le Master Cockpit avec statut honnête. Les `STRUCTURAL_V1` sont des workspaces/structures et ne doivent pas être annoncés comme moteurs métier finalisés.

## Documentation
- procédure : `docs/recovery/ECO_SYSTEM_PROCEDURE_SAUVEGARDE_REPRISE_COMPLETE_APP_2026-09-13.md`
- prompt nouveau chat/Codex : `docs/handoff/ECO_SYSTEM_PROMPT_NOUVEAU_CHAT_CODEX_2026-09-13.md`
- ledger R2 additif : `docs/memory/PROJECT_TRUTH_LEDGER_R2_ADDENDUM_2026-09-13.json`

## BIR+ R2 vérifié
- run `34740177562` SUCCESS ; artifact `10312268250` ; head `e2c79af771b8888741b73acf421e145045746303` ;
- ZIP SHA-256 `779910d6471d5c979c9b3dea1856319fc010027c390f7fecf71a758f86bd26e4` ;
- source SHA-256 `255268e3a6c613261acfd6d2541b6e14bb33a91f28f2e79ae79b8dc4721e3a01` ;
- ZIP digest exact ; `sha256sum --check` OK ; tar.xz lisible ; 205 entrées.

## Garde-fous
Pas de recréation D1/Secrets, pas de force-push `main`, pas de migration destructive, pas de PII brute, pas d'argent réel sans autorisation, conserver les checkpoints historiques.

## Point de reprise
Master Cockpit R2 est la référence. Poursuivre la spécialisation des capacités structurelles sans régression, avec BIR+ après chaque lot significatif.
