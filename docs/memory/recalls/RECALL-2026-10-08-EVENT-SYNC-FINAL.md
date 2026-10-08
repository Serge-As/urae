# RECALL — Eco 1.5.2.12 · synchronisation financière événementielle finale

Date : 2026-10-08  
Portée : Eco-System / feuilles financières / Outbox / Live / navigation

## Contexte rappelé

Le groupe doit pouvoir travailler hors ligne et la connexion serveur doit être une plus-value, pas une dépendance permanente. La synchronisation entre gestionnaires et membres doit être proactive lorsqu’un événement réel existe, sans requêtes de présence ou rafraîchissements D1 toutes les secondes.

Les exigences récentes à préserver sont :

- une validation de cellule est durable localement avant transport ;
- dès que le serveur accepte l’écriture, le delta est diffusé aux comptes/appareils connectés par le canal Live ;
- aucun polling D1 périodique en mode gratuit/conservation ;
- en cas d’échec réseau ambigu, la valeur reste dans l’Outbox et la reprise se fait sur un événement réel ;
- une seule reprise ciblée est autorisée après l’action de validation ; aucune boucle de retries silencieuse ;
- les événements de reprise sont notamment `online`, `eco:live-connected`, retour de focus/pageshow et Actualiser explicite ;
- un autre appareil connecté au même compte doit recevoir le delta commité, sans être filtré comme « événement de soi » ;
- `Remboursements` reste une rubrique métier de remboursement de prêt et sa saisie doit survivre synchro, actualisation et rechargement ;
- Actualiser doit conserver vue, séance, membre, feuille et positions verticale/horizontale ;
- la refonte visuelle reste data-first : membres, rubriques, séances, montants et totaux priment sur les états techniques.

## Interdictions de régression

Ne pas réintroduire :

- refresh/polling serveur toutes les 1, 2 ou 5 secondes ;
- relecture du Ledger ou du snapshot canonique après chaque push en mode gratuit ;
- F5 obligatoire pour sortir du hors-ligne ou recevoir une valeur distante ;
- remplacement d’une intention locale non confirmée par un push distant ;
- réhydratation de tous les services de l’application pour un simple Actualiser financier ;
- retour automatique au début du menu ou à la première colonne.

## Preuves attendues

La recette navigateur doit démontrer une saisie `Remboursements = 2 500 F CFA`, passage hors ligne puis retour réseau, confirmation serveur et convergence d’un second contexte navigateur en moins de cinq secondes, persistance après reload, position de matrice conservée, et absence de requêtes `/financial-cells/snapshot` ou `/live/events` pendant la fenêtre idle observée après le push.
