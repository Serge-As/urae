# RECALL — corrections Eco-System 1.5.2.14

Le fondateur demande l'implémentation directe, une confrontation lisible, la synchronisation proactive et le Live, avec des améliorations cosmétiques sans modifier les parcours métier. L'offline est souverain ; la connexion bonifie le travail. Aucun tableau ni service existant ne doit disparaître.

Réutiliser Application/Outbox, Ledger/D1, GroupLiveHub, Eco Relay et les vues financières actuelles. Conserver les dates des intentions originales, l'idempotence et les portées de politique. Une reconfirmation explicite crée une nouvelle intention auditée. Les commandes reçues d'un autre acteur ne deviennent pas nos commandes ; ses droits /me ne sont jamais importés.

Base vérifiée : 0f0deacf6428cf841cd25634f732dd2f41d02e66. HEAD distant de la branche de livraison observé le 8 octobre : c6d4339ebde367aa3c01ece97e142c1851135cac. Le serveur navigateur de qualification doit réutiliser le vrai GroupLiveHub avec upgrade WebSocket et authentification signée ; un faux indicateur « connexion Live » n'est pas une preuve.

Les preuves locales, CI, livraison et terrain sont distinctes. FIELD_ACCEPTED reste NOT_ACCEPTED. Pas de suppression de cache/outbox utilisateur, de migration, de création D1/R2 ou d'activation d'argent réel.

## Preuve de clôture du 8 octobre 2026

Source publique `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`, Worker `98d720dd-6364-436e-9a00-38809e4a3925`. Qualification `37765653443 SUCCESS` (646/646) ; livraison code-only `37765653486 SUCCESS` (Chromium 7/7, WebKit 6/6, smoke strict). Vérification publique indépendante /health + shell + catalogue 164 + garde de cache v15211 à 10:52 UTC. L'absence de mutation D1 est explicite dans le workflow ; aucune nouvelle sauvegarde/restauration D1 n'est prétendue. Le checkpoint Git exact de livraison est la preuve de source ; la référence antérieure effectivement observée est c0dcb82e24687bb3473b46ccd4c0c77b9e561310. Toute restauration de code doit reprendre le workflow qualifié et préserver les données. FIELD_ACCEPTED reste NOT_ACCEPTED pour les appareils/groupes physiques.
