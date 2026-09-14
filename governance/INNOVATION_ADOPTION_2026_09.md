# Tontine Platform — registre d’adoption des innovations

Décision du 14 septembre 2026.

Ce registre doit être consulté avant toute réforme majeure. Priorité absolue : fiabilité financière, fonctionnement offline/2G, compatibilité anciens Android, récupération après coupure et lisibilité pour les utilisateurs non techniques.

## 1. Premium Live Ledger — architecture cible
Statut : PILOT PREMIUM.

But : offrir une option temps réel plus puissante à côté du mode D1 standard, sans sacrifier l’exactitude comptable.

Architecture recommandée :
- un Durable Object logique par groupe ou partition financière active ;
- toutes les écritures financières d’un même groupe passent par cette autorité séquentielle afin d’éviter les courses concurrentes ;
- chaque opération reçoit un identifiant idempotent unique ;
- chaque écriture produit une entrée append-only immuable ;
- le solde est une vue calculée, jamais la seule preuve ;
- snapshot périodique + replay du journal ;
- réplication asynchrone vers D1 pour reporting, recherche et reprise ;
- contrôle de cohérence automatique entre journal, soldes et réplica ;
- file de quarantaine pour anomalie au lieu de correction silencieuse ;
- possibilité de repasser temporairement en mode D1 standard si la couche temps réel est indisponible.

Ainsi Durable Objects peut devenir l’autorité live de l’option Premium, mais D1 reste un réplica durable/reporting et une voie de reprise. Le journal n’est pas supprimé : il devient une propriété interne de la solution live.

## 2. CRDT — usage encadré
Statut : PILOT.

Utiliser CRDT pour les données naturellement fusionnables : notes, brouillons de réunion, commentaires, listes collaboratives, certains profils ou documents. Ne pas fusionner automatiquement une transaction monétaire conflictuelle.

Pour les finances, reprendre l’idée utile des CRDT sans copier leur usage aveuglément : opérations immuables, identifiants uniques, causalité/version, synchronisation offline, détection de conflit et résolution explicite. Les montants et validations restent dans le ledger transactionnel.

## 3. Offline Outbox
Statut : ADOPT_NOW comme socle.

Toute écriture faite hors ligne est d’abord enregistrée localement avec identifiant unique et statut. L’interface distingue clairement : enregistré localement, en synchronisation, confirmé serveur, conflit, échec à traiter. À la reconnexion, envoi ordonné et idempotent. Aucun faux succès distant.

## 4. Periodic Background Sync — amélioration progressive
Statut : PILOT facultatif.

Ne jamais en dépendre. Si disponible, l’utiliser pour tenter synchronisation, rafraîchissement léger et récupération de travaux. Sinon : synchronisation au lancement, au retour de connectivité, au retour au premier plan, après action utilisateur et via service worker lorsque possible.

Cette combinaison reproduit le bénéfice recherché même sur navigateurs qui ne supportent pas Periodic Background Sync.

## 5. Passkeys/WebAuthn — option
Statut : PILOT optionnel.

Le mode classique doit fonctionner sur Android 6 et navigateurs anciens. Proposer une passkey uniquement quand la plateforme la supporte. Jamais d’obligation et toujours une récupération de compte indépendante.

## 6. Durable Objects pour séance live
Statut : PILOT.

Une séance peut avoir un canal temps réel commun pour présences, cotisations en cours, validations et notifications de changements. Le Durable Object orchestre la concurrence ; le ledger confirme les écritures financières ; le client offline conserve son outbox jusqu’à accusé de réception.

## 7. Web Share Target
PILOT futur : partager un reçu/photo/document depuis Android vers Tontine Platform. Toujours conserver le bouton classique de sélection de fichier.

## 8. Web NFC
WATCH : pointage ou carte membre. Toujours QR/code manuel comme fallback.

## 9. OpenFeature / feature flags
ADOPT_NOW comme règle : `premium_live_ledger`, `crdt_collaboration`, `periodic_sync_hint`, `passkeys_optional`, `share_target_receipts`. Toute nouveauté doit être activable progressivement et réversible.

## Critères avant activation Premium
Tests de concurrence, double soumission, replay, coupure réseau, reprise après crash, appareil offline plusieurs jours, inversion d’ordre, duplication, rollback métier par écriture compensatrice, export comptable, audit, restauration depuis snapshot+journal et comparaison automatique des totaux.
