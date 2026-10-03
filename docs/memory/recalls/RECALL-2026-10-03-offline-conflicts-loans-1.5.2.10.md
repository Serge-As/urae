# RECALL — 2026-10-03 — Offline reload, conflits financiers et prêts 1.5.2.10

Base opérationnelle avant lot : `71dbdfa52adf86585e950f8ce2d7e8b7fe579d08`.
Fusion du lot : `92f259192bd191f3b46e2041f0f65017f33ea0c0`.

## Retour terrain retenu
- une cellule modifiée de 1 500 à 3 000 pouvait être ramenée visuellement à 1 500 par une projection plus ancienne ;
- deux appareils pouvaient modifier hors ligne la même cellule (ex. 1 000 → 3 000 et 1 000 → 2 000) sans conflit visible ;
- F5/rechargement hors ligne pouvait perdre la page de travail ;
- la reconnexion pouvait être lente et redémarrer toute l'application au lieu de reprendre la vue courante ;
- le total Épargne pouvait tomber à 0 lorsque l'identification de la rubrique ne couvrait pas l'historique/les facettes métier ;
- la priorité de remboursement affichée/calculée pouvait rester figée sur l'ancienne politique du prêt ;
- une rubrique générique Remboursements doit ventiler automatiquement principal/intérêts selon CAPITAL_FIRST ou INTEREST_FIRST ;
- les listes de prêts, prêts ouverts, récapitulatifs et parcours de dette doivent rester utilisables avec des dizaines d'éléments.

## Décisions conservées
1. aucune réécriture globale du moteur financier ;
2. Ledger, valeurs exactes et Outbox restent les propriétaires canoniques ;
3. aucune valeur divergente hors ligne n'écrase silencieusement une autre ;
4. le conflit financier persiste localement et devient rouge/clignotant jusqu'à examen humain ;
5. rechargement PWA hors ligne : shell cohérent installé d'abord, sans attente réseau inutile ;
6. reconnexion uniquement sur événements réseau/retour visible/focus, sans polling ;
7. reprise dans la même vue, séance, fiche et position de travail ;
8. l'Épargne historique reste comptée même si la rubrique est archivée ou identifiée par ses facettes métier ;
9. la politique actuelle de prêt prime pour la ventilation d'un nouveau remboursement ;
10. une rubrique Remboursements générique utilise AUTO et le moteur de priorité ;
11. les listes longues de prêts et dettes utilisent des tableaux et sélecteurs uniques.

## Garde-fous
- argent réel : OFF ;
- aucune migration D1 ;
- aucun export D1 demandé ;
- déploiement code-only ;
- FIELD_ACCEPTED reste faux jusqu'à la recette réelle multi-navigateurs de l'utilisateur.
