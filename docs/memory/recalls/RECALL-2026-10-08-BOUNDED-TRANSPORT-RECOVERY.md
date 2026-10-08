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



## Continuité HOLD après quota mensuel épuisé

Source de travail la plus récente : **e083a6a38b1ab76e6827e512bb7e900604911a4c**, branche **fix/confrontation-clock-recovery-20261008**, PR **#72 brouillon**. Trois défauts d'horloge prouvés, 653 Node PASS ; Chromium 7/8 encore en échec 4 000/5 000 sur 4022ef5. Dernier source 654/8/6 non exécuté. Le fondateur confirme quota Actions 2 000 minutes épuisé ; terminal Codex indisponible. Lanceur privé Node et dossier de reprise préparés sur la branche de travail. Lire **docs/memory/checkpoints/CHECKPOINT-2026-10-08-HOLD-LOCAL-QUALIFICATION.md**. Cette mise à jour de mémoire ne rétablit aucune publication, ne change aucun code d'application et ne mutate aucune donnée.
