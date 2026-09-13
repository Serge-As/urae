# Memory Recall — authentification session isolation tenant comptabilite atomicite cahier-app

Date: 2026-09-12
Terms élargis: atomicite, authentification, cahier-app, comptabilite, isolation, session, tenant

## Sources les plus pertinentes
- **docs/memory/MASTER_CAPABILITY_INDEX.json** — score 30; concepts: authentification, session, isolation, tenant
  - 80: "summary": "Séparer fonds logique et contenant financier",
  - 98: "summary": "Rapprochement multi-contenants",
  - 140: "summary": "IA de service groupe isolée par tenant",
  - 800: "summary": "Session absente/expirée",
  - 810: "id": "TENANT_MISMATCH",
- **FEATURE_REGISTRY.yaml** — score 13; concepts: session, isolation, tenant
  - 145: tests: [group-project-flow,tenant-isolation]
  - 152: tests: [group-project-flow,tenant-isolation]
  - 236: tests: [concurrent-tenant-request-isolation]
  - 252: - id: MEETING.SESSION.PERSISTENT
  - 477: - id: MEETING.IN_SESSION_DECISION
- **docs/memory/SOURCE_DEEP_DIGEST_2.3.3.json** — score 6; concepts: session, tenant
  - 30: "MEETING.SESSION.START",
  - 178: "Valeurs saisies séance tenante",
  - 185: "MEETING.SESSION.START",
  - 218: "REPORTING.AS_OF_SESSION"
  - 329: "Situation à date/session",
- **NEXT_RUN.md** — score 4; concepts: session, isolation, tenant
  - 25: 3. préserver Living Rules, Ledger/Membership canoniques, offline/outbox et isolation multi-tenant ;
  - 28: 6. avant tout pilote financier élargi : auth/session robuste, MFA rôles sensibles, tests multi-tenant hostiles, observabilité, PRA/restore D1 et pilote contrôlé.
- **docs/memory/PROJECT_TRUTH_LEDGER.json** — score 3; concepts: session, tenant
  - 25: "Update this ledger whenever a remote verification, deployment, abandonment or supersession changes project truth."
  - 278: "tests:cross-tenant application approval"
  - 280: "note": "Cross-tenant application and canonical membership approval path locally verified.",
- **docs/change-impact/CIR-2026-09-10-complete-app-1.0.md** — score 1; concepts: session
  - 16: - Living Rules, Discovery/Membership, Group Launch, Session, Finance and ecosystem entry points exposed from one coherent product surface.
- **docs/constitution/ECO_SYSTEM_COMPLETE_APP_EXECUTION_SUPPLEMENT_1.0.0_2026-09-10.md** — score 1; concepts: session
  - 8: A Cloud/D1 ; B Identity/Discovery/Membership ; C Group Launch/Rubrics ; D Session Command Center ;

## Gate
Ce rapport est un index de rappel, pas une décision métier. Toute contradiction doit être rapprochée avec la Constitution, l'état réel du code, les CIR/ADR et les tests avant implémentation.
