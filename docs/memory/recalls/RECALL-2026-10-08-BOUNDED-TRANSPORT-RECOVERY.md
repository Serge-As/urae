# RECALL — audit et reprise transport 1.5.2.15

Le fondateur demande un audit des documents/conversations/livraisons et l'amélioration directe de la plateforme, avec liberté de proposer des innovations gratuites. Les fichiers de Bibliothèque non récupérés restent signalés ; ne pas déclarer tous les cahiers lus sur la base d'un résumé.

Base réelle : branche de livraison `fix/1.5.2.10-offline-conflicts-loans-20261003`, HEAD de mémoire `25ad23f3bdd39ac82c0529cf1b0dfa15d30acc0e`, production 1.5.2.14 `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3` attestée par Actions. Main est un socle documentaire, pas la ligne applicative. Réutiliser les acquis, pas les anciennes candidates déjà intégrées.

Défaut nouveau : le réveil transport automatique appelle forceTransportRetry, remet à zéro les échecs et se réarme. Correctif : un seul réveil par panne, reset uniquement sur vraie réussite/événement humain-réseau-Live ; conflits et quota restent protégés. Ne pas remplacer cela par un intervalle ni un deuxième solde.

Archive source SHA-256 sur CI ; aucun export/mutation D1. Nouveau cache immutable v15215, rollback v15214, préserver v15213/v15211/v15210. Les résultats CI, /health, Worker et terrain ont des états séparés ; mise à jour de la mémoire après preuve.

Le catalogue a 164 entrées : 155 classées OPERATIONAL par le registre, 7 EXTERNAL_GATED, 2 PLANNED. FOUNDATION_ACTIVE ne certifie pas chaque parcours. Voir audit et snapshot.

Préférence utilisateur durable : rapporter les crédits en fin de réponse. Le coût exact de la tâche n'est pas exposé par l'outil de quotas ; ne pas inventer un nombre en partant du solde 0 ou d'un pourcentage global.
