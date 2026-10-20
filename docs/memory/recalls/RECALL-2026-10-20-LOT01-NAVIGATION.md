# Recall — Lot 01 navigation, 20 octobre 2026

Autorisation explicite du fondateur : implémenter et déployer le lot 1, puis poursuivre les lots suivants. Lecture effectuée des autorités de reprise, des conventions, des constitutions et du dossier du lot 1. CIR : `docs/change-impact/CIR-2026-10-20-LOT01-NAVIGATION.md`.

Base distante : `5cba15abc3e5d61f2ad35d40fefb5d320e3f28d2`, branche active `fix/1.5.2.10-offline-conflicts-loans-20261003`. Production avant ce lot : `5e7044ee2a8c346c0a36f905d74d41a2a2dfab0d`, 1.5.2.19. La copie de travail a été reconstruite depuis l'archive de livraison exacte, vérifiée par SHA-256, puis les neuf fichiers documentaires du HEAD ont été superposés. Le commit d'import local n'est pas un parent GitHub à publier.

Réemploi : `main.js` reste propriétaire de la navigation ; les boutons existants restent propriétaires de leurs destinations ; `ui-modes.js` reste propriétaire des modes ; la finance conserve ses propriétaires, ses brouillons, son outbox et ses messages Live. Le module de présentation ne transporte aucun montant. Favoris : au plus huit identifiants locaux, séparés par acteur/groupe, durée trente jours. Reprise : état de navigation en mémoire de l'onglet, borné et vidé à la déconnexion.

Qualification prévue : recherche bilingue, isolation et expiration ; clavier et petits écrans ; trois modes distincts ; brouillon et retour à la cellule ; régressions financières complètes Node, Chromium et WebKit ; fermeture du graphe PWA. Utiliser uniquement les comptes synthétiques locaux. Ne pas réutiliser la session Delor bloquée. Aucun accès ni modification de données financières réelles ne sont nécessaires.

Statut de ce rappel : candidat en qualification. La livraison ne sera déclarée qu'avec un run réussi et une santé publique au SHA exact. `FIELD_ACCEPTED=NOT_ACCEPTED`.
