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
