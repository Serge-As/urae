# RECALL — audit et reprise transport 1.5.2.15

Le fondateur demande un audit des documents/conversations/livraisons et l'amélioration directe de la plateforme, avec liberté de proposer des innovations gratuites. Les fichiers de Bibliothèque non récupérés restent signalés ; ne pas déclarer tous les cahiers lus sur la base d'un résumé.

Base réelle : branche de livraison `fix/1.5.2.10-offline-conflicts-loans-20261003`, HEAD de mémoire `25ad23f3bdd39ac82c0529cf1b0dfa15d30acc0e`, production 1.5.2.14 `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3` attestée par Actions. Main est un socle documentaire, pas la ligne applicative. Réutiliser les acquis, pas les anciennes candidates déjà intégrées.

Défaut nouveau : le réveil transport automatique appelle forceTransportRetry, remet à zéro les échecs et se réarme. Correctif : un seul réveil par panne, reset uniquement sur vraie réussite/événement humain-réseau-Live ; conflits et quota restent protégés. Ne pas remplacer cela par un intervalle ni un deuxième solde.

Archive source SHA-256 sur CI ; aucun export/mutation D1. Nouveau cache immutable v15215, rollback v15214, préserver v15213/v15211/v15210. Les résultats CI, /health, Worker et terrain ont des états séparés ; mise à jour de la mémoire après preuve.

Le catalogue a 164 entrées : 155 classées OPERATIONAL par le registre, 7 EXTERNAL_GATED, 2 PLANNED. FOUNDATION_ACTIVE ne certifie pas chaque parcours. Voir audit et snapshot.

Préférence utilisateur durable : rapporter les crédits en fin de réponse. Le coût exact de la tâche n'est pas exposé par l'outil de quotas ; ne pas inventer un nombre en partant du solde 0 ou d'un pourcentage global.

## Qualification validée — 1.5.2.15, avant livraison

Source qualifiée : `3f7ea03457bbd936a87e299270843043e2826a24`, PR **#71 fusionnée** dans la branche de livraison par `754a8cef153b7ebe92b993de3b68f7a2c42d9f2d`. Runs **37820287689 SUCCESS** et **37820287701 SUCCESS** : **650/650 Node**, **Chromium 8/8**, **WebKit 6/6**, dont le scénario API inaccessible/navigator online et convergence de la même intention entre deux gestionnaires.

Le job gouverné du run **37820281608** est SUCCESS ; archive source **11567969551**, **1 775 802 octets**, digest artefact `sha256:53a664ea2da558f188aae304fe8da06d2bea52b8bf286955d6a88bfb556e79bc`, contrôle SHA-256 interne et lecture tar PASS. Son troisième job navigateur reste bloqué à l'installation des navigateurs au moment de ce checkpoint ; il n'est pas compté comme un troisième run réussi. Les deux autres workflows complets exécutent les mêmes suites requises.

**Production 1.5.2.15 : NON ENCORE ATTESTÉE**. La source est qualifiée, la livraison code-only doit encore prouver /health du SHA livré. La production antérieure 1.5.2.14 reste la dernière attestée à ce point. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false. Les blocs suivants décrivent les checkpoints précédents.

---


## Publication suspendue — chronologie d'une reconfirmation

Run `37822250394`, source `fe2b9b2649992bf4eceda8e10b3d1e4dd76f5d91` : Chromium 7/8, ancienne confrontation attend 4000 mais reçoit 5000 après choix explicite. Malgré les qualifications précédentes, ce résultat exige investigation. Marqueur de livraison HOLD commit `5ee23e831ab661cef65c618534692b112458f584` ; ancienne livraison `37822250587` annulée avant publication, nouvelle livraison HOLD refusée au garde du marqueur.

Le code révèle une faiblesse de l'ancrage : warmFinancialClock peut conserver un ancrage antérieur, ou recevoir un vieux GET depuis la copie offline et le raccrocher au performance.now actuel. La normalisation serveur reste anchorAtMs + elapsed ; une nouvelle validation humaine peut alors être datée avant la valeur canonique déjà observée, et être SUPERSEDED. Cette explication doit être confrontée à l'artefact d'échec et aux nouveaux tests ; elle n'est pas présentée comme une lecture du journal qui n'a pas encore eu lieu.

Correction ciblée : la reconfirmation explicite demande un nouvel ancrage après les warmups antérieurs ; l'endpoint d'ancrage horaire est exclu des réponses snapshot offline. Aucun horodatage original modifié, aucun comparateur/Ledger remplacé. Une panne d'ancrage conserve une nouvelle intention non confirmée, sans faux signe de fraîcheur. Tests : chronologie après version canonique, warmup antérieur concurrent, copie cache ancienne sous panne. Le workflow forensique conserve la preuve de tests FAIL sur l'ancienne source puis requalifie la source corrigée.

### Preuve initiale de la régression horloge

Le job forensique 113479969251 du run 37826312843 confirme trois échecs d'assertion sur le source précédent (0/3), après compilation réussie. Les deux premiers montrent une nouvelle décision normalisée avant le canonique déjà observé ; le troisième conserve old-clock. Son enveloppe doit demander explicitement le reporter TAP avant de compter '# fail 3'. La troisième fixture est renforcée en retirant l'ancre en mémoire pour isoler le vrai replay du GET hors ligne ; la séquence de remplacement suit aussi celle de l'intention originale. Aucune publication autorisée par ce résultat partiel.
