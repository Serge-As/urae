# CIR — 2026-10-02 — Conservation gratuite / dette offline

## Fichiers concernés
- packages/application/src/index.ts
- apps/web/src/main.js
- apps/web/src/identity-live-ui.js
- workers/api/src/index.ts
- tests/free-conservation-live-2026-10-02.test.mjs
- tests/debt-workbook-rubric-recap-2026-10-02.test.mjs

## Impacts métier
1. Un 429 ouvre le circuit jusqu'au prochain reset UTC (+5 min) ; 503/504 ouvrent un délai court.
2. Les GET utilisent la dernière projection IndexedDB au lieu de répéter les lectures D1.
3. Les mutations financières passent en Outbox lorsque le budget serveur est bloqué.
4. Actualiser force explicitement une nouvelle tentative.
5. Le rôle gestionnaire utilise aussi la dernière vérité `groupMe` connue.
6. Remboursements est une rubrique officielle distincte des intérêts.
7. Les anciennes lignes Prêt/Emprunt peuvent reconstruire une dette locale.
8. NEXT_SESSION_DUE est rendu visible dans la dette même en mode dégradé.
9. Live automatique est gelé sur le palier gratuit mais son code n'est pas supprimé.

## Non-régressions attendues
- montant + ✓ + Entrée ;
- remplacement exact, jamais addition implicite ;
- Ledger canonique ;
- offline souverain et Outbox ;
- rubriques personnalisées existantes ;
- tableaux Épargne/Intérêts et récap membres × séances.
