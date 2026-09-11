# ECO-SYSTEM — NEXT RUN

Date : 2026-09-11

Lire d'abord `AGENTS.md`, `docs/memory/CURRENT_TRUTH.md`, `docs/memory/PROJECT_TRUTH_LEDGER.json`, le Cahier Maître 2.3.4, `FEATURE_REGISTRY.yaml` et les Recall/CIR.

## Acquis — ne pas refaire
- Interface active : **Master Cockpit — Cahier Maître 2.3.4**.
- PWA : `https://eco-system.sergemimf.workers.dev/`.
- URL anti-cache : `https://eco-system.sergemimf.workers.dev/?v=master-20260911`.
- Correctif UI principal : `9d9c0b117e80927edc02dfcd7ea899e4f2c34f08`.
- Déploiement qualifié : run `34645341363` SUCCESS.
- Worker version : `9ce22308-db14-4da7-9e6f-c2908b6db20c`.
- CI de déploiement : **52/52 PASS**.
- D1 : uniquement `eco-system-db`; aucune recréation ; aucune migration en attente.
- Root Master Cockpit, health et catalogue : PASS.
- Catalogue : 139 capacités.
- `realMoneyEnabled=false`.
- PR #3 ouverte, non fusionnée.
- Ancien BIR+ conservé comme fallback pré-Master-Cockpit ; produire/consommer le nouveau BIR+ post-correction dès qu'il est qualifié.

## Ce qui est maintenant visible
1. création/intégration/transformation en cockpit 10 étapes ;
2. séance avec matrice membres × rubriques ;
3. finance/ledger + portes d'entrée prêts, épargne, obligations, impayés, garants, enveloppes ;
4. Discovery/Membership bidirectionnel et consentement ;
5. communauté/gouvernance ;
6. marketplace/fournisseurs/achats groupés/Business Studio ;
7. AdManager ;
8. Academy/ONG/IA/Safety/Paper Bridge ;
9. rapports/recherche/calendrier/notifications/géolocalisation ;
10. sécurité/offline/audit/backups/compatibilité.

## Règle de vérité produit
Ne plus qualifier l'application de « complète » uniquement parce qu'une capacité existe dans le catalogue. Toujours distinguer :
- moteur spécialisé réellement actif ;
- structure/workspace persistant utilisable ;
- domaine planifié ;
- option ultérieure.
Le feedback terrain sur l'interface visible prime sur une conclusion abstraite tirée uniquement de la CI.

## Reprise
Continuer à convertir progressivement les capacités `STRUCTURAL_V1` prioritaires en moteurs spécialisés, sans dupliquer Ledger/Membership/Meeting/Living Rules et sans casser le Master Cockpit. Priorités : auth/session/MFA, hostile multi-tenant, prêts/épargne riches, Discovery bidirectionnel complet, gouvernance documentaire, PRA D1, tests Android ancien/faible débit et pilote contrôlé.

## Interdictions
- ne pas recréer `eco-system-db` ;
- ne pas redemander les Secrets acquis ;
- ne pas force-push/fusionner `main` sans décision explicite ;
- ne pas activer l'argent réel ;
- ne pas introduire de migration destructive ;
- ne pas hard-coder la pratique d'un groupe comme règle universelle ;
- ne pas masquer le vrai statut d'une capacité derrière une belle interface.
