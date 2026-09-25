# CIR — Eco-System 1.0 Complete App

Date: 2026-09-10
Branch: `next/1.0.0-complete-app`
Target: `1.0.0-complete-app`

## Change intent
Replace the old Alpha-facing shell with the Complete App product line while preserving proven canonical services and the 0.6/0.5.1 recovery checkpoints.

## Founder doctrine carried forward
Eco-System must model how each group actually defines and operates each rubric. Written rules, observed practice, validated operational policy, exceptions, approval authority and evidence remain distinct layers. A practice from one group must never become a universal business prohibition unless it is a true security/privacy/accounting-integrity invariant.

## Product impact
- New Complete App mobile/PWA shell and product navigation.
- Product capability catalogue covering the A→J master-program domains.
- Living Rules, Discovery/Membership, Group Launch, Session, Finance and ecosystem entry points exposed from one coherent product surface.
- Universal persistent workspaces provide a usable governed dossier for capabilities that do not yet have a mature specialized engine.
- Specialized canonical engines remain authoritative where they already exist; the universal workspace does not replace Ledger, Membership, Rubrics, Identity, Trust or other canonical services.

## API impact
Adds non-destructive endpoints for:
- product capability catalogue;
- membership application flow;
- universal workspaces.

Existing API paths remain available unless explicitly superseded by an equivalent compatible path.

## Data impact
- Reuses existing `platform_records` persistence for workspace records.
- No destructive migration.
- Existing D1 database `eco-system-db` must be reused; deployment must fail rather than silently create a replacement database.
- `realMoneyEnabled=false` remains mandatory.

## UI/UX impact
- Old Alpha shell is superseded as the visible product experience.
- Mobile-first navigation exposes the major business domains instead of hiding them behind an Alpha demo.
- Every capability in the catalogue has a discoverable entry point and status; a catalogue entry is not by itself a claim that a dedicated pilot-grade engine exists.

## Non-regression controls
- Characterization and functional tests preserve canonical services.
- TypeScript strict, Architecture Fitness, Shared Governance, Constitution, Truth, Memory, Memory Index and Source Coverage gates remain mandatory.
- Root `/`, `/health` and `/api/v1/product/capabilities` are deployment smoke gates.
- Required catalogue capabilities must remain present and catalogue count must remain >=100.
- Cloudflare Worker must report version `1.0.0-complete-app` and `realMoneyEnabled=false`.

## Risks
1. Structural catalogue completeness may be mistaken for specialized-engine maturity.
   - Mitigation: expose capability/status/workspace type and never claim pilot-grade completion without evidence.
2. Universal workspaces could become a competing generic business engine.
   - Mitigation: they persist dossiers/work items only; canonical domain engines own authoritative transactions/state machines.
3. A product-shell rewrite could hide historical capabilities.
   - Mitigation: capability catalogue + restored master/memory/index + absence-from-UI-does-not-equal-deletion rule.
4. D1 replacement could fragment production data.
   - Mitigation: resolve the existing database by name and fail closed if not found.
5. New UI could regress older devices/offline behavior.
   - Mitigation: PWA build gate now; explicit field/device hardening remains before broader pilot.

## Rollback
- Product rollback target: branch `next/0.6.0-mobile-living-rules` and its verified Cloudflare deployment.
- Recovery fallback: `recovery/0.5.1-memory-discovery-rubric-trust` plus BIR+ artifacts.
- Rollback must not delete D1 data or apply destructive migrations.

## Acceptance criteria for this change
- full `npm run ci` green;
- source pushed to `next/1.0.0-complete-app`;
- Cloudflare deployment green against existing `eco-system-db`;
- `/` serves Complete App shell;
- `/health` reports 1.0 and real money disabled;
- capability endpoint reports >=100 and required A→J anchors;
- Complete App PR opened and left unmerged;
- BIR+ 1.0 source backup generated with SHA-256 and persisted outside the branch.
