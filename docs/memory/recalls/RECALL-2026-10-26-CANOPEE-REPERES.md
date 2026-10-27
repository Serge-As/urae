# Canopée + Repères — rappel avant intégration

Autorisation explicite du fondateur le 26 octobre : intégrer le modèle accepté, couleurs dorée, blanche, rouge et verte, sans régression métier. Les modèles et l'archive fournie sont des références, jamais des données de groupes. La demande porte sur l'application réelle.

Base locale `8895e087e67b32c7fc57a4127eb8c3e20d995b0a`, branche isolée `codex/canopee-reperes-20261026`. HEAD distant observé au départ `35f4ff6774685a6a06058093ca30f5165551f312`, documentation après runtime v41 `6d3264bd7f345d808fb8cbfcc618d99c274d3891`. Le dépôt local est un miroir sans remote ; conserver la filiation distante lors d'une éventuelle publication.

AGENTS parent et dépôt, CURRENT_TRUTH, PROJECT_TRUTH_LEDGER, PROJECT_STATE, constitution 3.2.0 et clôture 2.3.4, économie 3.2.0, conventions universelles, Living Rules, FEATURE_REGISTRY, NEXT_RUN, atlas visuel et CIR historique ont été relus. Réutiliser les mêmes services, identifiants DOM et routeur. La navigation de coque et les onglets de cockpit existent déjà : les étendre.

L'accueil présente ; le Ledger/D1, OperationalCockpit, Exercise et les fiches conservent l'autorité. Aucun solde initial reconstruit par somme de toutes les lignes débit/crédit. Afficher l'ouverture de l'exercice canonique, la caisse du Ledger, et nommer les cumuls du Récap comme tels. Un membre ne lit pas l'agrégat gestionnaire. Les montants manquants, les erreurs et les projections locales restent explicites. Une part programmée ou servie n'est pas une nouvelle preuve de décaissement.

Le commerce, le forum, AdManager et les médias conservent leurs moteurs. Les nouveaux accès pointent vers les panneaux effectifs ; un dossier générique de service ne remplace pas le forum opérationnel. Aucun calcul publicitaire ne consomme les dettes ou les soldes.

La projection d'accueil doit invalider toute réponse et tout formulaire du contexte antérieur, y compris lors d'un changement de compte dans le même groupe. Pas de polling, purge d'IndexedDB/outbox, migration, activation monétaire ou publication automatique. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`.

Première vérification de développement : syntaxe, 3 tests natifs existants et 5 nouveaux scénarios de projection Chromium réussis. Le sixième scénario a détecté un accès Forum menant au dossier générique ; la nouvelle porte a été raccordée au panneau existant. La suite complète finale doit encore qualifier cette correction. Un essai natif lancé en même temps qu'une reconstruction a été invalidé (modules .build absents) ; il n'est pas une preuve. Réexécuter après gel du build.

Voir `docs/change-impact/CIR-2026-10-26-CANOPEE-REPERES.md`. État au démarrage : intégration locale en qualification, production de référence v41 ; aucun statut déployé ou terrain revendiqué. Crédits exacts non mesurables.


## Complément après relecture visuelle

Les captures ont révélé que les Dashboards par profil pouvaient conserver les tableaux vides du démarrage. Leur propriétaire est réutilisé : actualisation après hydratation du contexte, profil initial selon les droits chargés, choix explicite du profil conservé, invalidation des réponses tardives par compte/tenant/groupe et rôle. L’accueil et ce panneau se rafraîchissent aussi au retour ou à l’actualisation manuelle de l’Accueil, sans polling ni écriture financière. Deux scénarios supplémentaires vérifient les réponses tardives et l’actualisation des deux vues à partir de contributions entièrement fictives. Nouvelle qualification requise ; les reçus précédents ne qualifient pas ce complément.


## Clôture locale vérifiée — 27 octobre 2026

Candidate **1.5.2.42-canopee-reperes**, code qualifié `0b0836ee007254074c57916cd866c1f5e8828b98`, branche `codex/canopee-reperes-20261026`. **VERIFIED_LOCAL pour la refonte : 1062/1062 natifs, 40/40 Chromium et 16/16 scénarios WebKit de présentation/navigation/contexte**. Dans la suite WebKit élargie : 20/22, dont deux échecs Local Room liés à l’absence de WebRTC dans WebKit Windows 26.0 ; aucun test ignoré ou instable. Le contrôle sans chargement de l’app confirme cette limite du runtime ; les 6/6 scénarios souverains passent dans Chromium. La qualification complète de tous les navigateurs reste incomplète. Compilation, cache PWA complet et tests de packaging réussis. Les reçus détaillent les fichiers testés ; les résultats historiques v41 restent distincts.

Accueil de groupe financier, ouverture/report d’exercice, aperçu des fiches du Récap, dettes, cycle des tontines, rendez-vous et accès aux propriétaires existants Boutiques/Forum/AdManager/Médias. Palette dorée/blanche/rouge/verte, en-tête mobile compact, Senior/Assisté et FR/EN conservés. Date de dernière synchronisation, opérations locales en attente et données indisponibles explicites. Après arrêt réel du serveur, le groupe et son solde enregistré sont retrouvés. Réponses et formulaires obsolètes invalidés par compte/tenant/groupe.

**Aucune publication v42 ni recette physique terrain.** Aucun changement de schéma/migration, moteur financier ou prestataire ; `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. Preuves : `docs/release/evidence/CANOPEE-REPERES-QUALIFICATION-2026-10-26.json`, CIR et rappel du 26 octobre. Pour une future publication, conserver la filiation distante, qualifier la source exacte par la CI complète, puis BIR de production et vérifications publiques. Le miroir local ne possède pas de remote. Crédits exacts non mesurables.

Les premières erreurs et leurs diagnostics restent dans les artefacts locaux ; aucun échec initial n’est compté comme succès. Le nouveau test de coupure utilise une origine locale arrêtée, sans contourner la politique Origin du produit. Les assertions financières, les montants, les permissions et les délais Live de validation existants sont conservés. Les captures proviennent de deux groupes synthétiques alimentés par les API existantes, jamais de données réelles.

BIR+ du présent jalon : source Git locale archivée et relue fichier par fichier dans le livrable ; retour applicatif au commit de base local possible, sans migration. Portée SOURCE_LOCALE_SEULEMENT. Aucune sauvegarde/restauration D1/R2 de production ou d’outbox d’appareil n’est revendiquée ; aucune mutation de production n’a eu lieu.

**ÉTAT DU PROJET APRÈS ÉTAPE : VERIFIED_LOCAL / NOT_DEPLOYED / FIELD_ACCEPTED=NOT_ACCEPTED.**
