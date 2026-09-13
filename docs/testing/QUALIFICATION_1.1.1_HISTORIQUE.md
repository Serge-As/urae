# Qualification — 12 septembre 2026

- Environnement : Windows, Node 24.19.0, TypeScript 5.9.3, SQLite natif de Node.
- Commande : `npm.cmd run ci` ; code de sortie de npm : **0** ; durée observée : 129,83 s. Journal complet : `qualification.log`.
- Typecheck, architecture, 23 garde-fous de gouvernance, 11 services partagés, constitution, Truth Ledger, Recall/CIR, index de mémoire et couverture documentaire : PASS.
- Tests : **58 exécutés, 58 réussis, 0 échec, 0 ignoré**.
- Dans le log, `fatal: Needed a single revision` provient de la recherche d’un parent Git absent dans la restauration locale sans historique ; le contrôle vérifie ensuite les fichiers présents et les Recall/CIR. La comparaison avec une vraie branche Git distante reste à effectuer.
- Le collecteur Python a rencontré une erreur d’affichage de caractères Unicode dans la console Windows après la fin de npm. Le journal UTF-8 a été sauvegardé et le résultat npm 0 a été observé avant cette erreur ; cela ne correspond pas à un échec des tests.

## Cas significatifs

Refus anonyme et inter-tenant, en-têtes d’identité falsifiés, expiration et révocation des sessions, CSRF ; admission entre tenants avec accès au seul relevé personnel ; cotisation unique malgré concurrence/rejeu ; changement d’intention rejeté ; rollback SQL injecté puis reprise ; contrepassation et net du relevé ; notes réellement stockées ; file locale enregistrée avant envoi ; réponse réseau perdue rejouée avec la même référence ; aucun envoi si le stockage local échoue.

## Navigateur

Une base SQLite de vérification distincte a été utilisée sur localhost:4180, avec des données fictives. Inscription, création de groupe, ajout de membre, séance, rubrique, cotisation de 3 500 XAF, reçu unique et relevé à 3 500 XAF ont été observés. Le nom `Membre & <test>` apparaît comme texte dans la liste et le relevé. Le dialogue du relevé a été inspecté visuellement sur écran de bureau.

Le bouton CSV et la vue imprimable sont livrés ; aucune certification de tous les logiciels de lecture CSV/impression n’est revendiquée. La recette mobile exhaustive et le démarrage sans réseau après fermeture du navigateur restent à compléter.

## Limites

La couverture des sources dans les contrôles est celle des manifestes historiques ; elle ne prouve pas l’exécution de tous les classeurs/VBA. La liste des capacités n’est pas une mesure de fonctionnalités terminées. Aucun déploiement, migration distante, test de charge Cloudflare, compte fournisseur ou paiement réel testé. Rapprochement des comptes historiques, récupération/MFA et mesure CPU Workers nécessaires avant mise en ligne.

Après les dernières retouches d’affichage et de cache PWA : recompilation réussie et 9 tests UI/catalogue/PWA réussis. La matrice navigateur a également affiché 3 500 XAF pour la même cotisation que le reçu et le relevé.
