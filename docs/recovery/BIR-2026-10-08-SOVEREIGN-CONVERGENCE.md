# BIR+ — livraison code-only 1.5.2.14 vérifiée

Source de reprise : branche Git fix/codex-eco-sovereign-live-20261008 ; base immuable 0f0deacf6428cf841cd25634f732dd2f41d02e66. Contrat release : docs/release/CURRENT_RELEASE_CONTRACT.json. Schéma D1 conservé. Aucun contenu financier de production consulté/modifié dans les essais synthétiques.

Le cache candidat est isolé, le précédent v15213 est conservé, avec récupération v15210 disponible. Une installation incomplète n'active pas le nouveau worker et n'efface pas IndexedDB. Le rollback de code doit reprendre le SHA de production effectivement vérifié, jamais une version présumée par la documentation historique.

Avant livraison : CI et navigateurs sur le même SHA, puis workflow code-only et smoke strict version/build/cache/SHA. Ce workflow interdit explicitement export D1, migration, mutation de schéma et réécriture des données ; le checkpoint Git et la référence de production vérifiée sont les preuves de rollback de cette livraison. Les sauvegardes D1/R2 existantes sont conservées ; ne pas inventer une nouvelle restauration de données qui n’a pas eu lieu. Ne pas remplacer le workflow existant par un wrangler direct. Les acquis Cloudflare et secrets déjà configurés ne sont pas à recréer.

Le /health public vérifié à 2026-10-08T10:41:07.703Z servait encore 1.5.2.11, SHA c0dcb82e24687bb3473b46ccd4c0c77b9e561310, cache eco-system-v15211-field-recovery-20261005. Ce véritable prédécesseur est conservé à l’activation, en plus des références v15213 et v15210 ; ne pas confondre la version source précédente avec la version réellement installée chez les utilisateurs.

## Preuve de clôture du 8 octobre 2026

Source publique `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`, Worker `98d720dd-6364-436e-9a00-38809e4a3925`. Qualification `37765653443 SUCCESS` (646/646) ; livraison code-only `37765653486 SUCCESS` (Chromium 7/7, WebKit 6/6, smoke strict). Vérification publique indépendante /health + shell + catalogue 164 + garde de cache v15211 à 10:52 UTC. L'absence de mutation D1 est explicite dans le workflow ; aucune nouvelle sauvegarde/restauration D1 n'est prétendue. Le checkpoint Git exact de livraison est la preuve de source ; la référence antérieure effectivement observée est c0dcb82e24687bb3473b46ccd4c0c77b9e561310. Toute restauration de code doit reprendre le workflow qualifié et préserver les données. FIELD_ACCEPTED reste NOT_ACCEPTED pour les appareils/groupes physiques.
