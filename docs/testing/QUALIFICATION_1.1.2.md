# Qualification 1.1.2 — 13 septembre 2026

Commande : npm.cmd run ci. Code de sortie 0 ; durée 111,73 secondes. Windows, Node 24.19.0, TypeScript 5.9.3, SQLite natif.

65 tests exécutés, 65 réussis, 0 échec, 0 ignoré. Compilation, architecture, gouvernance, constitution, Truth Ledger, Recall/CIR, index et couverture des sources : PASS. Journal intégral : qualification.log.

Les sept nouveaux tests couvrent les rubriques indépendantes, les quatre parts servies en un/deux/quatre tours, les capacités et montants invalides refusés avant écriture, la reprise de conversion interrompue sans doublon, les modifications de planning conservées, la persistance SQL via API authentifiée et la conversion déléguée sans élargissement des droits. Les 58 tests antérieurs couvrent notamment sessions, isolation, comptabilité atomique, contrepassations, relevés et outbox.

Recette navigateur : création progressive des rubriques ; caractères spéciaux affichés comme texte ; quatre parts à 10 000 XAF pendant quatre séances donnent 160 000 XAF ; programmation 1,1,2,2 ; ajouter une rubrique invalide la simulation et désactive la création. La conversion et la persistance multi-rubriques ont été vérifiées par le test API SQL. La recette mobile/offline exhaustive reste ouverte.

Le message Git « Needed a single revision » vient de la restauration locale sans historique ; les contrôles suivants passent. La base distante exacte a été récupérée séparément : next/1.1.0-cahier-app, f7c203e919c644466289c587669ef817b74130af ; 162 fichiers vérifiés.

Limites : aucun déploiement de cette version, test de charge Workers, paiement réel ou certification de tous les moteurs du cahier. Rapprochement des identités historiques, récupération des comptes/MFA et qualification de l’authentification Workers restent nécessaires. Le planning des parts ne déclenche aucun décaissement ; les noms de simulation ne créent pas de comptes membres.
