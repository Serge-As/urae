# RECALL — 2026-10-03 — Live événementiel gratuit sans polling

Base figée : `eee813a7dc455e4e8ada1197f2760ba5c79234d1`.

## Retour terrain retenu
- le quota D1 gratuit a été épuisé par des lectures/rattrapages trop fréquents ;
- l'utilisateur veut un fonctionnement de type messagerie : aucune activité => aucune requête de mise à jour ;
- frappe, brouillon, validation, abandon et reconnexion sont les seuls déclencheurs Live utiles ;
- les acquis récents dettes, Remboursements, tableaux Épargne/Intérêts, récap rubriques et offline doivent être conservés.

## Décision
Le mode gratuit reste `FREE_CONSERVATION_MODE`, mais il ne gèle plus le WebSocket.
Il devient **event-push only** :
1. connexion WebSocket persistante ;
2. aucun polling D1 de cellule ;
3. aucun timer de rattrapage REST ;
4. aucun heartbeat de brouillon ;
5. TYPING envoyé au début d'une séquence de frappe, TYPING_STOP après inactivité ;
6. FINANCIAL_DRAFT envoyé uniquement à la création réelle du brouillon et CLEAR à sa suppression/validation ;
7. validation financière publiée par le serveur aux autres navigateurs avec la projection déjà commitée ;
8. reconnexion avec le dernier numéro de séquence : le Durable Object rejoue seulement les événements manqués ;
9. l'adressage du Durable Object utilise tenant + groupId, sans `groupIdentity.compute` par événement ;
10. Outbox gratuite : aucune boucle de retry automatique quand le quota est bloqué.

## Déploiement
Aucun déploiement Cloudflare ne doit être déclenché par ce lot tant que le quota journalier est épuisé. Qualification GitHub/local uniquement.
