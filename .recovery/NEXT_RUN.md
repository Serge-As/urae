# ECO-SYSTEM — NEXT RUN

Date: 2026-09-10

Read `.recovery/CURRENT_TRUTH.md` first.

## Acquired — do not redo
- Recovery v2 segmented transport and cryptographic reconstruction.
- Account-owned Cloudflare API Token verified active.
- Recovery CI green on hardened runtime.
- `eco-system-db` resolved and all additive migrations applied remotely.
- Worker `eco-system` deployed.
- `/health` smoke PASS with `realMoneyEnabled=false`.
- Focused business/UI/data-validation hardening: 41/41 PASS.

## Exact next product sequence
1. Resume Discovery / Identity / Membership from the existing canonical services — no parallel engine.
2. Complete mutual person→group and opt-in group→candidate discovery, governed invitations, recruitment campaigns, saved searches/alerts, candidate questions/portfolio/referrals and anti-enumeration.
3. Keep Membership as the sole authority that creates canonical membership.
4. Add production-grade authentication/session hardening before broader pilot exposure.
5. Qualify multi-tenant authorization negatively and perform D1 backup/restore drill.
6. Field-test PWA/offline behaviour on old Android and unstable low-bandwidth networks.
7. Only after those gates: broader pilot, still with `realMoneyEnabled=false` unless separately authorized.

## Do not
- force-push or rewrite `main`;
- merge PR #1 without explicit decision;
- enable real money;
- publish private founder archives/PII;
- introduce destructive D1 migration;
- recreate already-acquired Cloudflare resources or secrets.
