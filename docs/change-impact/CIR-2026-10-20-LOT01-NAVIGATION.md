# CIR — Lot 01 : navigation et cohérence visuelle

## Autorisation et référence

Le 20 octobre 2026, le fondateur demande explicitement : « Implémente et déploie le lot 1. Dès que tu termines enchaînes avec la suite jusqu’à ce que le crédit s’épuise ». Cet accord couvre la réalisation et la publication du lot décrit dans le dossier des 92 propositions gratuites. Aucun abonnement, ajout de serveur ou changement de moteur financier n’est nécessaire.

Référence distante observée : branche de livraison fix/1.5.2.10-offline-conflicts-loans-20261003, tête 5cba15abc3e5d61f2ad35d40fefb5d320e3f28d2. Dernière livraison attestée avant travail : 5e7044e / 1.5.2.19. Copie isolée issue de l’archive GitHub de ce SHA, hash vérifié, puis delta documentaire 5cba15a repris. Le commit local d’import sert au diff local ; il ne représente pas un nouveau déploiement.

## Bénéfice, solution et propriétaire

Rendre les fonctions existantes faciles à retrouver sans changer leurs parcours. Nouveau composant de présentation shell-navigation : contexte personnel/groupe/écran, menu complet, recherche FR/EN locale, favoris locaux séparés par compte/groupe, accès clavier et reprise de la feuille quittée. Chaque destination clique le bouton canonique mainNav : pas de deuxième routeur, de commande financière ni de moteur métier.

Fichiers : nouveau composant, raccords bornés dans main.js, styles ciblés, contrat de version/PWA et preuves. Réutilisation du mode UI existant ; aucune nouvelle bibliothèque. Les favoris stockent seulement identifiant de destination et date, maximum huit, expiration trente jours. La reprise de saisie reste en mémoire de fenêtre ; elle ne prétend pas synchroniser les appareils.

## Conséquences indirectes et protection

- Ouverture de dialogue : risque de perte de focus ou de première frappe ; fermer restitue le champ existant, sans reconstruire la feuille. Tester brouillon et présence.
- Droits et changement de groupe : risque de raccourci ancien ; relire les boutons actuels à l’activation, isoler les favoris, supprimer le contexte visible à la déconnexion. Serveur toujours autoritaire.
- Petit écran et zoom : risque de masquer une action ; menu dimensionné au viewport, accès clavier et tests 360/768/1366 pixels. Styles du composant seulement, tokens financiers inchangés.
- Import statique : nouveau fichier nécessaire à la PWA ; fermeture transitive du shell et nouvelle identité de cache obligatoires. Préserver les caches de récupération et les données locales.
- Coûts : pas de lecture réseau à chaque caractère ; index de navigation en mémoire. Aucun polling ni nouvel endpoint.
- Reprise : seules références de navigation sont transmises ; aucun montant ne réside dans le composant. Préserver les brouillons canoniques et vérifier le focus.

## Recette et retour arrière

Tests de recherche multilingue et favoris avec séparation A/B, expiration et stockage refusé. Navigateur synthétique : clavier, favori, compte/groupe, trois densités, largeur et zoom, champs conservés et reprise. Suites financières, conflits, hors ligne et PWA existantes conservées. Qualification du candidat intégré exact avant publication, puis health/catalogue et empreintes des ressources publiques.

Aucune migration D1/R2, purge, activation d’argent réel ou rotation de clé. Retrait du raccord du composant et retour à une livraison cohérente possible ; les anciennes routes et boutons demeurent disponibles. La nouvelle préférence locale n’a pas d’effet comptable. FIELD_ACCEPTED reste NOT_ACCEPTED tant qu’aucune recette terrain n’est attestée.

État initial : implémentation et qualification en cours. Aucun succès applicatif ni déploiement nouveau annoncé à ce stade.

## Stabilisation de position, 20 octobre 2026

