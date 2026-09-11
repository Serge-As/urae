# PROMPT DE REPRISE — ECO-SYSTEM CAHIER APP 1.1 — NOUVEAU CHAT / CODEX

Tu reprends le projet réel **Eco-System**. Ne recommence jamais depuis zéro.

## 1. Ordre obligatoire
`READ TRUTH → VERIFY GIT → VERIFY CI → VERIFY REMOTE IF RELEVANT → RECALL → REPRODUCE → CHANGE`.

Lis avant toute mutation :
- `AGENTS.md` ;
- `docs/memory/CURRENT_TRUTH.md` ;
- `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
- `PROJECT_STATE.md` ;
- `NEXT_RUN.md` ;
- `FEATURE_REGISTRY.yaml` ;
- `docs/constitution/ECO_SYSTEM_MASTER_SOURCES_MANIFEST_1.0.0.json` ;
- `docs/constitution/ECO_SYSTEM_CAHIER_APP_EXECUTION_SUPPLEMENT_1.1.0_2026-09-11.md` ;
- `docs/governance/ECO_SYSTEM_PROCEDURE_OBLIGATOIRE_SAUVEGARDE_REPRISE_1.0.0.md` ;
- le dernier Recall/CIR pertinent.

## 2. Point de reprise
- ligne : `1.1.0-cahier-app` ;
- branche : `next/1.1.0-cahier-app` ;
- Cahier Maître autoritaire : **2.3.4** ;
- URL : `https://eco-system.sergemimf.workers.dev/` ;
- Worker : `eco-system` ;
- D1 : **exclusivement `eco-system-db`** ;
- `realMoneyEnabled=false`.

Vérifie dans CURRENT_TRUTH les derniers HEAD, PR, CI, run Cloudflare, Worker Version ID et BIR+ avant d'agir : ce fichier prime sur les numéros éventuellement vieillissants d'un prompt.

## 3. Doctrine
« Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »
Distinguer règle écrite, pratique observée, règle opérationnelle validée, exceptions, autorités, preuves et régularisation. Ne jamais transformer la pratique d'un groupe en interdiction universelle sauf invariant réel de sécurité/intégrité.

## 4. Architecture
Une activité métier = une autorité canonique. UI, Ultra Simple, Oral, IA, API et Offline utilisent les mêmes services. Les capacités sans moteur final restent actionnables via Workspace D1 avec statut réel ; le Workspace ne remplace jamais Ledger, Membership, auth ou paiement.

## 5. Interdictions
- ne pas recréer `eco-system-db` ni les Secrets acquis ;
- pas de migration destructive ;
- pas de PII/secrets bruts ;
- pas de real money ;
- pas de force-push ni merge de `main` sans autorisation explicite ;
- pas de fausse complétude ;
- pas de régression silencieuse ni disparition d'une capacité du Cahier.

## 6. Méthode
Pour chaque chantier substantiel : Memory Recall → CIR → code → tests → CI → déploiement vérifié si autorisé → Truth Ledger/Current Truth/Project State/NEXT_RUN → BIR+ vérifié.

Commence par vérifier l'état réel, puis continue les capacités encore `STRUCTURAL_V1`/hardening vers des moteurs métier spécialisés en conservant l'interface Cahier App, Living Rules, offline, old-device, FR/EN et isolation multi-tenant.
