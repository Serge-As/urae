# Memory Recall — livrer l'application Eco-System selon le Cahier Maître 2.3.4, rendre visibles et cohérents les lots B à J, cockpit groupe, réunion, finance, communauté, marché, AdManager, Academy, IA, Paper Bridge, rapports, sécurité et offline

Date: 2026-09-11
Terms élargis: academy, admanager, application, bridge, cahier, cockpit, coherents, communaute, eco-system, finance, groupe, les, livrer, lots, maitre, marche, offline, paper, rapports, rendre, reunion, securite, selon, visibles

## Sources les plus pertinentes
- **docs/memory/MASTER_CAPABILITY_INDEX.json** — score 108; concepts: livrer, application, selon, cahier, maitre, les, cockpit, groupe, reunion, finance, marche, admanager, academy, paper, bridge, securite, offline
  - 5: "path": "docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.4_2026-09-05.md",
  - 8: "rules": {
  - 86: "summary": "Registre banque/microfinance/caisse/MoMo",
  - 140: "summary": "IA de service groupe isolée par tenant",
  - 164: "summary": "Financement de documents/formations par ONG",
- **FEATURE_REGISTRY.yaml** — score 32; concepts: application, les, paper, offline
  - 10: offline_policy: local_context_allowed_server_reauthorizes
  - 17: offline_policy: client_advisory_server_authoritative
  - 24: offline_policy: transition_preparation_only_when_server_required
  - 31: offline_policy: cache_and_local_completion_intent
  - 38: offline_policy: durable_outbox_for_remote_delivery
- **docs/memory/PROJECT_TRUTH_LEDGER.json** — score 29; concepts: application, eco-system, cahier, maitre, les
  - 18: "rules": [
  - 34: "repo:docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.3_2026-09-05.md",
  - 38: "note": "2.3.3 preserves 2.3.2 content, adds deep forensic source semantics and anti-regression truth rules; qualified by local CI.",
  - 61: "note": "Previous chat described 0.5 work, but no persisted 0.5 source was recovered from bundle/archives/GitHub. Treat described features as requirements/memory unless current code/tests prove them.",
  - 104: "github-ref:release/0.5.0-eco-system-unified@3664e4fa4d0c01cfd52590df2b095ce82f96691d"
- **docs/memory/SOURCE_DEEP_DIGEST_2.3.3.json** — score 27; concepts: selon, les, cockpit, groupe, rapports
  - 22: "Cockpit opérateur",
  - 33: "HOME.COCKPIT"
  - 36: "Contient des données personnelles historiques : ne pas republier",
  - 37: "Références externes cassées = artefacts forensic, pas règles métier"
  - 61: "Vue historique, pas modèle de tables canonique"
- **docs/memory/CURRENT_TRUTH.md** — score 24; concepts: eco-system, les, groupe, reunion, offline
  - 1: # ECO-SYSTEM — CURRENT TRUTH
  - 8: - URL PWA unique : `https://eco-system.sergemimf.workers.dev/`
  - 9: - Worker : `eco-system`
  - 10: - D1 : exclusivement `eco-system-db`
  - 17: - Commit produit matérialisé : `7e08a76` (`feat: materialize Eco-System 1.0 Complete App`)
- **PROJECT_STATE.md** — score 24; concepts: eco-system, les, groupe, reunion, offline
  - 1: # ECO-SYSTEM — PROJECT STATE
  - 8: - URL PWA unique : `https://eco-system.sergemimf.workers.dev/`
  - 9: - Worker : `eco-system`
  - 10: - D1 : exclusivement `eco-system-db`
  - 17: - Commit produit matérialisé : `7e08a76` (`feat: materialize Eco-System 1.0 Complete App`)
- **NEXT_RUN.md** — score 19; concepts: eco-system, cahier, maitre, les, groupe, offline
  - 1: # ECO-SYSTEM — NEXT RUN
  - 5: Lire d'abord `AGENTS.md`, `docs/memory/CURRENT_TRUTH.md`, `docs/memory/PROJECT_TRUTH_LEDGER.json`, le Cahier Maître, `FEATURE_REGISTRY.yaml` et les Recall/CIR.
  - 11: - Worker `eco-system` déployé.
  - 12: - D1 `eco-system-db` réutilisée, aucune nouvelle base.
  - 20: `https://eco-system.sergemimf.workers.dev/`
- **docs/constitution/ECO_SYSTEM_COMPLETE_APP_EXECUTION_SUPPLEMENT_1.0.0_2026-09-10.md** — score 14; concepts: eco-system, maitre, les, lots, groupe, communaute, admanager, academy, paper, securite
  - 1: # ECO-SYSTEM — SUPPLÉMENT D'EXÉCUTION COMPLETE APP 1.0.0
  - 6: ## Prompt Maître appliqué
  - 7: Exécuter les lots A→J sans démo jetable :
  - 9: E Ledger/prêts/solidarité ; F communauté/économie ; G AdManager ; H Academy/ONG/IA/Safety/Paper ;
  - 13: Toute capacité connue a une place visible et un statut réel. Les capacités dotées d'un moteur spécialisé l'utilisent.
- **docs/change-impact/CIR-2026-09-10-complete-app-1.0.md** — score 12; concepts: application, eco-system, les, finance, offline
  - 1: # CIR — Eco-System 1.0 Complete App
  - 11: Eco-System must model how each group actually defines and operates each rubric. Written rules, observed practice, validated operational policy, exceptions, approval authority and evidence remain distinct layers. A practice from one group must never become a un
  - 16: - Living Rules, Discovery/Membership, Group Launch, Session, Finance and ecosystem entry points exposed from one coherent product surface.
  - 23: - membership application flow;
  - 26: Existing API paths remain available unless explicitly superseded by an equivalent compatible path.
- **AGENTS.md** — score 9; concepts: eco-system, cahier, rendre, les, groupe, securite
  - 1: # AGENTS.md — Eco-System Complete App
  - 4: Continuer le produit réel Eco-System sans recommencer depuis zéro. La ligne produit active est `1.0.0-complete-app`. L’ancienne 0.5/0.6 reste fallback historique, pas cible UI.
  - 13: 6. `docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md` ;
  - 22: - Métier : Cahiers Eco-System 2.3.x fingerprintés + décisions ultérieures versionnées + supplément Complete App.
  - 28: > « Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »
- **docs/memory/SOURCE_TO_CAPABILITY_COVERAGE_2.3.3.json** — score 8; concepts: cahier, maitre, les, rapports, offline
  - 4: "master": "docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.4_2026-09-05.md",
  - 5: "rule": "Normal product work uses Master 2.3.4 + later versioned decisions. Raw founder files remain private evidence only.",
  - 23: "name": "Serge Cahier des charges 2025.docx",
  - 25: "coverage": "FULL_TEXT_EXTRACTED_AND_MODULES_RECONCILED"
  - 100: "name": "Rapports.docx",
- **docs/constitution/ECO_SYSTEM_MASTER_SOURCES_MANIFEST_1.0.0.json** — score 6; concepts: cahier, maitre
  - 9: "filename": "ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.2_2026-09-05.md",
  - 16: "filename": "ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.3_2026-09-05.md",
  - 23: "filename": "ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.4_2026-09-05.md",
- **docs/engineering/ECO_SYSTEM_Playbook_Developpement_Memoire_GardeFous_2.3.4.md** — score 4; concepts: eco-system, les
  - 1: # ECO-SYSTEM — PLAYBOOK DÉVELOPPEMENT / MÉMOIRE / GARDE-FOUS 2.3.4
  - 5: Règles obligatoires :
  - 12: 7. Les erreurs sensibles proposent autorisation, recours ou régularisation quand l'intégrité le permet.

## Gate
Ce rapport est un index de rappel, pas une décision métier. Toute contradiction doit être rapprochée avec la Constitution, l'état réel du code, les CIR/ADR et les tests avant implémentation.
