# ECO-SYSTEM — CURRENT TRUTH

Date: 2026-09-10

## Runtime
- Product: `0.5.1-recovered-unified-alpha`
- Branch: `recovery/0.5.1-memory-discovery-rubric-trust`
- PR: #1 — open, not merged
- `main`: unchanged
- `realMoneyEnabled=false`: mandatory
- Hardened runtime archive SHA-256: `2d2fbeab6f34ef0b84d9c9278796259c0bfc4ebe5197e33deb2a687e16ce6a67`

## Focused hardening delivered — implementation currently deployed
The executable runtime currently contains these safeguards:
1. only the project creator can run its launch simulation;
2. unknown group/business enum values are rejected instead of being persisted;
3. cash contributions cannot currently be attached to a closed meeting;
4. meeting close is idempotent and rejects non-open states;
5. XAF physical cashbox values must be finite, non-negative integers;
6. critical web form fields are required and invalid actions are disabled;
7. editing a project after simulation invalidates the stale simulation before group creation.

These points describe the deployed implementation; they are not all universal business doctrine.

## Founder clarification — governed flexibility is now canonical product doctrine
The founder clarified on 2026-09-10 that Eco-System must not turn one group's practice into a universal prohibition. The detailed decision is recorded in `.recovery/DOMAIN_POLICY_FLEXIBILITY_2026-09-10.md`.

Canonical interpretation from now on:
- strict universal prohibitions are reserved for real integrity/security/privacy/accounting invariants;
- group business rules are composable and may define exceptions, authorized roles, quorum/approvals, time windows, reasons, evidence, notifications, appeals and regularization paths;
- a sensitive denial should normally offer a governed request/exception/regularization path rather than a dead end when technically and legally possible;
- « creator only can simulate » is too narrow as a universal rule: target rule is capability-based authorization; simulation, edit, approval and conversion are separate capabilities and may be delegated;
- idempotent close means duplicate/retried close requests do not create duplicate effects; it does NOT mean irreversible close;
- a closed meeting is a versioned checkpoint. Where group policy permits, late contributions/corrections may be recorded after close with configured authority and audit, e.g. `Close V1 -> governed late adjustment -> Close V2`;
- non-negative integer XAF remains an invariant only for a physical cash-count field. A business shortfall/debt may still be represented as `-2 000`, while a separate `+2 000` solidarity funding flow can cover it;
- expected, actually collected, solidarity-covered, disbursed and member-debt amounts must remain distinct and explainable;
- fixed-target mandatory rubrics may guarantee full payout through solidarity if the group's own rules provide it; other groups may pay only collected amounts, partially cover, sanction, waive or combine policies;
- RI/statuts/PV/other group texts may feed policy suggestions, but AI extraction must remain reviewable and may not silently activate a sensitive rule.

The currently deployed creator-only simulation and closed-meeting contribution block are therefore PROVISIONAL SAFETY RESTRICTIONS TO REFINE, not final business rules.

No broad rewrite or parallel business engine should be introduced to implement this refinement; use the canonical policy/capability services.

## Qualification
Focused-patch qualification before this doctrine clarification:
- TypeScript strict: PASS
- Architecture Fitness: PASS
- Shared Governance: PASS — 23 guardrails
- Service Solidarity: PASS — 11 canonical service cards
- Functional suite: 41/41 PASS

Final previously qualified Recovery CI:
- run: `34421974327`
- result: SUCCESS

Fresh Cloudflare token diagnostic after founder request:
- run: `34426666080`
- result: SUCCESS
- credential format: account-owned token
- Cloudflare verification result: valid and active

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
- smoke test at deployment: PASS
- version asserted: `0.5.1-recovered-unified-alpha`
- `realMoneyEnabled=false`: asserted PASS

## Remaining weaknesses / next refinement
Before wider pilot or further hardening:
- refine creator-only project simulation into capability/delegation authorization;
- refine closed-meeting block into configurable governed post-close adjustment workflow;
- model mandatory-rubric shortfall, solidarity funding, member debt and fixed beneficiary payout as distinct canonical flows;
- keep physical cash-count validation separate from business debt/shortfall semantics;
- production-grade authentication/session lifecycle and sensitive-role MFA;
- hostile multi-tenant authorization tests;
- D1 backup/restore/PRA drill;
- field tests on old Android / unstable 2G-3G / long offline periods;
- observability and security alerting.

## Exact next product point
Do not blindly continue feature expansion before incorporating the founder's governed-flexibility doctrine into the canonical rule/capability model. Then resume Discovery / Identity / Membership without creating parallel engines.

Do not merge PR #1 or activate real money without a separate explicit decision.