La version 1.5.2.20 est publiée au SHA `302c108795352cb4aaaaff283b935a681ce26c1a` ; livraison 39402988571 SUCCESS : 744 tests natifs, 20 Chromium et 6 WebKit, sauvegarde restaurée avec intégrité et onze empreintes publiques conformes. Worker `4cc48269-1435-493a-ab75-5ea447d81fba`. Reçu : `docs/release/evidence/LOT01-NAVIGATION-PUBLIC-2026-10-20.json`.

Un contrôle Windows complémentaire a relevé un décalage de défilement après F5 (19/20 scénarios locaux passent). Le contrôle avec l'ancienne interface passe ; retirer seulement la reprise de focus ne résout pas l'écart. Le candidat **1.5.2.21-navigation-stability** restaure immédiatement la position et exclut le bandeau fixe de l'ancrage automatique. Qualification ciblée puis workflow intégral exact-SHA requis avant de déclarer le lot clos. Aucun moteur financier, schéma, abonnement ou nouvelle dépendance.

Après fermeture de L01, poursuivre le classement : L05 → L28 → L02 → L23 → L10 → L24 → L25. FIELD_ACCEPTED=NOT_ACCEPTED. Coût exact des crédits non mesurable.

Les informations suivantes sont historiques et datées.

Contrôle Windows de la stabilisation : les deux scénarios ciblés passent (F5 avec position et comptes distincts ; menu/détour/reprise du brouillon). La restauration observe les changements de dimensions pendant au plus 1,5 seconde et cède immédiatement au prochain geste utilisateur ; une nouvelle navigation annule la précédente. La fermeture du menu résout les identifiants de la cellule si le champ initial a été remplacé. Un test supplémentaire provoque la reconstruction par le propriétaire canonique pendant le menu. Aucun montant ni commande financière ne transite dans cette référence de focus. Qualification complète du SHA exact encore obligatoire avant publication 1.5.2.21.


## Clôture vérifiée

Production **1.5.2.21-navigation-stability**, source `5c9366445d6699b7a608f06a49a4efb61ec7d1ff`, build `eco-system-1.5.2.21-20261020-navigation-stability`, cache `eco-system-v15221-navigation-stability-20261020`, Worker `44612486-e62b-480f-820c-134f98ffc617`. Livraison [39406749561 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39406749561) et qualification indépendante [39406749566 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39406749566) sur ce même SHA. Le workflow de livraison réussit 744 tests natifs, 20 Chromium et 6 WebKit. Quatre contrôles ciblés sur la version compilée passent aussi sous Windows ; six tests de recherche/favoris passent localement.

Menu complet des destinations autorisées existantes ; recherche locale bilingue et clavier ; huit favoris maximum par compte/groupe avec expiration ; barre de contexte et rôle ; modes distincts ; retour à la feuille, au brouillon et à la cellule. La stabilisation corrige le défilement lors du chargement différé et le focus si une cellule est reconstruite pendant le menu. Aucune réécriture des moteurs financiers, nouvelle dépendance ou migration.

Sauvegarde D1 restaurée avec intégrité `ok`, archive privée relue et empreinte vérifiée ; hash `f10b71bd8113c2793ab351a619c56430f508185a4e92458a7b32fd3df3decc18`. Onze ressources publiques identiques au build exact, catalogue 164, argent réel désactivé. Reçu : `docs/release/evidence/LOT01-STABILITY-PUBLIC-2026-10-20.json` ; vérification du workflow à 10:24:12.353 UTC et santé publique lue dans cette session à 10:25:51.950 UTC.

**Suite autorisée : L05 → L28 → L02 → L23 → L10 → L24 → L25**, puis les autres lots selon priorité. L05 commence par les acquis des séances et l'enrichissement I02 de répétition sur données fictives. Ne pas reprendre l'audit général ni publier le miroir incomplet `implementation/`. Checkout courant : `implementation-lot01-20261020`. La recette est synthétique ; FIELD_ACCEPTED=NOT_ACCEPTED. Coût exact des crédits non mesurable.

Les informations suivantes sont historiques et conservent leurs dates.
