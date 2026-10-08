# BIR+ — checkpoint candidate 1.5.2.14

Source de reprise : branche Git fix/codex-eco-sovereign-live-20261008 ; base immuable 0f0deacf6428cf841cd25634f732dd2f41d02e66. Contrat release : docs/release/CURRENT_RELEASE_CONTRACT.json. Schéma D1 conservé. Aucun contenu financier de production consulté/modifié dans les essais synthétiques.

Le cache candidat est isolé, le précédent v15213 est conservé, avec récupération v15210 disponible. Une installation incomplète n'active pas le nouveau worker et n'efface pas IndexedDB. Le rollback de code doit reprendre le SHA de production effectivement vérifié, jamais une version présumée par la documentation historique.

Avant livraison : CI et navigateurs sur le même SHA, puis workflow code-only et smoke strict version/build/cache/SHA. Ce workflow interdit explicitement export D1, migration, mutation de schéma et réécriture des données ; le checkpoint Git et la référence de production vérifiée sont les preuves de rollback de cette livraison. Les sauvegardes D1/R2 existantes sont conservées ; ne pas inventer une nouvelle restauration de données qui n’a pas eu lieu. Ne pas remplacer le workflow existant par un wrangler direct. Les acquis Cloudflare et secrets déjà configurés ne sont pas à recréer.
