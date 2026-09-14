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

### 6.1 Confirmation financière immédiate par le membre
Règle obligatoire pour l’option Premium Live Ledger.

Dès qu’une cotisation, épargne, remboursement, prêt, assistance, pénalité, correction ou autre écriture affecte le compte d’un membre, le nouvel état doit être propagé en quasi temps réel vers ses appareils connectés. Cible UX : quelques secondes en réseau normal, avec rattrapage automatique à la reconnexion si l’appareil est offline.

Le membre reçoit une notification claire indiquant au minimum :
- type d’opération ;
- montant et devise ;
- rubrique concernée ;
- ancienne situation et nouvelle situation pertinentes ;
- date et heure de l’écriture ;
- auteur de l’écriture et rôle exercé ;
- séance, période ou contexte métier associé ;
- motif ou référence lorsque requis ;
- état de validation institutionnelle de l’opération.

La notification doit ouvrir directement la fiche de transaction. Le membre peut choisir :
- `VALIDER LA TRANSACTION` : il reconnaît que l’écriture correspond à ce qui s’est réellement passé ;
- `ÉMETTRE UNE RÉSERVE` : il conteste ou demande vérification ;
- ne rien faire immédiatement : la transaction reste valable selon les règles du groupe, mais l’absence de réponse reste visible dans l’audit.

La validation du membre est un accusé de conformité et de connaissance. Elle ne remplace jamais l’autorité statutaire du responsable et ne crée pas à elle seule le droit d’effectuer une opération.

### 6.2 Verrouillage comptable après confirmation
Une écriture financière déjà confirmée par le ledger ne doit jamais être réécrite silencieusement ni remplacée en place.

Après confirmation du membre, le verrouillage devient renforcé :
- l’entrée initiale reste immuable ;
- toute correction ultérieure exige une écriture de rectification ou de compensation liée à l’originale ;
- la nouvelle écriture doit indiquer son auteur, sa justification et l’opération qu’elle rectifie ;
- le membre reçoit immédiatement une nouvelle notification ;
- l’historique montre toujours la transaction initiale, la correction et les confirmations/réserves associées.

Ce mécanisme produit un verrouillage logique du compte sans empêcher les corrections légitimes prévues par le règlement.

### 6.3 Alerte immédiate sur toute modification sensible
Toute opération ou correction qui modifie la situation financière du membre doit déclencher une alerte de sécurité métier comparable aux alertes de connexion d’un compte en ligne.

Canaux à combiner selon disponibilité : canal live de l’application, push PWA quand supporté, notification au prochain réveil/service worker, puis mécanismes complémentaires configurables du groupe. Aucun canal moderne ne doit être obligatoire pour Android 6 : le centre de notifications interne et la synchronisation au retour dans l’application restent la base universelle.

La fiche d’alerte doit permettre au membre d’évaluer trois choses distinctes :
1. l’auteur avait-il le rôle et les droits nécessaires ?
2. l’opération était-elle permise à ce moment précis selon la séance, période, clôture ou règlement ?
3. le contenu correspond-il réellement à ce que le membre a payé, reçu ou accepté ?

### 6.4 Autorité, temporalité et contrôle réglementaire interne
Avant d’accepter une écriture sensible, le Durable Object doit appliquer un moteur de règles :
- rôle et habilitation active de l’auteur ;
- groupe et rubrique concernés ;
- séance ouverte/fermée ;
- période comptable ;
- limites de montant ;
- opérations rétroactives ;
- corrections après clôture ;
- éventuelle double validation selon les règles du groupe ;
- justification obligatoire pour les exceptions.

Une opération autorisée mais exceptionnelle n’est pas supprimée : elle est marquée et auditée. Une opération impossible selon les règles du groupe doit être refusée avant écriture ou envoyée vers un circuit d’exception explicitement autorisé.

### 6.5 Réserve du membre — contentieux non bloquant
Principe obligatoire : une réserve ne doit jamais permettre à un membre, de bonne ou de mauvaise foi, de paralyser le groupe ou d’annuler unilatéralement une opération faite par une personne autorisée.

