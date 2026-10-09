# CIR — Expense recap observer feedback, 2026-10-09

The d9 targeted two-manager diagnostic passes with unchanged five-second convergence assertions. Its safe network trace also contains repeated raw expense GETs on both pages. This is a separate observed defect; the original e083 latency failure is retained and causality for that failure remains open.

Owner reuse: expense-recap-ui.ts continues reading the existing group expenses service. Only projection scheduling changes. MutationObserver delivery happens after a rendering stack has reset busy; an owned append was therefore interpreted as an external update. Filtering the two owned card markers and coalescing simultaneous schedules stops the feedback while real canonical/context mutations still refresh. No Ledger, D1, signed clock, Outbox or Live authority changes.

Changed surfaces: global expense recap and meeting expense detail. Three behavior regressions exercise the actual TypeScript component with asynchronous mutation delivery; a verifier contrasts immutable d9 source and current source without changing the checkout. Existing Chromium gains a two-page idle ledger/expense read assertion after author ACK; original deadlines and offline/transport cases remain. Diagnostic output stays selected-field synthetic metadata and is written to a shallow path by Node.

Verification so far: JavaScript model only, three old failures / three candidate passes; initial 20 reads -> one read in 2400ms and zero pending timer after correction. Real TypeScript/Node proof and 657/8/6 full gates are NOT EXECUTED. A targeted diagnostic pass does not qualify the fix.

Delivery HOLD, PR72 draft, FIELD_ACCEPTED=NOT_ACCEPTED, realMoneyEnabled=false. Rollback is the retained source and last attested 1.5.2.14 production; no database migration needed. Prior failures and inaccessible original Library artifacts remain limitations, never authorization to delete features.
