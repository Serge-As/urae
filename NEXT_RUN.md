# ECO-SYSTEM — NEXT RUN

Date : 2026-09-11

Lire d'abord `AGENTS.md`, `docs/memory/CURRENT_TRUTH.md`, `docs/memory/PROJECT_TRUTH_LEDGER.json`, le Cahier Maître, `FEATURE_REGISTRY.yaml` et les Recall/CIR.

## Acquis — ne pas refaire
- Complete App `1.0.0-complete-app` matérialisée et qualifiée.
- Payload SHA-256 exact : `69380f1dde05b02721ff1d1dee6774fab0a7ec2c5738c6439073f74fc36456ec`.
- CI distante : 48/48 PASS.
- Worker `eco-system` déployé.
- D1 `eco-system-db` réutilisée, aucune nouvelle base.
- Migrations additives ; aucune migration en attente au déploiement 1.0.
- Racine, health et catalogue capacités : smoke PASS.
- Catalogue : 139 capacités.
- `realMoneyEnabled=false`.
- PR Complete App #3 ouverte, non fusionnée.
- BIR+ final portable vérifié : run `34641572552`, artifact `10280162568`.
- Archive Library : `/Eco-System/ECO_SYSTEM_1.0_COMPLETE_APP_BIR_PLUS_FINAL_2026-09-11.zip`.
- ZIP SHA-256 : `21970e60e5d7a71a434c131a03904f5d72821d8cb449b0ec06db98d50bb0417f`.
- Source SHA-256 : `6707d2228bd9d396ef104357da674ac15ad8d5eeb7e73990f4fe1e6ec6b34ed3`.

## URL de référence
`https://eco-system.sergemimf.workers.dev/`

## Reprise normale
1. ne pas redéployer/recréer l'infrastructure sans besoin démontré ;
2. partir de la branche `next/1.0.0-complete-app` ou d'une branche dérivée ;
3. préserver Living Rules, Ledger/Membership canoniques, offline/outbox et isolation multi-tenant ;
4. faire évoluer les capacités encore structurelles vers des moteurs métier spécialisés sans créer de moteur parallèle ;
5. ajouter MiniSearch, géolocalisation/MapLibre ou IA locale uniquement si le besoin Eco-System est confirmé, avec consentement, confidentialité, budgets de ressources et tests old-device/offline ;
6. avant tout pilote financier élargi : auth/session robuste, MFA rôles sensibles, tests multi-tenant hostiles, observabilité, PRA/restore D1 et pilote contrôlé.

## Interdictions
- ne pas recréer `eco-system-db` ;
- ne pas demander les Secrets déjà acquis ;
- ne pas force-push ou fusionner `main` sans décision explicite ;
- ne pas activer l'argent réel ;
- ne pas publier PII/archives privées ;
- ne pas introduire de migration destructive ;
- ne pas hard-coder la pratique d'un groupe comme règle universelle.