Lorsqu’un membre clique `ÉMETTRE UNE RÉSERVE` :
- la transaction reste comptabilisée et continue son cycle normal ;
- le ledger ne supprime ni ne bloque l’écriture ;
- un dossier de contentieux est créé et lié à la transaction ;
- l’état `RÉSERVE MEMBRE` apparaît clairement en rouge dans le compte du membre et dans les vues des responsables habilités ;
- tous les responsables autorisés concernés reçoivent l’alerte ;
- la réserve conserve le motif, l’heure, l’auteur de la réserve et l’état financier exact au moment de la contestation ;
- aucune donnée historique ne peut être effacée pour faire disparaître la réserve.

Le membre est invité à contacter le responsable auteur de la transaction lorsqu’il soupçonne une erreur. Il peut ensuite consulter les validations institutionnelles visibles dans la plateforme.

### 6.6 Validation par un autre responsable
Un responsable autorisé, distinct ou non de l’auteur initial selon les règles du groupe, peut examiner l’opération et ajouter une validation institutionnelle.

Cette validation :
- ne supprime pas automatiquement la réserve du membre ;
- est immédiatement visible par le membre ;
- contient l’identité/qualité du validateur, la date, le motif éventuel et la décision ;
- est communiquée aux autres responsables selon leurs droits.

Après cette validation, le membre peut :
- `APPROUVER APRÈS VÉRIFICATION`, ce qui clôt sa réserve personnelle sans effacer son historique ;
- `MAINTENIR MA RÉSERVE`, ce qui conserve le contentieux ouvert ou en suivi sans bloquer le ledger.

### 6.7 États recommandés du cycle membre/contentieux
La comptabilité et le contentieux sont deux axes distincts.

État comptable possible : `POSTED`, `RECTIFIED`, `REVERSED_BY_COMPENSATION`.

État d’information membre possible : `NOTIFIED`, `MEMBER_CONFIRMED`, `MEMBER_UNANSWERED`.

État contentieux possible : `NO_RESERVE`, `MEMBER_RESERVE`, `UNDER_REVIEW`, `OFFICER_CONFIRMED`, `MEMBER_APPROVED_AFTER_REVIEW`, `MEMBER_RESERVE_MAINTAINED`, `RESOLVED`.

Ne jamais utiliser la réserve comme état qui rend la transaction financière inexistante.

### 6.8 Audit et preuve
Chaque changement d’état doit produire un événement append-only : notification émise, notification livrée si mesurable, ouverture de fiche, validation membre, réserve, commentaire autorisé, validation responsable, maintien ou retrait de réserve, rectification comptable.

Le système doit pouvoir répondre a posteriori : qui a fait quoi, quand, avec quel rôle, dans quelle séance/période, sur quel appareil/session lorsque disponible, quelle règle a autorisé l’action, quelle situation financière existait avant et après, et quelles personnes ont confirmé ou réservé.

## 7. Web Share Target
PILOT futur : partager un reçu/photo/document depuis Android vers Tontine Platform. Toujours conserver le bouton classique de sélection de fichier.

## 8. Web NFC
WATCH : pointage ou carte membre. Toujours QR/code manuel comme fallback.

## 9. OpenFeature / feature flags
ADOPT_NOW comme règle : `premium_live_ledger`, `crdt_collaboration`, `periodic_sync_hint`, `passkeys_optional`, `share_target_receipts`, `member_live_confirmation`, `member_nonblocking_reserve`. Toute nouveauté doit être activable progressivement et réversible.

## Critères avant activation Premium
Tests de concurrence, double soumission, replay, coupure réseau, reprise après crash, appareil offline plusieurs jours, inversion d’ordre, duplication, rollback métier par écriture compensatrice, export comptable, audit, restauration depuis snapshot+journal et comparaison automatique des totaux.

Ajouter obligatoirement des tests du protocole membre : notification quasi temps réel, téléphone offline puis reconnexion, validation membre, réserve non bloquante, seconde validation par responsable, maintien de réserve, rectification d’une transaction déjà confirmée, tentative de modification après clôture, responsable sans autorité, opération hors période autorisée, plusieurs appareils du même membre, double clic sur validation/réserve et conservation intégrale du contentieux.
