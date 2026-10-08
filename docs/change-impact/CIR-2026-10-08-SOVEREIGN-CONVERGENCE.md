# CIR — reprise Eco-System : confrontation, synchronisation et présentation

Date : 2026-10-08. Base examinée : `0f0deacf6428cf841cd25634f732dd2f41d02e66` (PR #69).

## Décision et propriétaires

Réparer les propriétaires existants : Application/Outbox pour la durabilité et la reprise, Ledger/D1 pour les montants canoniques, GroupLiveHub pour la diffusion, Eco Relay pour le transport local, vues existantes pour la présentation. Aucun second Ledger, aucune migration destructive, aucun changement de parcours ni de politique de prêt. Les choix de portée de politique déjà présents restent conservés.

## Défauts constatés avant intervention

- Qualification Node en échec : 20 tests, dont des attentes de version obsolètes.
- Le serveur navigateur de qualification n'instancie pas GroupLiveHub et ne traite pas les upgrades WebSocket. Le test de diffusion du remboursement échoue ; son indicateur accepte aussi le texte « connexion Live » déconnecté.
- La confrontation de retour en ligne ne traite pas les identifiants « appliquer » et une annulation n'hydrate pas la valeur retenue. L'import Relay recalcule les conflits après intégration des commandes.
- Les événements spécialisés portent le montant du paiement individuel alors que la cellule présente le total de la séance.
- Une variable d'optimisme déclarée dans le bloc try est utilisée dans catch ; le gestionnaire d'erreur peut lui-même échouer.

## Risques et vérification

Conserver l'historique des intentions, les clés d'idempotence et l'ordre de validation. Une décision explicite qui reconfirme une ancienne valeur doit être une nouvelle intention datée et tracée, jamais une falsification de l'ancienne date. Les montants en attente restent distingués du montant canonique. Vérifier plusieurs comptes/appareils, perte de réponse, reprise sans F5, refresh hors ligne, conflits et tableaux dérivés. Aucun accès aux données financières de production.

L'adaptateur WebSocket de développement réutilise le GroupLiveHub de production et l'authentification Worker ; son stockage concerne exclusivement la diffusion locale de test. Les preuves locales, CI et déploiement seront rapportées séparément, avec leur SHA. Aucun PASS terrain n'est présumé.

## Corrections livrables et tests

- Outbox : confirmation locale rapide, reprise unique sérialisée, réouverture des échecs de transport après un vrai événement, protection des conflits métier et quotas. Annuler/appliquer une confrontation conserve l'intention d'origine ; le choix explicite crée une nouvelle validation lorsque nécessaire.
- Relay : comparaison avant import, droit /me protégé, conflits et décisions persistants, affichage par séance avec deux sources/auteurs/dates, choix cellule/séance/ensemble, propagation locale déclenchée par une validation sans heartbeat.
- Worker : remboursement/dépense/prêt diffusés comme total de cellule, versions spécialisées cohérentes, projection post-commit rejouable, ACK idempotent porteur de la valeur canonique courante. Un remboursement direct rejoué avec la même clé ne réduit pas deux fois le capital ; une version périmée est refusée avant écriture.
- UI : conflits rouges, accès direct à la confrontation différée, push confirmé conservé pour le reload hors ligne, pas de navigation forcée à la reprise, parcours de dette globale réparé, sous-lignes de critères et sélection conservées.
- PWA : toutes les URL littérales importées sont précachées, empreintes SHA-256 de build vérifiées, téléchargement complet borné sans abandon prématuré des liens lents.
- Présentation : contraste, nombres alignés, cibles tactiles, zébrage discret et tableaux lisibles ; contrôles/parcours/IDs conservés.

Les anciennes assertions de release sont reliées au contrat courant. Les anciennes attentes de blocage après quatre reconnexions ou d'ignorance du même compte sont remplacées par les invariants actuels, étayés par des tests API et de vrais navigateurs. La recette physique Android 6/anciens navigateurs/2G reste à effectuer ; elle n'est jamais déduite d'un émulateur.

## Dernière vérification sur téléphone

La capture du véritable tableau financier à 390 px révélait que « Total membre », figé à droite, masquait une partie de la saisie. Sur les écrans de 640 px ou moins, cette colonne et les colonnes secondaires du tableau des quatre critères défilent désormais normalement ; la référence du membre reste fixe. Les montants, totaux, tableaux et parcours restent identiques. Le scénario navigateur effectue maintenant une vraie saisie/validation sur téléphone et vérifie sa réception par l'autre gestionnaire, au lieu de vérifier seulement la visibilité du bouton.

## Cache réellement installé — garde-fou de livraison

Le /health public a révélé une production 1.5.2.11, malgré la lignée source précédente 1.5.2.13. L’activation du SW conserve donc également le cache v15211 réellement présent chez les utilisateurs. Un nouveau test exécute le véritable handler d’activation et vérifie que le code de l’ancien shell reste lisible dans ce cache. La qualification du nouvel SHA est obligatoire ; aucune recette physique n’est déduite de ce test.

## Preuve de clôture du 8 octobre 2026

Source publique `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`, Worker `98d720dd-6364-436e-9a00-38809e4a3925`. Qualification `37765653443 SUCCESS` (646/646) ; livraison code-only `37765653486 SUCCESS` (Chromium 7/7, WebKit 6/6, smoke strict). Vérification publique indépendante /health + shell + catalogue 164 + garde de cache v15211 à 10:52 UTC. L'absence de mutation D1 est explicite dans le workflow ; aucune nouvelle sauvegarde/restauration D1 n'est prétendue. Le checkpoint Git exact de livraison est la preuve de source ; la référence antérieure effectivement observée est c0dcb82e24687bb3473b46ccd4c0c77b9e561310. Toute restauration de code doit reprendre le workflow qualifié et préserver les données. FIELD_ACCEPTED reste NOT_ACCEPTED pour les appareils/groupes physiques.
