# ECO-SYSTEM — CURRENT TRUTH

Date: 2026-09-10

## Current product line
- Product: `0.6.0-mobile-living-rules`
- Branch: `next/0.6.0-mobile-living-rules`
- Recovery fallback: `0.5.1-recovered-unified-alpha` remains preserved on `recovery/0.5.1-memory-discovery-rubric-trust`.
- `main`: unchanged.
- `realMoneyEnabled=false`: mandatory.
- Mobile/PWA URL: `https://eco-system.sergemimf.workers.dev/`
- Health URL: `https://eco-system.sergemimf.workers.dev/health`

## Mobile launch — ACQUIRED
The previous `NOT_FOUND` at `/` is resolved. Eco-System now serves a real mobile-first PWA shell at the public root and keeps the API/health routes on the same Cloudflare Worker.

Cloudflare qualification:
- workflow: `Eco-System 0.6 Mobile Preview — Cloudflare`
- run: `34431427752`
- result: **SUCCESS**
- deployed source head: `123e2ec20b8194e1dec568a552130e32c93f6ea6`
- Worker: `eco-system`
- Worker version ID: `1c72a72a-e4aa-424c-b120-46fa4ad3eff2`
- D1: `eco-system-db`
- D1 migrations: additive; latest run reports no pending migration
- binding `env.DB`: PASS
- static PWA assets: PASS
- mobile root smoke: PASS
- `/health`: PASS
- health version: `0.6.0-mobile-living-rules`
- `realMoneyEnabled=false`: PASS

The static assets are served asset-first; only `/api/*` and `/health` run the Worker first. This avoids the previous JSON `NOT_FOUND` and HTML canonicalization redirect loop.

## Qualification
Latest deployed line:
- TypeScript strict: PASS
- Architecture Fitness: PASS
- Shared Governance: PASS — 23 guardrails
- Service Solidarity: PASS — 11 canonical service cards
- Functional suite: **43/43 PASS**
- PWA build: PASS
- D1 resolution: PASS
- Cloudflare deployment: PASS
- public root + health smoke: PASS

## Founder doctrine — Living Rules
Canonical instruction:

> « Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »

Eco-System must seek to understand how each association/tontine thinks and actually executes every rubric. Written rules, observed practice and validated operational policy are distinct, auditable layers. One group's rule must not silently become everybody's rule.

Consequences already represented in 0.6:
- universal prohibitions are reserved for true security/privacy/accounting/integrity invariants;
- project simulation is capability/delegation-governed rather than creator-only;
- meeting close is an idempotent, versioned checkpoint rather than an irreversible tombstone;
- governed late contributions can remain possible where group policy permits them;
- physical XAF cash count remains non-negative/integer, while business shortfall/debt is represented separately;
- expected amount, actual collection, member shortfall/debt, solidarity coverage and beneficiary disbursement are distinct flows;
- a fixed-target rubric can be fully funded by group solidarity when the group's validated rules require it;
- RI/statuts/PV may produce AI policy suggestions, but sensitive rules require authorized human confirmation before activation;
- denials should offer a governed authorization/exception/regularization path whenever technically and legally reasonable.

Detailed doctrine: `docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md` and `.recovery/DOMAIN_POLICY_FLEXIBILITY_2026-09-10.md`.

## Android preview safety
This is now suitable for direct Android/PWA functional testing, but not yet for a public financial production rollout.

For initial field tests:
- use test identities/groups and non-sensitive data;
- do not treat offline financial intent as final until server synchronization confirms it;
- do not enable real money;
- report differences between expected rule, observed practice and app behavior rather than forcing workarounds.

Android field-test guide: `docs/testing/ECO_SYSTEM_ANDROID_FIELD_TEST_0.6.0.md`.

## BIR+ backup — ACQUIRED
A reconstructible backup of the normal 0.6 source has been generated from exact Git HEAD `899ef4b842ad2f3e282a27938a9f3d8768e20200`.

- workflow: `Eco-System 0.6 — BIR+ Verified Source Backup`
- run: `34431702937`
- result: **SUCCESS**
- artifact: `eco-system-0.6-birplus-source`
- artifact ID: `10134711382`
- artifact ZIP digest: `sha256:bab4e7988a22322bc2e27d9a6d6c68d4035f96cf2b6f90e8a1e48c96cebba807`
- source archive SHA-256: `8bd64c3398e6e5a88c4274331a736dd8d20b0783341b314a0f374d8ab6738e81`
- retention configured: 30 days

The older 0.5.1 recovery artifact remains an independent fallback and must not be deleted merely because 0.6 is now the active preview line.

## Remaining high-priority work
1. Android field test of the 0.6 PWA on real devices and unstable networks.
2. Complete Living Rules UI/configuration so authorized managers can describe, validate and evolve per-rubric policies without code changes.
3. Resume Discovery / Identity / Membership from canonical services: mutual person→group and opt-in group→candidate discovery, invitations, recruitment campaigns, saved searches/alerts, questions/portfolio/referrals, anti-enumeration.
4. Production-grade authentication/session lifecycle and sensitive-role MFA before wider pilot exposure.
5. Hostile multi-tenant authorization testing.
6. D1 backup/restore/PRA drill.
7. Observability/security alerting.
8. Pilot with a small controlled set of groups before any production GO/NO-GO decision.

## Do not
- force-push or rewrite `main`;
- discard the 0.5.1 recovery checkpoint;
- activate real money;
- introduce destructive D1 migrations;
- publish private founder archives/PII;
- hard-code one group's custom practice as a universal rule;
- merge product branches without a separate explicit decision.
