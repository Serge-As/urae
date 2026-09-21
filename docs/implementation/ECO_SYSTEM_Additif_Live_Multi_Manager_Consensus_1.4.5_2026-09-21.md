# Additif 1.4.5 — Séance financière live multi-gestionnaires

Date : 2026-09-21

## Règle fonctionnelle
Une séance peut être saisie simultanément par plusieurs responsables habilités. Chaque responsable possède une couleur stable et son identité reste attachée à chaque proposition. Une saisie concurrente n'écrase jamais silencieusement une autre.

- valeurs identiques : convergence automatique ;
- valeurs différentes : état DIVERGENT et demande de choix collectif ;
- vote des responsables : la valeur majoritaire devient la projection retenue ;
- dissidence maintenue : réserve/contentieux rouge non bloquant ; la séance et la comptabilité continuent ;
- le membre concerné reçoit la projection retenue en direct et peut ensuite utiliser le contrôle financier membre existant : confirmer, émettre une réserve, approuver après revue ou maintenir sa réserve ;
- aucune réserve membre ou gestionnaire ne modifie rétroactivement une écriture Ledger : correction par écriture rectificative/compensatrice et audit.

## Autorités
- Ledger canonique : vérité comptable.
- MeetingLiveConsensusService : arbitrage des saisies concurrentes avant/pendant projection.
- GroupLiveHub Durable Object : transport ordonné des événements live et rattrapage par séquence.
- MemberFinancialControlService : contrôle personnel, réserve non bloquante et revue indépendante.
- D1 : persistance/reporting standard ; Premium Live reste une couche optionnelle.

## Résilience / compatibilité
WebSocket est un accélérateur. En cas d'indisponibilité : GET des événements depuis la dernière séquence, outbox/offline, rafraîchissement normal. Android 6 ne dépend ni de Passkeys, ni de WebSocket, ni de Periodic Background Sync pour conserver les fonctions essentielles.

## Innovations appliquées
- Workers/Durable Objects tracing activé dans Wrangler pour suivre les appels sans SDK additionnel.
- D1 Free : traiter les erreurs de quota comme indisponibilité temporaire, jamais comme preuve d'échec métier d'une écriture déjà confirmée par l'autorité Premium.
- Workflows subscribe : PILOT ultérieur pour les contentieux longs et validations multi-étapes ; pas de binding ajouté tant que le coût et le comportement terrain ne sont pas qualifiés.
- CRDT : réservé aux données fusionnables ; aucune fusion automatique de montants financiers conflictuels.

## Critères de promotion
1. CI complète verte.
2. test permanent divergence 3 responsables / majorité / réserve.
3. test membre : notification puis confirmation/réserve sans mutation du Ledger.
4. test coupure WebSocket et rattrapage par séquence.
5. test Android ancien : fallback fonctionnel.
6. argent réel reste OFF tant que la recette terrain n'est pas signée.
