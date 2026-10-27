# Canopée + Repères — intégration visuelle autorisée

Le 26 octobre 2026, le fondateur a validé Canopée + Repères V2 et autorisé son intégration aux couleurs actuelles dorée, blanche, rouge et verte, avec conservation des parcours métier. La proposition et l'archive « Refonte visuelle auditee » sont des références de conception, jamais des données financières ou preuves de fonctionnement.

## Base vérifiée

- Copie locale : `8895e087e67b32c7fc57a4127eb8c3e20d995b0a`, source v41 avec clôture documentaire.
- HEAD distant de livraison observé une fois au départ : `35f4ff6774685a6a06058093ca30f5165551f312`, documentation seule après runtime `6d3264bd7f345d808fb8cbfcc618d99c274d3891`.
- Livraison historique `40235349738` relue : job de livraison terminé avec succès. Ce reçu ne qualifie pas les modifications du présent lot.
- Branche isolée : `codex/canopee-reperes-20261026`. Les artefacts locaux antérieurs restent dans la copie de travail d'origine.

## Réutilisation et autorités

- Le routeur de `main.js`, la navigation, les services et toutes les vues existantes restent propriétaires de leurs parcours.
- `group-home-ui.js` possède la projection d'accueil, `recap-ui.js` le détail du récap et les fiches canoniques la situation individuelle. Aucun second Ledger ni calcul métier n'est créé.
- Les chiffres sont consommés depuis les contrats Ledger/Récap existants. Une somme de positions de membres ne doit pas être renommée recettes de caisse. Les inconnus et erreurs restent explicites.
- TontineService et ses projections conservent participants, tours, parts, statut et preuve de distribution.
- Les boutiques, Foras, AdManager et Studio médias gardent leurs formulaires, identifiants, contrôles de droits et statuts.
- L'interface de coque réutilise ces routes et boutons. Elle ne persiste ni rôle, ni autorisation, ni montant et n'ajoute aucun polling.

## Périmètre

Cadre visuel responsive et accessible, palette existante, hiérarchie groupe/personne/activité, navigation contextuelle, accueil d'association et de tontine, accès au cockpit financier et aux fiches, lisibilité des surfaces commerce/forum/publicité/médias. Conservation des vues Senior/Assistée et des traductions FR/EN.

