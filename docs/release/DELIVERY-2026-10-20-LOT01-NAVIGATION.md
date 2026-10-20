# Lot 01 — navigation et cohérence visuelle

## Périmètre livré par le code candidat

- Barre de contexte personnel → groupe → espace/objet, rôle courant et retour à la feuille précédente.
- Menu des destinations existantes, recherche locale accentuée ou sans accents, synonymes français/anglais ; raccourci Ctrl/⌘ K, flèches, Échap, restitution du focus.
- Jusqu'à huit favoris choisis, conservés localement par compte/groupe pendant trente jours ; effacement possible, défaillance du stockage non bloquante.
- Recherche de fonctions dans la barre existante, avec navigation clavier. Aucun appel à une API de recherche par lettre.
- Modes visuel (13 px pour ces commandes), senior (17 px) et assisté (15 px et guide visible), en conservant l'accès aux mêmes actions.
- Reprise du contexte exact de saisie : séance, membre, rubrique, position et focus. Le montant reste dans le propriétaire du brouillon financier existant.

Ces éléments sont de présentation. Ils ne constituent ni un nouveau moteur financier, ni une mémoire de toutes les données utilisateur entre appareils, ni l'implémentation des vingt-sept autres lots.

## Qualification à consolider au SHA publié

La référence 1.5.2.19 vient de l'archive exacte GitHub vérifiée par SHA-256, avec les seuls documents ultérieurs du HEAD 5cba15a superposés. Le dossier incomplet `implementation/` n'a pas été publié.

Qualification locale déjà observée : 744/744 tests Node, six nouveaux contrôles de recherche/favoris inclus ; architecture, gouvernance, constitution, vérité, mémoire et couverture documentaire valides ; audit des dépendances : zéro vulnérabilité signalée. Le scénario navigateur conserve le brouillon 5432 et le focus après menu et détour par Marketplace, sans commande financière. Les neuf combinaisons 360/768/1366 × visuel/senior/assisté ont une largeur de dialogue contenue. Le viewport effectif 683×450 représente l'espace disponible d'une fenêtre 1366×900 à zoom 200 % ; le réglage natif du navigateur n'a pas été automatisé.

Incidents rencontrés et traités avant publication : boucle de notification de langue corrigée par comparaison de la valeur ; Échap du champ de recherche ne doit pas demander deux pressions pour fermer ; dialogue retiré du DOM quand fermé afin de préserver les sélecteurs des autres dialogues ; fixture financière sélectionnant le groupe par le sélecteur autorisé ; attente d'un résultat de recherche avant l'action clavier pour éviter une course avec la restauration initiale.

La compilation finale et les suites complètes Chromium/WebKit restent à inscrire après résultat. La livraison n'est pas encore attestée par ce document candidat. La publication est conditionnée aux contrôles du workflow de production, à la sauvegarde D1 restaurée avec intégrité, à la relecture privée R2 et à la comparaison publique des onze ressources servies avec le SHA livré, dont le nouveau module de navigation.

## Récupération et invariants

Revenir au Worker précédent et à sa source 5e7044e selon le reçu de livraison existant. Aucune migration à inverser, aucune recréation de D1/R2, aucun effacement de saisie. L'ancien cache 1.5.2.19 ainsi que les caches de récupération déjà conservés restent préservés. Les favoris sont des identifiants locaux facultatifs ; les enlever n'affecte pas la finance.

`realMoneyEnabled=false` ; 164 capacités minimum ; `FIELD_ACCEPTED=NOT_ACCEPTED`. Recette automatique sur données synthétiques, aucun contournement de la session Delor protégée. Aucun abonnement ni nouvelle bibliothèque obligatoire.

## Programme après publication

Selon les priorités du dossier gratuit, poursuivre L05 (séances, saisie, Live et tableaux), L28 (comparaison des effets et ressources), L02 (cockpits), L23 (Eco IA), L10 (commerce), L24 (notifications), L25 (SAV), puis les autres lots retenus. La numérotation n'est pas un ordre d'exécution. Achever, qualifier et publier chaque lot avant d'annoncer sa fin.

ÉTAT DU PROJET APRÈS ÉTAPE : lot 1 candidat implémenté ; qualification complète et preuve publique en cours. Coût exact des crédits non mesurable depuis la session.
