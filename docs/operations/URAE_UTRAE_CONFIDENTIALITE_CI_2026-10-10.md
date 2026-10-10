# URAE / UTRAE — frontière de confidentialité et CI (10 octobre 2026)

## Décision confirmée
- Dépôt privé et source canonique du produit : `Serge-As/urae`.
- Dépôt public auxiliaire, historique indépendant : `Serge-As/utrae`.
- Aucune duplication, publication, déploiement ou refonte du produit n'est autorisée par ce document.
- Les transferts des anciens chemins `SergeDelor/urae` et `SergeDelor/utrae` sont confirmés par consultation des dépôts sur le nouveau compte.

## Interdiction de publication : confidentialité par défaut
L'intégralité des documents privés, cahiers, sources, archives, historique, stratégies, données, schémas, tests révélateurs, journaux, captures et artefacts reste dans URAE privé.
Ce principe protège notamment les domaines : groupes, associations, tontines, rubriques et exceptions, règles, membres, séances, prêts, remboursements, dettes, épargne, intérêts et calculs de répartition de fin de cycle, assistance/solidarité, Discovery/Discover, Marketplace, Business, Identity, sécurité, IA, Live et Eco Relay.
Toute fonction ajoutée ultérieurement est privée par défaut, même si elle n'est pas énumérée.
Aucun extrait dérivé ou reformulé d'une logique métier privée ne peut être placé dans UTRAE.

## Périmètre strict d'UTRAE
Seuls des éléments entièrement synthétiques et indépendants, inspectés avant le premier push public, peuvent être publiés : démonstrations fictives, contrats génériques explicitement autorisés, tests indépendants et ressources libres de secrets.
Le contrôle de liste blanche déjà présent dans `tests/public-scope.test.mjs` constitue une défense supplémentaire, pas une garantie de confidentialité avant publication.
Interdictions : clone/checkout d'URAE dans la CI publique, miroir Git, submodule privé, token privé, artefact ou bundle du vrai produit, source map, migration D1, backup R2, logs et fixtures basés sur des données réelles.
Une PR publique verte ne qualifie pas l'application privée.

## Répartition des calculs sans couper les fonctions
- GitHub Actions URAE privé : validation des sources privées et gates financiers, sécurité, droits, hors connexion, confrontation, synchronisation et navigateurs; exécution dans un runner privé de confiance lorsque nécessaire.
- GitHub Actions UTRAE public : uniquement tests indépendants et éléments préalablement déclarés publics.
- Cloudflare Workers Builds : compilation et livraison privées strictement gouvernées; aucun usage de D1/R2 de production comme laboratoire CI.
- Mesurer minutes par workflow avant d'optimiser; ne supprimer ni test, ni fonctionnalité pour atteindre un quota de 2 000 ou de 3 000 minutes.
- Aucune qualification n'est déclarée PASS par simple existence d'un workflow ou d'une maquette.

## Conditions préalables pour une évolution
Audit des fichiers concernés, classification confidentiel/public, revue des permissions et des déclencheurs, qualification exacte du commit, preuve anti-régression, plan de retour arrière, validation de l'absence de fuite et approbation avant publication.
Respecter AGENTS.md, CURRENT_TRUTH, PROJECT_TRUTH_LEDGER, les cahiers, le registre et NEXT_RUN dans leur ordre de préséance.

## État de livraison inchangé
La candidate 1.5.2.15 n'est pas publiée; HOLD et PR #72 en brouillon demeurent. Maintenir `realMoneyEnabled=false` et `FIELD_ACCEPTED=NOT_ACCEPTED`.
Ce document n'autorise ni modification de production, ni mutation D1/R2, ni changement de secrets, ni publication de sources.
