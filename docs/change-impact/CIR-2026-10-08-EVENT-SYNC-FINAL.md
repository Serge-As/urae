# CIR — Eco 1.5.2.12 · Event Sync final

Date : 2026-10-08  
Risque : financier / offline / temps réel / UX de saisie  
Migration D1 : aucune

## Changement

1. `apps/web/src/main.js`
   - remplace la mini-boucle de reprises financières par une seule reprise Outbox ciblée à 850 ms ;
   - après cet essai, attend un événement réel au lieu d’un timer réseau ;
   - applique les événements Live provenant d’un autre appareil du même acteur ;
   - conserve la protection des intentions locales divergentes ;
   - affiche explicitement l’état du canal Live ;
   - rend le bouton Actualiser contextuel : seules les données utiles à la vue active sont rechargées.

2. `tests/browser/financial-cell-consensus-persistence-1.5.2.6.spec.mjs`
   - ajoute un second contexte navigateur utilisant le même compte ;
   - exige la convergence du remboursement 2 500 F en moins de cinq secondes ;
   - vérifie zéro polling snapshot/live-events pendant la fenêtre idle post-push ;
   - conserve les assertions de reload et de position horizontale.

3. `tests/event-sync-conservation.test.mjs`
   - interdit le retour à une boucle de retries ;
   - exige la reprise unique, la convergence same-account et Actualiser ciblé.

## Surfaces affectées

- feuille générale de séance ;
- fiches individuelles ;
- Outbox financière ;
- canal WebSocket Live ;
- indicateur En ligne / Live ;
- bouton Actualiser ;
- rubrique Remboursements.

## Surfaces non modifiées

- schéma D1 ;
- Ledger canonique et écritures historiques ;
- règles de calcul financier ;
- droits et rôles ;
- Eco Relay ;
- politiques de prêt A/B déjà présentes ;
- structure des tableaux et données métier.

## Risques et compensations

- **Réseau instable** : l’Outbox reste durable ; aucune répétition aveugle.
- **Même compte sur deux appareils** : le push same-actor est appliqué mais ne déclenche pas l’alerte « collègue ».
- **Écriture locale concurrente** : le push distant ne remplace pas une intention Outbox non confirmée.
- **Quota Cloudflare** : aucune boucle idle ; le WebSocket sert de diffusion et de preuve de retour du transport.
- **Position utilisateur** : l’état de navigation et les scrollLeft/scrollTop sont persistés/restaurés.

## Critères de sortie

Fusion autorisée seulement après réussite de la CI gouvernée et des tests navigateur au SHA du PR. Déploiement autorisé ensuite uniquement via le workflow code-only 1.5.2.12, qui refait la qualification avant Wrangler et vérifie /health (version, build, cache et commit).
