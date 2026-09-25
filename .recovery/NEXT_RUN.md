# ECO-SYSTEM — NEXT RUN

Date: 2026-09-10

Read `.recovery/CURRENT_TRUTH.md` and `.recovery/DOMAIN_POLICY_FLEXIBILITY_2026-09-10.md` first.

## Acquired — do not redo
- Recovery v2 segmented transport and cryptographic reconstruction.
- Account-owned Cloudflare API Token freshly re-verified active on run `34426666080`.
- Recovery CI green on hardened runtime.
- `eco-system-db` resolved and all additive migrations applied remotely.
- Worker `eco-system` deployed.
- `/health` smoke PASS with `realMoneyEnabled=false` at deployment.
- Focused business/UI/data-validation hardening: 41/41 PASS.

## Mandatory doctrine refinement before more rigid business rules
The 2026-09-10 founder clarification supersedes any interpretation that creator-only simulation or post-close contribution blocking are universal business rules.

Implement through canonical capabilities/policies, not case-specific parallel engines:
1. replace creator-only simulation with capability-based authorization/delegation, separating simulate / edit / approve / convert;
2. treat meeting close as a versioned checkpoint, preserving idempotency but permitting governed late adjustments when group policy allows;
3. model mandatory-rubric expected amount, actual member collection, member shortfall/debt, solidarity funding and beneficiary disbursement as distinct flows;
4. keep physical XAF cash-count validation non-negative/integer while allowing negative business shorthand for debt/shortfall in the UI/model where appropriate;
5. allow fixed-target guaranteed payouts, collected-only payouts, partial solidarity, sanctions, waivers and mixed policies according to each group's validated rules;
6. extract candidate rules from RI/statuts/PV with source references, but require authorized human confirmation before sensitive activation;
7. when a sensitive action is denied, provide a governed authorization/exception/regularization path whenever possible instead of a dead end.

## Product sequence after this refinement
- Resume Discovery / Identity / Membership from existing canonical services — no parallel engine.
- Complete mutual person→group and opt-in group→candidate discovery, governed invitations, recruitment campaigns, saved searches/alerts, candidate questions/portfolio/referrals and anti-enumeration.
- Keep Membership as the sole authority that creates canonical membership.
- Add production-grade authentication/session hardening before broader pilot exposure.
- Qualify multi-tenant authorization negatively and perform D1 backup/restore drill.
- Field-test PWA/offline behaviour on old Android and unstable low-bandwidth networks.
- Only after those gates: broader pilot, still with `realMoneyEnabled=false` unless separately authorized.

## Do not
- force-push or rewrite `main`;
- merge PR #1 without explicit decision;
- enable real money;
- publish private founder archives/PII;
- introduce destructive D1 migration;
- recreate already-acquired Cloudflare resources or secrets;
- hard-code one group's RI/practice as a universal rule.
