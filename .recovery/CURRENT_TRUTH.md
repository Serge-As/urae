# ECO-SYSTEM — CURRENT TRUTH

Date : 2026-09-11

## Ligne produit active
- Produit : `1.0.0-complete-app`
- Interface active : **Master Cockpit — Cahier Maître 2.3.4**
- Branche : `next/1.0.0-complete-app`
- URL PWA : `https://eco-system.sergemimf.workers.dev/`
- URL anti-cache immédiate : `https://eco-system.sergemimf.workers.dev/?v=master-20260911`
- Worker : `eco-system`
- D1 : exclusivement `eco-system-db`
- `realMoneyEnabled=false` : invariant confirmé à distance.
- `main` : non fusionné.

## Correction terrain — ACQUISE
Le fondateur a constaté que la précédente interface visible ressemblait à une ancienne version et ne matérialisait pas correctement le Cahier Maître malgré la présence du catalogue et des fondations backend. Ce constat est désormais traité comme une régression produit réelle : **structure/capacités ≠ application visible conforme au cahier**.

Correction livrée :
- commit Master Cockpit : `9d9c0b117e80927edc02dfcd7ea899e4f2c34f08`
- Group Creation Cockpit en **10 étapes** au lieu du petit formulaire précédent ;
- Meeting Command Center avec vue opérationnelle et matrice membres × rubriques ;
- vues dédiées Finance, Discovery/Membership, Communauté/Gouvernance, Marketplace/Fournisseurs, AdManager, Academy/ONG/IA/Paper Bridge, Rapports/Intégrations, Services, Inbox et Sécurité ;
- statut réel des capacités affiché : `FOUNDATION_ACTIVE`, `STRUCTURAL_V1`, `PLANNED_DOMAIN`, `LATER_OPTIONAL` ; aucune fausse complétude ;
- palette mobile/desktop beige, vert, rose, noir et contrôles tactiles ;
- Service Worker remplacé par `eco-system-master-cockpit-20260911-v1`, navigation critique network-first, purge des anciens caches et enregistrement cache-busté.

## Qualification distante — MASTER COCKPIT
- workflow : `Eco-System 1.0 Complete App — Cloudflare`
- run : `34645341363` — **SUCCESS**
- source déployée : head `34684851b14119afa45b513f37c5543ca8260f21`
- `npm run ci` : **52/52 PASS**
- TypeScript strict : PASS
- Architecture Fitness : PASS
- Shared Governance : **23 guardrails PASS**
- Service Solidarity : **11 services canoniques PASS**
- Truth / Memory / Constitution / Source Coverage : PASS
- D1 : `eco-system-db`, réutilisée ; aucune nouvelle base
- migrations distantes : additives uniquement ; **No migrations to apply**
- binding : `env.DB (eco-system-db)`
- Worker Version ID : `9ce22308-db14-4da7-9e6f-c2908b6db20c`
- racine : doctype + **Master Cockpit** + **Cahier Maître 2.3.4** PASS
- `/health` : version `1.0.0-complete-app` PASS
- `/api/v1/product/capabilities` : **139 capacités** PASS
- `realMoneyEnabled=false` : PASS

## Capacités métier visibles et honnêtes
Les moteurs déjà canoniques restent réutilisés : Ledger, Membership, Living Rules, Meeting, offline/outbox, D1 et services du kernel. Les domaines encore `STRUCTURAL_V1` sont accessibles via un workspace persistant D1 et leur statut est affiché comme tel ; leur présence dans l'UI n'est pas présentée comme un moteur métier spécialisé finalisé.

## Pull Request
- PR #3 : **Eco-System 1.0 — Complete App deployable**
- `https://github.com/Delor85/tontine-platform/pull/3`
- OPEN, non-draft, non fusionnée.
- Fusion de `main` interdite sans décision séparée.

## Doctrine maintenue
Living Rules : règle écrite, pratique observée et politique opérationnelle validée restent distinctes. Les exceptions sont gouvernées ; la clôture de réunion reste un checkpoint versionné ; attendu, encaissé, manque/dette, solidarité et décaissement sont des flux distincts.

## Garde-fous
Ne pas recréer `eco-system-db` ou les Secrets. Ne pas force-push `main`. Aucune migration destructive. Aucune PII fondatrice brute. Aucun argent réel sans autorisation séparée. Ne jamais confondre « capacité cataloguée », « workspace structurel » et « moteur métier spécialisé qualifié ».

## Sauvegarde
L'ancien BIR+ 1.0 reste conservé comme fallback pré-Master-Cockpit. Une nouvelle sauvegarde BIR+ post-correction doit être générée après cette mise à jour de vérité.
