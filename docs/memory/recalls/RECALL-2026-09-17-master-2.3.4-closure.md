# MEMORY RECALL — MASTER 2.3.4 CLOSURE

Date: 2026-09-17
Branch: `next/1.4.0-master-2.3.4-closure-20260917`
Parent production checkpoint: `1817ad7d3c7dd8e2497244a6735e712a3a414253` (Eco-System 1.3.4)

## Objective

Close the gap between the product actually exposed by Eco-System and the full constitutional business baseline 2.3.4. The founder explicitly rejected the prior claim that the application was complete and requested a renewed confrontation of all previously supplied material with the deployed application.

## Authorities reread before code

1. `AGENTS.md` and current project truth files.
2. `ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.4_2026-09-05.md` from the founder's preserved File Library.
3. `FEATURE_REGISTRY.yaml`.
4. `packages/module-registry/src/index.ts` and `service-capabilities.ts`.
5. Current web shell and specialized UI modules.
6. Current API/application/domain packages and tests.
7. 3.0.0/3.1.0/3.2.0 documents only as additive later decisions; they do not erase an unimplemented 2.3.4 requirement.

## Recovered constitutional invariants

- Two fundamental group families only: rotating tontine and association.
- A rotating tontine supports multiple shares/names, multiple cycles, configurable beneficiaries, entrants in course with explicit jurisprudence, and money or in-kind operation.
- An association may contain zero, one or many rotating tontines and independent rubrics such as Collation, Secours, savings, school savings, loans, assistance, projects, charges and receipts.
- Rotating tontine -> association is an evolution of the same group identity, not a destructive recreation.
- Group creation is a ten-step cockpit, not a small form. It covers origin, family, governance, exercise/sessions, members, rotating/association rubric configuration, feasibility, communication, accessibility and complete preview.
- Membership lifecycle includes old/new members, invitations, import/history/seniority, waitlist, trial, suspension, reintegration, roles, multiple shares and rubric-specific participation.
- A rubric is a governed operating object with amount policy, frequency, obligation, member/share scope, deadline, payment method, penalty, interest, colour/order/cycle/state/visibility/calendar/ledger/carry-over semantics.
- Meeting Command Center must expose both mobile/card and matrix views over the same canonical business engine. A matrix cell creates a governed business intention; it is not a spreadsheet value detached from ledger/audit.
- Canonical ledger, idempotency, immutable evidence, tenant isolation, honest offline and UNKNOWN != SUCCEEDED are non-negotiable.
- Service Solidarity: each service has one named responsibility/owner, known dependencies, explicit forbidden responsibilities, failure behaviour and contract tests.
- PWA, low bandwidth/2G, FR/EN, seniors and low digital literacy are first-class product constraints.
- The historical Excel/VBA corpus is evidence of business semantics, not a mandate to reproduce Excel limitations.
- Features are not complete because their names appear in a catalogue. `VALIDATED`, `IMPLEMENTED`, `TESTED`, `DEPLOYED`, `PRODUCTION` remain distinct.

## Audit finding that triggered this closure

The 1.3.4 product contains substantial working engines, but the previous "Complete App" qualification was too weak as a completeness criterion. `tests/complete-app.test.mjs` verifies that more than 100 capability IDs exist, that the shell contains expected labels, and that the universal workspace persists a record. It does not prove that each capability is operational end-to-end.

At the same checkpoint, the module catalogue and Feature Registry still mark many Master 2.3.4 capabilities `STRUCTURAL_V1`, `PLANNED_DOMAIN` or otherwise incomplete. The public shell also retained stale 1.3.2/1.3.3/3.0.0 release labels despite a 1.3.4 deployment. Therefore the product may be deployed and test-green while still not being Master-complete.

## Acquired code that must not regress

The closure must preserve all 1.3.4 acquisitions: authenticated D1 flows; group creation and several independent tontines; canonical ledger and idempotency; meetings; member statements/control/reserves; savings-yield engines; loans and repayments; Secours and miscellaneous rubrics; two-sheet voice entry; member dossier; document ingestion; R2; forum/realtime; interest communities; group shop and market; AdManager/House Ads; Group Doctor; Meeting Autopilot; Founder Control; identity proof matching; Discovery/Membership foundations; PWA/offline; FR/EN; Premium Live; BIR+; `realMoneyEnabled=false`.

## Closure rule

No release may be labelled `MASTER_COMPLETE` while an in-scope Master 2.3.4 capability is only structural/planned or lacks the minimum contract appropriate to its risk. External-provider capabilities (real Mobile Money, SMS/WhatsApp/Telegram provider delivery, regulated wallet/escrow) must be labelled `EXTERNAL_GATED`, never faked as complete.

Implementation cycle for this branch:

`RECALL -> MAP OWNER/DEPENDENCIES -> CIR -> IMPLEMENT -> CONTRACT/REGRESSION TEST -> VERIFY -> UPDATE TRUTH -> DEPLOY WITH BIR+`.
