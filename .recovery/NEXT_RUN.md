# ECO-SYSTEM — NEXT RUN

Date: 2026-09-10

Read `.recovery/CURRENT_TRUTH.md`, `.recovery/DOMAIN_POLICY_FLEXIBILITY_2026-09-10.md` and `docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md` first.

## Acquired — do not redo
- Recovery v2 checkpoint remains preserved as rollback/provenance.
- Cloudflare Account API Token is valid and active.
- Normal readable source exists on `next/0.6.0-mobile-living-rules`.
- Mobile-first PWA is deployed at `https://eco-system.sergemimf.workers.dev/`.
- The old root `NOT_FOUND` is fixed.
- `eco-system-db` is resolved and bound to Worker `eco-system`.
- Additive D1 migrations are already applied.
- `/health` is green with version `0.6.0-mobile-living-rules` and `realMoneyEnabled=false`.
- Cloudflare run `34431427752`: SUCCESS.
- TypeScript / architecture / governance / service solidarity: PASS.
- Functional suite: 43/43 PASS.

## Immediate field-test sequence
1. Open the PWA directly on Android and install/add it to the home screen when offered.
2. Verify launch, refresh, reopen and basic offline shell behavior.
3. Use test identities and test financial values only.
4. Exercise the real vertical slice: project → simulation → group → members → meeting → contribution → close → governed late contribution → re-close/audit.
5. Exercise Living Rules: create a rubric and distinguish written rule, observed practice, validated operational rule, expected amount, collected amount, member shortfall/debt, solidarity coverage and beneficiary payout.
6. Report every mismatch as: screen/action → steps → expected behavior → actual behavior → group rule/practice that should govern it.

## Product sequence after first Android feedback
1. Complete the Living Rules configuration UX: per-rubric rules, mixed variants, authorized exceptions, approval/quorum, time windows, evidence, notifications, regularization and revision history.
2. Continue RI/statuts/PV assisted reading as reviewable suggestions only; no sensitive automatic activation.
3. Resume Discovery / Identity / Membership from existing canonical services — no parallel engine.
4. Complete mutual person→group and opt-in group→candidate discovery, invitations, recruitment campaigns, saved searches/alerts, candidate questions/portfolio/referrals and anti-enumeration.
5. Keep Membership as sole canonical authority for membership creation.
6. Add production-grade authentication/session hardening and MFA for sensitive roles before wider pilot exposure.
7. Run hostile multi-tenant authorization tests and D1 backup/restore/PRA drill.
8. Field-test old Android / unstable 2G-3G / long offline periods.
9. Only after those gates: controlled multi-group pilot and GO/NO-GO review.

## Permanent business doctrine
Do not program “how a collation works”. Program the means for a group to describe how its collation — or any rubric — works, compare that with what is actually practiced, and validate the operational rule that should govern the app.

Where a business action is blocked, expose an authorized request/exception/regularization path whenever possible. Keep true security/privacy/accounting invariants strict.

## Do not
- force-push or rewrite `main`;
- discard recovery backups;
- enable real money;
- publish private founder archives/PII;
- introduce destructive D1 migration;
- recreate already-acquired Cloudflare resources/secrets;
- turn one group's rule into a universal business prohibition;
- merge product branches without explicit separate authorization.
