# CIR — 2026-10-03 — Push événementiel sans polling D1

## Fichiers métier
- apps/web/src/identity-live-ui.js
- apps/web/src/main.js
- packages/application/src/index.ts
- workers/api/src/group-live-hub.ts
- workers/api/src/index.ts

## Effets
- Live réactivé sur le palier gratuit sans lecture D1 périodique.
- Signaux de présence financière envoyés sur le WebSocket existant.
- TYPING/FOCUS/BLUR ne sont pas persistés.
- Seul l'état réel de brouillon est conservé brièvement dans le Durable Object.
- Reconnexion par séquence, sans boucle REST.
- Une validation D1 réussie pousse immédiatement sa nouvelle valeur aux autres clients.
- L'auteur conserve la valeur confirmée côté client ; aucun snapshot automatique ne peut la ramener à l'ancienne valeur.
- Les retries automatiques Outbox sont désactivés en mode gratuit.
- Les acquis dette/épargne/rubriques/offline du 02/10 restent inchangés.

## Non-régressions obligatoires
- ✓ et Entrée ;
- remplacement exact ;
- conservation de la position dans le tableau ;
- Ledger canonique ;
- Remboursements officiel ;
- dettes avec intérêts/prochaine échéance ;
- tableaux Épargne/Intérêts ;
- récapitulatif membre × séance de chaque rubrique ;
- politiques de rubriques et objets Completion modifiables offline via Outbox.

## Limite volontaire
Le lot n'effectue aucune mutation Cloudflare de production pendant l'épuisement du quota D1.
