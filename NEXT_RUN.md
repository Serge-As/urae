# ECO-SYSTEM — NEXT RUN

Date : 2026-09-13

Lire d'abord `AGENTS.md`, `docs/memory/CURRENT_TRUTH.md`, `docs/memory/PROJECT_TRUTH_LEDGER.json`, `PROJECT_STATE.md`, le Cahier Maître 2.3.4 réellement accessible, `FEATURE_REGISTRY.yaml`, `docs/recovery/ECO_SYSTEM_PROCEDURE_SAUVEGARDE_REPRISE_COMPLETE_APP_2026-09-13.md`, puis les Recall/CIR pertinents.

## Acquis — ne pas refaire
- Interface active : **Master Cockpit R2 — Cahier Maître 2.3.4 + Living Rules**.
- Release : `master-cockpit-20260913-r2`.
- URL : `https://eco-system.sergemimf.workers.dev/`.
- URL anti-cache/reprise : `https://eco-system.sergemimf.workers.dev/?release=master-cockpit-20260913-r2`.
- Déploiement R2 : run `34739971297` SUCCESS.
- Recovery CI : run `34739973185` SUCCESS.
- Worker Version ID : `ad5ee04e-3882-4f24-bc45-ebb56545e29a`.
- `npm run ci` : **53/53 PASS**.
- D1 : uniquement `eco-system-db` ; aucune nouvelle base ; **No migrations to apply**.
- assets forcés R2 : `release.json`, `manifest.webmanifest`, `sw.js`.
- root Master Cockpit + Cahier 2.3.4, `/health`, catalogue 139 capacités : PASS.
- `realMoneyEnabled=false`.
- PR #3 ouverte, non fusionnée.
- Procédure sauvegarde/reprise 2026-09-13 et prompt nouveau chat/Codex présents dans le dépôt.

## Cause terrain mémorisée
Si un appareil affiche l'ancienne interface alors que le root distant est qualifié Master Cockpit, vérifier d'abord service worker/cache PWA avant de conclure à une régression du source. R2 utilise `skipWaiting`, `clients.claim`, purge des caches anciens, navigation network-first/reload et start_url versionnée.

## Vérité produit
Le Master Cockpit expose les domaines validés et leur statut réel. Ne jamais dire qu'une capacité est finalisée uniquement parce qu'elle est dans les 139 capacités ou possède un workspace. Distinguer moteur spécialisé actif, `STRUCTURAL_V1`, domaine planifié et option future.

## Reprise développement
Continuer à transformer les capacités structurelles prioritaires en moteurs réels sans dupliquer les autorités canoniques. Priorités : Discovery bidirectionnel complet/Membership, prêts-épargne-solidarité avancés, gouvernance documentaire, communauté/marketplace/partenaires/achats groupés, AdManager, Academy/ONG/Paper Bridge, auth/session/MFA, tests multi-tenant hostiles, PRA D1, Android ancien/faible débit/offline et pilote contrôlé.

## Interdictions
- ne pas recréer `eco-system-db` ;
- ne pas redemander les Secrets acquis ;
- ne pas force-push/fusionner `main` sans décision explicite ;
- ne pas activer l'argent réel ;
- ne pas introduire de migration destructive ;
- ne pas hard-coder une pratique locale comme règle universelle ;
- ne pas masquer le statut réel d'une capacité ;
- ne pas supprimer les checkpoints historiques.
