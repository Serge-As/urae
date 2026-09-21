# Eco-System — Reconciliation report 1.4.6 vs offline/Relay 1.4.5

Date: 2026-09-21

## Why this file exists

A field regression exposed a branch-lineage problem: work done on `fix/1.4.5-true-offline-20260921` was not automatically part of the later 1.4.6 release because 1.4.6 continued from `next/1.4.5-live-multi-manager-consensus-20260921`.

This report is a release blocker against blind merges/cherry-picks.

## Proven divergence

Relative to the common live-consensus base:
- offline/Relay branch: about 30 commits ahead;
- 1.4.6 release branch: about 18 commits ahead.

Important offline-branch files absent from the original 1.4.6 line included:
- `apps/web/src/eco-relay-ui.js`;
- Return/navigation changes in `apps/web/src/main.js`, `apps/web/index.html`, `apps/web/styles.css`;
- manifest/iOS additions;
- relay package changes;
- true-offline tests;
- Eco Relay QR/iOS tests;
- mass-distribution documentation/manual.

## Already restored in 1.4.6.1 hotfix

- minimal independent authentication bootstrap;
- explicit login progress/error path;
- PWA auth-recovery cache refresh;
- primary-navigation regression tests;
- visible `← Retour` button;
- safe internal navigation stack restoring view, scroll, active group, Sessions tab and useful focus;
- browser popstate integration.

These are hotfix changes, not proof of field acceptance.

## Not yet to be declared present in production

- Eco Relay UI;
- true autonomous offline Local Data Engine;
- real QR encoder/decoder field-qualified;
- Eco Local Room;
- RELAY_HOST fan-out;
- cumulative exercise sheet requested after the original 1.4.6 line;
- automatic Wi-Fi Direct/native proximity;
- mass member distribution.

## Mandatory porting method

For every missing capability:
1. Memory Recall / source review.
2. Characterize 1.4.6 current stable behavior.
3. Identify canonical owner.
4. Compare exact branch diff.
5. Port the smallest coherent change.
6. Keep all historical tests.
7. Add a field-regression test.
8. Full CI.
9. No production promotion before BIR+ and real smoke.
10. Founder field acceptance remains separate.

Never merge the whole offline branch simply because it contains desired work.
