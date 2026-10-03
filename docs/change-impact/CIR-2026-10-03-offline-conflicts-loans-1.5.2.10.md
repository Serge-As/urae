# CIR — 2026-10-03 — Eco-System 1.5.2.10 offline/conflicts/loans

## Fichiers métier principaux
- apps/web/index.html
- apps/web/src/main.js
- apps/web/src/completion-ui.js
- apps/web/styles.css
- apps/web/sw.js
- packages/application/src/index.ts
- workers/api/src/index.ts

## Effets métier
- correction de la version locale confirmée : `baselineVersion` est utilisée, pas la propriété inexistante `baselineCellVersion` ;
- une écriture hors ligne dont la baseline est devenue obsolète produit `CELL_VALUE_CONFLICT` au lieu d'un rebase silencieux ;
- les conflits Outbox ne sont plus interprétés comme confirmations ;
- les cellules en conflit sont marquées rouge + texte explicite + clignotement, avec variante sans animation ;
- l'état de navigation est persisté/restauré à travers le rechargement et la reprise réseau ;
- la reconnexion synchronise l'Outbox puis rafraîchit le contexte courant, sans relancer `start()` ;
- aucune boucle périodique de reconnexion ou de synchronisation n'est ajoutée ;
- le Service Worker sert immédiatement le shell cohérent installé lors d'un rechargement hors ligne ;
- le `periodicsync` Outbox est retiré ;
- l'Épargne est reconnue par kind, systemKey, nom ou facettes sémantiques ; l'historique archivé reste dans la vérité financière ;
- la priorité actuelle de la rubrique Prêt est utilisée pour les nouveaux calculs/ventilations ;
- Remboursements générique est ventilé automatiquement par `applyLoanPayment` ;
- liste des prêts, état des prêts ouverts et parcours d'une dette sont présentés en tableaux compacts ;
- les récapitulatifs de rubriques et de dettes utilisent un sélecteur pour n'afficher qu'un tableau à la fois.

## Preuves automatiques avant fusion
- qualification dédiée 1.5.2.10 : SUCCESS — run 37127257635 ;
- GEO Directory GPS Qualification : SUCCESS — run 37127261431 ;
- Chromium finance/persistance/shell : SUCCESS dans le run 37127257635 ;
- WebKit/iOS sovereign offline : SUCCESS dans le run 37127257635 ;
- PR #65 fusionnée au SHA `92f259192bd191f3b46e2041f0f65017f33ea0c0`.

## Déploiement
Code-only uniquement. D1 existante et R2 existant sont réutilisés. Aucune migration, aucun export, aucune création de base de remplacement.

## Recette terrain encore requise
Le lot n'est pas déclaré FIELD_ACCEPTED avant contrôle réel sur deux navigateurs/appareils :
- modification 1 500 → 3 000 persistante ;
- conflit 3 000 / 2 000 explicite ;
- F5 hors ligne sur la même page ;
- reconnexion et synchronisation sans actualisation manuelle ;
- total Épargne correct ;
- bascule CAPITAL_FIRST / INTEREST_FIRST observable ;
- nouveaux tableaux de prêts/dettes/rubriques utilisables.
