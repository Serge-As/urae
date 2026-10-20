# Recall — Lot 01 navigation, 20 octobre 2026

Autorisation explicite du fondateur : implémenter et déployer le lot 1, puis poursuivre les lots suivants. Lecture effectuée des autorités de reprise, des conventions, des constitutions et du dossier du lot 1. CIR : `docs/change-impact/CIR-2026-10-20-LOT01-NAVIGATION.md`.

Base distante : `5cba15abc3e5d61f2ad35d40fefb5d320e3f28d2`, branche active `fix/1.5.2.10-offline-conflicts-loans-20261003`. Production avant ce lot : `5e7044ee2a8c346c0a36f905d74d41a2a2dfab0d`, 1.5.2.19. La copie de travail a été reconstruite depuis l'archive de livraison exacte, vérifiée par SHA-256, puis les neuf fichiers documentaires du HEAD ont été superposés. Le commit d'import local n'est pas un parent GitHub à publier.

Réemploi : `main.js` reste propriétaire de la navigation ; les boutons existants restent propriétaires de leurs destinations ; `ui-modes.js` reste propriétaire des modes ; la finance conserve ses propriétaires, ses brouillons, son outbox et ses messages Live. Le module de présentation ne transporte aucun montant. Favoris : au plus huit identifiants locaux, séparés par acteur/groupe, durée trente jours. Reprise : état de navigation en mémoire de l'onglet, borné et vidé à la déconnexion.

Qualification prévue : recherche bilingue, isolation et expiration ; clavier et petits écrans ; trois modes distincts ; brouillon et retour à la cellule ; régressions financières complètes Node, Chromium et WebKit ; fermeture du graphe PWA. Utiliser uniquement les comptes synthétiques locaux. Ne pas réutiliser la session Delor bloquée. Aucun accès ni modification de données financières réelles ne sont nécessaires.

Statut de ce rappel : candidat en qualification. La livraison ne sera déclarée qu'avec un run réussi et une santé publique au SHA exact. `FIELD_ACCEPTED=NOT_ACCEPTED`.

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
