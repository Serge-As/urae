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

La compilation finale ferme le graphe PWA (73 ressources initiales et 38 imports transitifs). Les deux qualifications GitHub indépendantes [39401856044](https://github.com/Serge-As/urae/actions/runs/39401856044) et [39401856043](https://github.com/Serge-As/urae/actions/runs/39401856043) réussissent sur le même code `611baffaba9f937d8fe9ae413b67bd7753f8f15f` : 744 tests natifs, 17 scénarios Chromium existants et 6 WebKit. Les trois scénarios de navigation ajoutés passent localement. Le workflow de livraison exige les 20 Chromium sur son SHA exact. Un accès facultatif à un sélecteur financier monté progressivement a également été corrigé pour préserver le chargement de la feuille.

La livraison n'est pas encore attestée par ce document candidat. La publication est conditionnée aux contrôles du workflow de production, à la sauvegarde D1 restaurée avec intégrité, à la relecture privée R2 et à la comparaison publique des onze ressources servies avec le SHA livré, dont le nouveau module de navigation.

## Récupération et invariants

Revenir au Worker précédent et à sa source 5e7044e selon le reçu de livraison existant. Aucune migration à inverser, aucune recréation de D1/R2, aucun effacement de saisie. L'ancien cache 1.5.2.19 ainsi que les caches de récupération déjà conservés restent préservés. Les favoris sont des identifiants locaux facultatifs ; les enlever n'affecte pas la finance.

`realMoneyEnabled=false` ; 164 capacités minimum ; `FIELD_ACCEPTED=NOT_ACCEPTED`. Recette automatique sur données synthétiques, aucun contournement de la session Delor protégée. Aucun abonnement ni nouvelle bibliothèque obligatoire.

## Programme après publication

Selon les priorités du dossier gratuit, poursuivre L05 (séances, saisie, Live et tableaux), L28 (comparaison des effets et ressources), L02 (cockpits), L23 (Eco IA), L10 (commerce), L24 (notifications), L25 (SAV), puis les autres lots retenus. La numérotation n'est pas un ordre d'exécution. Achever, qualifier et publier chaque lot avant d'annoncer sa fin.

ÉTAT DU PROJET APRÈS ÉTAPE : lot 1 candidat implémenté ; qualification complète et preuve publique en cours. Coût exact des crédits non mesurable depuis la session.

## Stabilisation de position, 20 octobre 2026

La version 1.5.2.20 est publiée au SHA `302c108795352cb4aaaaff283b935a681ce26c1a` ; livraison 39402988571 SUCCESS : 744 tests natifs, 20 Chromium et 6 WebKit, sauvegarde restaurée avec intégrité et onze empreintes publiques conformes. Worker `4cc48269-1435-493a-ab75-5ea447d81fba`. Reçu : `docs/release/evidence/LOT01-NAVIGATION-PUBLIC-2026-10-20.json`.

Un contrôle Windows complémentaire a relevé un décalage de défilement après F5 (19/20 scénarios locaux passent). Le contrôle avec l'ancienne interface passe ; retirer seulement la reprise de focus ne résout pas l'écart. Le candidat **1.5.2.21-navigation-stability** restaure immédiatement la position et exclut le bandeau fixe de l'ancrage automatique. Qualification ciblée puis workflow intégral exact-SHA requis avant de déclarer le lot clos. Aucun moteur financier, schéma, abonnement ou nouvelle dépendance.

Après fermeture de L01, poursuivre le classement : L05 → L28 → L02 → L23 → L10 → L24 → L25. FIELD_ACCEPTED=NOT_ACCEPTED. Coût exact des crédits non mesurable.

Les informations suivantes sont historiques et datées.

Contrôle Windows de la stabilisation : les deux scénarios ciblés passent (F5 avec position et comptes distincts ; menu/détour/reprise du brouillon). La restauration observe les changements de dimensions pendant au plus 1,5 seconde et cède immédiatement au prochain geste utilisateur ; une nouvelle navigation annule la précédente. La fermeture du menu résout les identifiants de la cellule si le champ initial a été remplacé. Un test supplémentaire provoque la reconstruction par le propriétaire canonique pendant le menu. Aucun montant ni commande financière ne transite dans cette référence de focus. Qualification complète du SHA exact encore obligatoire avant publication 1.5.2.21.
