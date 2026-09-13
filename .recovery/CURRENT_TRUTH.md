# ECO-SYSTEM — CURRENT TRUTH

Date : 2026-09-13

## Ligne produit active
- Produit déployé : `1.2.0-functional-completion`
- Branche : `next/1.2.0-functional-completion-20260913`
- URL PWA : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- D1 : exclusivement `eco-system-db`
- Worker Version ID vérifié : `f04625c8-30a9-4722-8de7-76f08f49b1e4`
- Workflow Cloudflare : run `34766061058` — **SUCCESS**
- Catalogue : **139 capacités**
- `realMoneyEnabled=false`
- `main` non fusionné.

## Multi-tontines — acquis
Le groupe n'a plus de « cotisation nominale unique » imposée par l'interface. Chaque rubrique/tontine est un plan autonome. Un même groupe peut avoir Tontine 1 000 F, Tontine 10 000 F, Savons, Huiles, Draps, etc.

Chaque rubrique porte son propre contexte : participation OPTIONAL/MANDATORY/RULE_BASED, support MONEY/IN_KIND/MIXED, article/unité/quantité, montant monétaire éventuel, participants, parts, pots, tours, durée et note de contexte. Les membres d'une tontine ne sont pas obligatoirement ceux d'une autre.

Test authentifié complet : run `34765998225` — **SUCCESS** (création de trois tontines distinctes, simulation, conversion puis relecture des trois rubriques persistées).

## PWA / authentification
Le Service Worker est enregistré et vérifié avant l'authentification, avec `updateViaCache:'none'`. Cache courant : `eco-system-cahier-app-v120-completion-r3-20260913`. Navigation et scripts : network-first. Une expiration de session ouvre la connexion sans effacer le formulaire courant de la page.

## Infrastructure
- D1 existante réutilisée ; migrations additives uniquement ; déploiement 1.2 : **No migrations to apply**.
- R2 reste indisponible via le compte/token GitHub : Cloudflare code `10042`.
- Mode production actuel pour petits artefacts : `D1_FALLBACK` borné. Ne pas prétendre que R2 est actif tant que le code 10042 subsiste.
- Le fallback n'active pas l'argent réel et ne crée pas de second Ledger.

## Sauvegardes
- Pré-déploiement multi-tontines : run `34766026113` — **SUCCESS**.
- Export D1 restauré dans SQLite avec `PRAGMA integrity_check = ok`.
- Source + SQL + empreintes sauvegardés en GitHub Artifact ; tentative R2 non bloquante.
- Une sauvegarde post-déploiement est exécutée après validation de production.

## Garde-fous
Ne pas recréer `eco-system-db`, ne pas recréer les secrets Cloudflare, ne pas migration destructive, ne pas fusionner/force-push `main` sans décision explicite, ne pas activer l'argent réel, ne pas publier de PII, ne pas casser Living Rules, Ledger/Membership canoniques, isolation multi-tenant, idempotence, outbox et récupération.

## Point de reprise
Continuer uniquement depuis `next/1.2.0-functional-completion-20260913`. Ne pas restaurer l'ancien cockpit 2.3.4 / build 2026-09-11 ni réintroduire une cotisation nominale globale.