Les dix étapes, les deux feuilles, rubriques, prêts, épargne par dépôt, collation, règles vivantes, confrontation, historique, outbox/offline et synchronisation sont préservés. Aucun schéma, migration, prestataire, ciblage sensible, paiement réel ou diffusion automatique ajouté. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`.

## Contrôles et retour

Contrôles ciblés pendant le développement ; sur la candidate finale : compilation, TypeScript, gardes de gouvernance et suites natives, puis scénarios Chromium/WebKit isolés adaptés à la navigation, aux rôles, aux changements de groupe, au responsive, aux feuilles 1/2/5 et à la conservation des parcours financiers/hors ligne.

Le retour applicatif repose sur les commits de présentation et leurs tests. Aucune restauration de D1 ou purge des données d'appareil n'est nécessaire. Une publication éventuelle demande une candidate exacte qualifiée, une sauvegarde restaurable par la procédure existante et une vérification du runtime ; le présent jalon commence par l'intégration locale reviewable.

## État initial conservé (historique)

IN_PROGRESS : démarrage de l'intégration ; aucune qualification ou publication du nouveau design revendiquée. Crédits exacts non mesurables.


## Complément après relecture visuelle

Les captures ont révélé que les Dashboards par profil pouvaient conserver les tableaux vides du démarrage. Leur propriétaire est réutilisé : actualisation après hydratation du contexte, profil initial selon les droits chargés, choix explicite du profil conservé, invalidation des réponses tardives par compte/tenant/groupe et rôle. L’accueil et ce panneau se rafraîchissent aussi au retour ou à l’actualisation manuelle de l’Accueil, sans polling ni écriture financière. Deux scénarios supplémentaires vérifient les réponses tardives et l’actualisation des deux vues à partir de contributions entièrement fictives. Nouvelle qualification requise ; les reçus précédents ne qualifient pas ce complément.

La qualification a ensuite révélé une course de présentation à la reprise F5 : la colonne était persistée correctement, mais les tentatives initiales précédaient l’arrivée du tableau ; sa restauration finale attendait tous les panneaux secondaires. Le propriétaire de navigation observe désormais l’arrivée et la taille de ses seuls conteneurs financiers concernés, rétablit leur colonne dès qu’ils sont visibles et débordants, puis se déconnecte après restauration, interaction ou navigation suivante. Aucun polling réseau ni changement des écritures financières. Un scénario réel retient la liste des membres puis une requête secondaire pour vérifier que la colonne revient avant la fin du démarrage global, avec Ledger identique. Le scénario de remboursement existant et ses délais sont conservés sans modification.


## Clôture locale vérifiée — 27 octobre 2026

Candidate **1.5.2.42-canopee-reperes**, code qualifié `0b0836ee007254074c57916cd866c1f5e8828b98`, branche `codex/canopee-reperes-20261026`. **VERIFIED_LOCAL pour la refonte : 1062/1062 natifs, 40/40 Chromium et 16/16 scénarios WebKit de présentation/navigation/contexte**. Dans la suite WebKit élargie : 20/22, dont deux échecs Local Room liés à l’absence de WebRTC dans WebKit Windows 26.0 ; aucun test ignoré ou instable. Le contrôle sans chargement de l’app confirme cette limite du runtime ; les 6/6 scénarios souverains passent dans Chromium. La qualification complète de tous les navigateurs reste incomplète. Compilation, cache PWA complet et tests de packaging réussis. Les reçus détaillent les fichiers testés ; les résultats historiques v41 restent distincts.

Accueil de groupe financier, ouverture/report d’exercice, aperçu des fiches du Récap, dettes, cycle des tontines, rendez-vous et accès aux propriétaires existants Boutiques/Forum/AdManager/Médias. Palette dorée/blanche/rouge/verte, en-tête mobile compact, Senior/Assisté et FR/EN conservés. Date de dernière synchronisation, opérations locales en attente et données indisponibles explicites. Après arrêt réel du serveur, le groupe et son solde enregistré sont retrouvés. Réponses et formulaires obsolètes invalidés par compte/tenant/groupe.

**Aucune publication v42 ni recette physique terrain.** Aucun changement de schéma/migration, moteur financier ou prestataire ; `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. Preuves : `docs/release/evidence/CANOPEE-REPERES-QUALIFICATION-2026-10-26.json`, CIR et rappel du 26 octobre. Pour une future publication, conserver la filiation distante, qualifier la source exacte par la CI complète, puis BIR de production et vérifications publiques. Le miroir local ne possède pas de remote. Crédits exacts non mesurables.

Les premières erreurs et leurs diagnostics restent dans les artefacts locaux ; aucun échec initial n’est compté comme succès. Le nouveau test de coupure utilise une origine locale arrêtée, sans contourner la politique Origin du produit. Les assertions financières, les montants, les permissions et les délais Live de validation existants sont conservés. Les captures proviennent de deux groupes synthétiques alimentés par les API existantes, jamais de données réelles.

BIR+ du présent jalon : source Git locale archivée et relue fichier par fichier dans le livrable ; retour applicatif au commit de base local possible, sans migration. Portée SOURCE_LOCALE_SEULEMENT. Aucune sauvegarde/restauration D1/R2 de production ou d’outbox d’appareil n’est revendiquée ; aucune mutation de production n’a eu lieu.

**ÉTAT DU PROJET APRÈS ÉTAPE : VERIFIED_LOCAL / NOT_DEPLOYED / FIELD_ACCEPTED=NOT_ACCEPTED.**
