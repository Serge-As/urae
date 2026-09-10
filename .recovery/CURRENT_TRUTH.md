# ECO-SYSTEM — CURRENT TRUTH

Date: 2026-09-10

## Runtime
- Product: `0.5.1-recovered-unified-alpha`
- Branch: `recovery/0.5.1-memory-discovery-rubric-trust`
- PR: #1 — open, not merged
- `main`: unchanged
- `realMoneyEnabled=false`: mandatory
- Hardened runtime archive SHA-256: `2d2fbeab6f34ef0b84d9c9278796259c0bfc4ebe5197e33deb2a687e16ce6a67`

## Focused hardening delivered
Only concrete business/UI/data-validation defects found in the executable runtime were corrected:
1. only the project creator can run its launch simulation;
2. unknown group/business enum values are rejected instead of being persisted;
3. cash contributions cannot be attached to a closed meeting;
4. meeting close is idempotent and rejects non-open states;
5. XAF physical cashbox values must be finite, non-negative integers;
6. critical web form fields are required and invalid actions are disabled;
7. editing a project after simulation invalidates the stale simulation before group creation.

No broad rewrite or parallel business engine was introduced.

## Qualification
Focused-patch qualification:
- TypeScript strict: PASS
- Architecture Fitness: PASS
- Shared Governance: PASS — 23 guardrails
- Service Solidarity: PASS — 11 canonical service cards
- Functional suite: 41/41 PASS

Recovery CI:
- run: `34421666078`
- result: SUCCESS
- qualified workflow-contract head: `fa39a266801196c7120c7adf4e99d5b775a97232`

## Cloudflare / D1 / Worker
Deployment run: `34421717265` — SUCCESS
Deployment head: `3898c056180d57f2868b81f594243bbdb723fe40`

D1:
- database: `eco-system-db`
- resolved remotely: PASS
- migration `0001_initial.sql`: PASS
- migration `0002_functional_local_ledger.sql`: PASS
- migration `0003_platform_records.sql`: PASS

Worker:
- name: `eco-system`
- endpoint: `https://eco-system.sergemimf.workers.dev`
- deployed: PASS
- D1 binding `env.DB (eco-system-db)`: PASS
- Cloudflare Worker version ID from deployment: `3a6c650e-f309-4951-bdcb-514c114c8866`

Health:
- endpoint: `https://eco-system.sergemimf.workers.dev/health`
- smoke test: PASS
- version asserted: `0.5.1-recovered-unified-alpha`
- `realMoneyEnabled=false`: asserted PASS

## Remaining weaknesses — not hidden, not broadened into this patch
Before a wider public/financial pilot, still harden:
- production-grade authentication/session lifecycle and sensitive-role MFA;
- hostile multi-tenant authorization tests;
- D1 backup/restore/PRA drill;
- field tests on old Android / unstable 2G-3G / long offline periods;
- observability and security alerting.

These are next hardening work, not regressions in the focused patch.

## Exact next product point
Cloudflare launch gate is now ACQUIRED.
Resume product development from Discovery / Identity / Membership, preserving canonical ownership and the mutual person↔group discovery model.

Do not merge PR #1 or activate real money without a separate explicit decision.
